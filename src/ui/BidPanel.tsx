// The human's bidding buttons, in two steps:
//   1. choose trump (order up / pick it up in round 1, a suit in round 2) or pass
//   2. once trump is chosen, decide whether to go alone (or go back)
// Which buttons appear comes straight from the engine's legalBids(), so the
// screen can never offer an illegal bid.

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BidAction, BiddingState, isDealerStuck, legalBids } from '../engine/bidding';
import { Suit, SUIT_SYMBOLS } from '../engine/cards';
import { Button } from './Button';
import { FadeIn } from './motion';
import { suitText } from './text';
import { colors } from './theme';
import { HUMAN } from './useEuchre';

// Trump has been chosen but not yet confirmed: the suit that would be trump,
// and how to build the bid once "alone" is decided.
interface PendingCall {
  trump: Suit;
  makeBid: (alone: boolean) => BidAction;
}

interface Props {
  bidding: BiddingState;
  onBid: (bid: BidAction) => void;
}

export function BidPanel({ bidding, onBid }: Props) {
  const [pending, setPending] = useState<PendingCall | null>(null);

  // Step 2: trump chosen, now partner or alone?
  if (pending) {
    return (
      <FadeIn key="alone" fromY={16} style={styles.panel}>
        <Text style={styles.prompt}>{suitText(pending.trump)} is trump. Go alone?</Text>
        <View style={styles.row}>
          <Button label="With partner" onPress={() => onBid(pending.makeBid(false))} />
          <Button label="Go alone (4 pts)" variant="secondary" onPress={() => onBid(pending.makeBid(true))} />
        </View>
        <Button label="‹ Back" variant="secondary" onPress={() => setPending(null)} />
      </FadeIn>
    );
  }

  // Step 1: choose trump, or pass.
  const bids = legalBids(bidding);
  const canPass = bids.some((b) => b.type === 'pass');
  const suits = bids.flatMap((b) => (b.type === 'callSuit' && !b.alone ? [b.suit] : []));

  const prompt =
    bidding.round === 1
      ? `Make ${SUIT_SYMBOLS[bidding.upCard.suit]} trump?`
      : isDealerStuck(bidding)
        ? 'Stick the dealer: you must call a suit'
        : 'Name a trump suit, or pass';

  return (
    <FadeIn key="trump" fromY={-16} style={styles.panel}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.row}>
        {bidding.round === 1 ? (
          <Button
            label={bidding.dealer === HUMAN ? 'Pick it up' : 'Order up'}
            onPress={() => setPending({ trump: bidding.upCard.suit, makeBid: (alone) => ({ type: 'orderUp', alone }) })}
          />
        ) : (
          suits.map((suit) => (
            <Button
              key={suit}
              label={SUIT_SYMBOLS[suit]}
              onPress={() => setPending({ trump: suit, makeBid: (alone) => ({ type: 'callSuit', suit, alone }) })}
            />
          ))
        )}
        {canPass && <Button label="Pass" variant="secondary" onPress={() => onBid({ type: 'pass' })} />}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    gap: 8,
  },
  prompt: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
