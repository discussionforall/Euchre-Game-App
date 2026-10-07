// The middle of the table: the up card during bidding, the trick during play.
//
// Motion:
//   - a played card flies in from its player's seat, spinning slightly, and
//     lands with a little bounce at a small tilt
//   - when the trick is complete the winning card pulses, then every card
//     sweeps off toward the winner and fades out
//   - the up card is revealed with a flip after the deal, and flips face
//     down again when everyone passes in round 1

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Card, cardLabel } from '../engine/cards';
import { Play } from '../engine/rules';
import { Seat } from '../engine/seats';
import { CardView } from './CardView';
import { cardSize, colors } from './theme';
import { cardTilt, SEAT_OFFSET } from './motion';
import { Timings } from './useEuchre';

const AREA = { width: 190, height: 200 };
const CARD = cardSize.small;
const CENTER = { x: AREA.width / 2, y: AREA.height / 2 };

// Where the middle of each player's card comes to rest inside the area.
const LANDING: Record<Seat, { x: number; y: number }> = {
  0: { x: CENTER.x, y: AREA.height - CARD.height / 2 },
  1: { x: CARD.width / 2, y: CENTER.y },
  2: { x: CENTER.x, y: CARD.height / 2 },
  3: { x: AREA.width - CARD.width / 2, y: CENTER.y },
};

// Cards spin a little on the way in, in the direction they are thrown.
const START_SPIN: Record<Seat, number> = { 0: -25, 1: -35, 2: 25, 3: 35 };

interface PlayedCardProps {
  play: Play;
  // Set once the trick is complete.
  winner: Seat | null;
  timings: Timings;
}

function PlayedCard({ play, winner, timings }: PlayedCardProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const collect = useRef(new Animated.Value(0)).current;
  const isWinner = winner === play.seat;

  // Fly in from the player's seat.
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, speed: 12, bounciness: 7, useNativeDriver: true }).start();
  }, [enter]);

  // Trick complete: pulse the winning card, wait, then sweep to the winner.
  useEffect(() => {
    if (winner === null) return;
    const pulseWinner = Animated.sequence([
      Animated.delay(220),
      Animated.spring(pulse, { toValue: 1.22, speed: 30, bounciness: 14, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, speed: 16, bounciness: 8, useNativeDriver: true }),
    ]);
    const sweep = Animated.sequence([
      Animated.delay(timings.collectAfter),
      Animated.timing(collect, {
        toValue: 1,
        duration: timings.collectDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    Animated.parallel(isWinner ? [pulseWinner, sweep] : [sweep]).start();
  }, [winner, isWinner, pulse, collect, timings]);

  const landing = LANDING[play.seat];
  const from = {
    x: CENTER.x + SEAT_OFFSET[play.seat].x - landing.x,
    y: CENTER.y + SEAT_OFFSET[play.seat].y - landing.y,
  };
  const target = winner === null ? { x: 0, y: 0 } : {
    x: CENTER.x + SEAT_OFFSET[winner].x * 0.75 - landing.x,
    y: CENTER.y + SEAT_OFFSET[winner].y * 0.75 - landing.y,
  };
  const tilt = cardTilt(play.card);

  const motion = {
    opacity: Animated.multiply(
      enter.interpolate({ inputRange: [0, 0.25], outputRange: [0, 1], extrapolate: 'clamp' }),
      collect.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
    ),
    transform: [
      {
        translateX: Animated.add(
          enter.interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }),
          collect.interpolate({ inputRange: [0, 1], outputRange: [0, target.x] }),
        ),
      },
      {
        translateY: Animated.add(
          enter.interpolate({ inputRange: [0, 1], outputRange: [from.y, 0] }),
          collect.interpolate({ inputRange: [0, 1], outputRange: [0, target.y] }),
        ),
      },
      {
        rotate: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [`${tilt + START_SPIN[play.seat]}deg`, `${tilt}deg`],
        }),
      },
      {
        scale: Animated.multiply(
          Animated.multiply(enter.interpolate({ inputRange: [0, 1], outputRange: [1.35, 1] }), pulse),
          collect.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
        ),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.played,
        { left: landing.x - CARD.width / 2, top: landing.y - CARD.height / 2, zIndex: isWinner ? 2 : 1 },
        motion,
      ]}
    >
      <CardView card={play.card} size="small" highlight={isWinner} />
    </Animated.View>
  );
}

// The up card: dealt face down, flipped face up after the deal, and flipped
// back over if everyone passes in round 1.
function UpCard({ card, faceDown, revealDelay }: { card: Card; faceDown: boolean; revealDelay: number }) {
  // 0 = face up, 1 = face down.
  const flip = useRef(new Animated.Value(1)).current;
  const isFirstRun = useRef(true);

  useEffect(() => {
    const delay = isFirstRun.current ? revealDelay : 0;
    isFirstRun.current = false;
    Animated.timing(flip, {
      toValue: faceDown ? 1 : 0,
      delay,
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [faceDown, flip, revealDelay]);

  // Halfway through the turn, swap which side is visible.
  const front = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] }),
    transform: [{ perspective: 800 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
  };
  const back = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] }),
    transform: [{ perspective: 800 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) }],
  };

  return (
    <View style={styles.upCard}>
      <View style={styles.flipBox}>
        <Animated.View style={[styles.flipFace, back]}>
          <CardView />
        </Animated.View>
        <Animated.View style={[styles.flipFace, front]}>
          <CardView card={card} />
        </Animated.View>
      </View>
      <Text style={styles.label}>{faceDown ? 'Turned down' : 'Up card'}</Text>
    </View>
  );
}

interface Props {
  plays: readonly Play[];
  winner: Seat | null;
  // Shown in the middle while bidding; faceDown once it has been turned down.
  upCard: Card | null;
  upCardFaceDown: boolean;
  // How long the deal animation takes, so the up card is revealed after it.
  dealDuration: number;
  timings: Timings;
}

export function TrickArea({ plays, winner, upCard, upCardFaceDown, dealDuration, timings }: Props) {
  return (
    <View style={styles.area}>
      {upCard && (
        // Keyed by the card so each new hand gets a fresh deal-and-reveal.
        <UpCard key={cardLabel(upCard)} card={upCard} faceDown={upCardFaceDown} revealDelay={dealDuration} />
      )}
      {plays.map((play) => (
        // Keyed by the card too, so a new trick's card animates even from the same seat.
        <PlayedCard key={`${play.seat}-${cardLabel(play.card)}`} play={play} winner={winner} timings={timings} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: AREA.width,
    height: AREA.height,
  },
  played: {
    position: 'absolute',
  },
  upCard: {
    position: 'absolute',
    top: (AREA.height - 104) / 2,
    left: (AREA.width - 100) / 2,
    width: 100,
    alignItems: 'center',
  },
  flipBox: {
    width: cardSize.normal.width,
    height: cardSize.normal.height,
  },
  flipFace: {
    position: 'absolute',
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
});
