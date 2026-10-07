// The whole table. Layout (portrait):
//
//            [ score / trump ]
//               [ Partner ]
//   [ West ]   [ trick area ]   [ East ]
//              [ status line ]
//          [ bid buttons, if any ]
//              [ your hand ]

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sittingOut } from '../engine/bidding';
import { Card, sameCard } from '../engine/cards';
import { playableCards } from '../engine/game';
import { Seat, teamOf } from '../engine/seats';
import { tricksWonBy } from '../engine/scoring';
import { useAppState } from './AppState';
import { BidPanel } from './BidPanel';
import { CardView } from './CardView';
import { DealtCard } from './DealtCard';
import { FadeIn } from './motion';
import { ResultOverlay } from './ResultOverlay';
import { ScoreNumber } from './ScoreNumber';
import { SeatPanel } from './SeatPanel';
import {
  describeAnnouncement,
  describeCall,
  describeContract,
  describeHandResult,
  SEAT_NAMES,
  sortHand,
  TEAM_NAMES,
} from './text';
import { colors } from './theme';
import { TrickArea } from './TrickArea';
import { goBackOrHome } from './ScreenHeader';
import { DEAL_DURATION_MS, DEAL_STAGGER_MS, HUMAN } from './useEuchre';

export function GameScreen() {
  const {
    game,
    bidLog,
    shownTrick,
    announcement,
    humanCanAct,
    act,
    nextHand,
    timings,
    started,
    startNewGame,
    setActive,
  } = useAppState();
  const insets = useSafeAreaInsets();

  // Opened without a game (e.g. from a link): deal one.
  useEffect(() => {
    if (!started) startNewGame();
  }, [started, startNewGame]);

  // Bots only play while this screen is visible.
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [setActive]),
  );
  const { contract, phase } = game;
  const trump = contract?.trump ?? null;
  const out = contract ? sittingOut(contract) : null;
  const winners = game.completedTricks.map((t) => t.winner);
  // Different for every hand (the scores change each hand), so components
  // keyed by it replay their deal animation when a new hand starts.
  const handKey = `${game.dealer}-${game.scores[0]}-${game.scores[1]}`;

  // --- Bot seats ----------------------------------------------------------
  const seatMessage = (seat: Seat): string | null => {
    if (phase === 'bidding') return bidLog[seat];
    if (contract && contract.maker === seat) return `Called ${describeCall(contract)}`;
    return null;
  };
  const seatPanel = (seat: Seat) => (
    <SeatPanel
      seat={seat}
      cardCount={game.hands[seat].length}
      isDealer={game.dealer === seat}
      isTurn={!shownTrick && !announcement && game.turn === seat && phase !== 'handOver' && phase !== 'gameOver'}
      isSittingOut={out === seat}
      message={seatMessage(seat)}
      tricksWon={contract && phase !== 'bidding' ? winners.filter((w) => w === seat).length : null}
      handKey={handKey}
    />
  );

  // --- Your hand ----------------------------------------------------------
  const discarding = phase === 'discard' && game.dealer === HUMAN && humanCanAct;
  const handCards = sortHand(discarding ? [...game.hands[HUMAN], game.upCard] : game.hands[HUMAN], trump);
  const playable = humanCanAct && phase === 'playing' ? playableCards(game) : [];

  const onCardPress = (card: Card) => {
    if (discarding) act({ type: 'discard', card });
    else act({ type: 'play', card });
  };
  const canTap = (card: Card) => discarding || playable.some((p) => sameCard(p, card));
  const greyOut = (card: Card) => humanCanAct && phase === 'playing' && !canTap(card);
  const isUpCard = (card: Card) => discarding && sameCard(card, game.upCard);

  // --- Status line --------------------------------------------------------
  let status: string;
  if (announcement) {
    status = ''; // the trump banner says it all
  } else if (shownTrick) {
    status = shownTrick.winner === HUMAN ? 'You take the trick' : `${SEAT_NAMES[shownTrick.winner]} takes the trick`;
  } else if (out === HUMAN && phase === 'playing') {
    status = 'Your partner is going alone. You sit this hand out.';
  } else if (discarding) {
    status = 'You picked up the card. Tap a card to discard.';
  } else if (humanCanAct && phase === 'playing') {
    status = game.trick.length === 0 ? 'Your lead: tap a card' : 'Your turn: tap a card';
  } else if (humanCanAct && phase === 'bidding') {
    status = '';
  } else if (phase === 'discard') {
    status = `${SEAT_NAMES[game.dealer]} is discarding…`;
  } else if (phase === 'bidding' || phase === 'playing') {
    status = `Waiting for ${SEAT_NAMES[game.turn]}…`;
  } else {
    status = '';
  }

  // Trump was just chosen: say who chose it (and who picks up the card).
  const banner = announcement ? describeAnnouncement(announcement, game.dealer, game.upCard) : null;

  // --- Header -------------------------------------------------------------
  const headerDetail = contract
    ? `Trump: ${describeContract(contract)}  ·  Tricks ${tricksWonBy(0, winners)}–${tricksWonBy(1, winners)}`
    : `Bidding, round ${game.bidding.round}`;

  // --- End of hand / game -------------------------------------------------
  let overlay = null;
  const scoreLine = `${TEAM_NAMES[0]} ${game.scores[0]}  –  ${game.scores[1]} ${TEAM_NAMES[1]}`;
  if (!shownTrick && phase === 'handOver' && game.lastHandScore && contract) {
    const makerTricks = tricksWonBy(teamOf(contract.maker), winners);
    const result = describeHandResult(game.lastHandScore, contract, makerTricks);
    // Celebrate a march or a euchre that went our way.
    const celebrate = game.lastHandScore.team === teamOf(HUMAN) && game.lastHandScore.outcome !== 'made';
    overlay = (
      <ResultOverlay {...result} scoreLine={scoreLine} buttonLabel="Next hand" onPress={nextHand} celebrate={celebrate} />
    );
  } else if (!shownTrick && phase === 'gameOver' && game.winner !== null) {
    const won = game.winner === teamOf(HUMAN);
    overlay = (
      <ResultOverlay
        title={won ? 'You win!' : 'You lose'}
        detail={won ? 'You and your partner reached 10 points.' : 'The opponents reached 10 points.'}
        scoreLine={scoreLine}
        buttonLabel="New game"
        onPress={startNewGame}
        secondaryLabel="Home"
        onSecondary={goBackOrHome}
        celebrate={won}
      />
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{TEAM_NAMES[0]}</Text>
          <ScoreNumber value={game.scores[0]} />
          <Text style={styles.score}> – </Text>
          <ScoreNumber value={game.scores[1]} />
          <Text style={styles.score}>{TEAM_NAMES[1]}</Text>
        </View>
        <FadeIn key={headerDetail} fromY={-6}>
          <Text style={styles.headerDetail}>{headerDetail}</Text>
        </FadeIn>
        {/* The game is kept: "Continue game" on the home screen comes back here. */}
        <Pressable onPress={goBackOrHome} style={styles.home} hitSlop={10}>
          <Text style={styles.homeText}>‹ Home</Text>
        </Pressable>
      </View>

      <View style={styles.top}>{seatPanel(2)}</View>

      <View style={styles.middle}>
        {seatPanel(1)}
        <TrickArea
          plays={shownTrick ? shownTrick.plays : game.trick}
          winner={shownTrick?.winner ?? null}
          // The up card stays on the table until the dealer actually picks it up.
          upCard={phase === 'bidding' || (phase === 'discard' && !discarding) ? game.upCard : null}
          upCardFaceDown={game.bidding.round === 2}
          dealDuration={DEAL_DURATION_MS}
          timings={timings}
        />
        {seatPanel(3)}
      </View>

      <View style={styles.controls}>
        {banner && (
          <FadeIn key="announce" fromScale={0.6} fromY={0} style={styles.banner}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            {banner.details.map((line) => (
              <Text key={line} style={styles.bannerDetail}>
                {line}
              </Text>
            ))}
          </FadeIn>
        )}
        {status !== '' && (
          // Keyed by the text so each new message slides in.
          <FadeIn key={status}>
            <Text style={styles.status}>{status}</Text>
          </FadeIn>
        )}
        {humanCanAct && phase === 'bidding' && (
          <FadeIn key={`bid-${game.bidding.round}`} fromY={24} fromScale={0.9}>
            <BidPanel bidding={game.bidding} onBid={(bid) => act({ type: 'bid', bid })} />
          </FadeIn>
        )}
        {phase === 'bidding' && bidLog[HUMAN] && !humanCanAct && (
          <FadeIn key={bidLog[HUMAN]}>
            <Text style={styles.myBid}>You said: {bidLog[HUMAN]}</Text>
          </FadeIn>
        )}
      </View>

      <View style={[styles.handArea, out === HUMAN && styles.sittingOut]}>
        <Text style={styles.handLabel}>
          You{game.dealer === HUMAN ? ' (dealer)' : ''}
          {contract && phase !== 'bidding' ? `  ·  Tricks: ${winners.filter((w) => w === HUMAN).length}` : ''}
        </Text>
        {/* Keyed by the hand so every new hand is dealt in again. */}
        <View key={handKey} style={styles.hand}>
          {handCards.map((card, i) => (
            <DealtCard
              key={`${card.rank}${card.suit}`}
              // The picked-up card joins straight away; a fresh hand is dealt one by one.
              delay={isUpCard(card) ? 0 : i * DEAL_STAGGER_MS}
              lifted={humanCanAct && canTap(card) && !discarding}
            >
              <CardView
                card={card}
                disabled={greyOut(card)}
                onPress={humanCanAct && canTap(card) ? () => onCardPress(card) : undefined}
              />
            </DealtCard>
          ))}
        </View>
      </View>

      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
    paddingHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: colors.feltDark,
    borderRadius: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  score: {
    color: colors.text,
    fontSize: 15,
  },
  headerDetail: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  home: {
    position: 'absolute',
    top: 6,
    left: 8,
  },
  homeText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  top: {
    alignItems: 'center',
    marginTop: 8,
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  controls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  banner: {
    backgroundColor: colors.feltDark,
    borderColor: colors.gold,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 4,
  },
  bannerTitle: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerDetail: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  myBid: {
    color: colors.textDim,
    fontSize: 14,
  },
  handArea: {
    alignItems: 'center',
  },
  sittingOut: {
    opacity: 0.45,
  },
  handLabel: {
    color: colors.textDim,
    fontSize: 13,
    marginBottom: 6,
  },
  hand: {
    flexDirection: 'row',
    gap: 4,
    minHeight: 86,
    paddingTop: 14, // room for playable cards to lift
    alignItems: 'flex-end',
  },
});
