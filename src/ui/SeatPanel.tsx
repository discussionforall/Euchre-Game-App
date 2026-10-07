// A bot's spot at the table: name, face-down cards, and what they said.
//
// Motion: a pulsing gold glow while it is their turn, bouncing "thinking"
// dots while they decide, speech bubbles that pop in, and cards that are
// dealt in one by one at the start of each hand.

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Seat } from '../engine/seats';
import { CardView } from './CardView';
import { DEAL_STAGGER_MS } from './useEuchre';
import { FadeIn, usePulse } from './motion';
import { SEAT_NAMES } from './text';
import { colors } from './theme';

// Three dots that bounce one after another.
function ThinkingDots() {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [wave]);

  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => {
        // Each dot jumps during its own third of the cycle.
        const start = i / 3;
        const translateY = wave.interpolate({
          inputRange: [0, start, start + 0.15, start + 0.3, 1].map((v) => Math.min(v, 1)),
          outputRange: [0, 0, -5, 0, 0],
          extrapolate: 'clamp',
        });
        return <Animated.View key={i} style={[styles.dot, { transform: [{ translateY }] }]} />;
      })}
    </View>
  );
}

interface Props {
  seat: Seat;
  cardCount: number;
  isDealer: boolean;
  isTurn: boolean;
  isSittingOut: boolean;
  // A bid to show in a speech bubble, e.g. "Pass".
  message: string | null;
  tricksWon: number | null;
  // Changes every hand; used to replay the deal animation.
  handKey: string;
}

export function SeatPanel({ seat, cardCount, isDealer, isTurn, isSittingOut, message, tricksWon, handKey }: Props) {
  const glow = usePulse(isTurn);
  const glowStyle = {
    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
  };

  return (
    <View style={[styles.panel, isSittingOut && styles.sittingOut]}>
      {isTurn && <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />}

      <View style={styles.nameRow}>
        <Text style={styles.name}>{SEAT_NAMES[seat]}</Text>
        {isDealer && <Text style={styles.dealer}>D</Text>}
      </View>

      <View key={handKey} style={styles.cards}>
        {Array.from({ length: cardCount }, (_, i) => (
          <FadeIn key={i} delay={i * DEAL_STAGGER_MS} fromY={-30} fromScale={0.4} style={i > 0 && styles.overlap}>
            <CardView size="tiny" />
          </FadeIn>
        ))}
      </View>

      {isSittingOut ? (
        <Text style={styles.info}>Sitting out</Text>
      ) : tricksWon !== null ? (
        <Text style={styles.info}>Tricks: {tricksWon}</Text>
      ) : null}

      {isTurn && !isSittingOut ? (
        <View style={styles.bubble}>
          <ThinkingDots />
        </View>
      ) : (
        message && (
          // Keyed by the text so every new bid pops in.
          <FadeIn key={message} fromY={6} fromScale={0.3} style={styles.bubble}>
            <Text style={styles.bubbleText}>{message}</Text>
          </FadeIn>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    padding: 6,
    minWidth: 84,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: 'rgba(242, 193, 78, 0.12)',
  },
  sittingOut: {
    opacity: 0.45,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dealer: {
    backgroundColor: colors.gold,
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 11,
    paddingHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cards: {
    flexDirection: 'row',
    marginTop: 4,
    height: 32,
  },
  overlap: {
    marginLeft: -12,
  },
  info: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  bubble: {
    marginTop: 4,
    backgroundColor: colors.cardFace,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 20,
    justifyContent: 'center',
  },
  bubbleText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.black,
  },
});
