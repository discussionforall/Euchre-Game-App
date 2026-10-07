// Bot decisions before play: ordering up / calling trump, and the dealer's discard.

import { BidAction, isDealerStuck } from '../engine/bidding';
import { Card, sameCard, Suit, SUITS } from '../engine/cards';
import { partnerOf } from '../engine/seats';
import { effectiveSuit, isRightBower, isTrump } from '../engine/trump';
import { countTrump, handStrength, lowest } from './strength';
import { PlayerView } from './view';

export const CALL_THRESHOLD = 6;
export const ALONE_THRESHOLD = 10;

function shouldGoAlone(hand: readonly Card[], trump: Suit, strength: number): boolean {
  return strength >= ALONE_THRESHOLD && countTrump(hand, trump) >= 3;
}

// Which card the dealer should throw away from six.
// Never trump if avoidable, never an Ace if avoidable, and prefer a card
// that leaves us void in its suit.
export function chooseDiscard(six: readonly Card[], trump: Suit): Card {
  const plain = six.filter((c) => !isTrump(c, trump));
  if (plain.length === 0) return lowest(six, trump);

  const nonAces = plain.filter((c) => c.rank !== 'A');
  const candidates = nonAces.length > 0 ? nonAces : plain;

  // A card that is alone in its suit: discarding it creates a void.
  const singletons = candidates.filter(
    (c) => six.filter((o) => effectiveSuit(o, trump) === effectiveSuit(c, trump)).length === 1,
  );
  return lowest(singletons.length > 0 ? singletons : candidates, trump);
}

// The dealer's five cards after picking up `upCard` and discarding well.
function handAfterPickup(hand: readonly Card[], upCard: Card): Card[] {
  const six = [...hand, upCard];
  const discard = chooseDiscard(six, upCard.suit);
  return six.filter((c) => !sameCard(c, discard));
}

function chooseRound1(view: PlayerView): BidAction {
  const { seat, dealer, upCard, hand } = view;
  const trump = upCard.suit;

  let strength: number;
  let finalHand: readonly Card[];
  if (seat === dealer) {
    // The dealer judges the hand they will have after picking up.
    finalHand = handAfterPickup(hand, upCard);
    strength = handStrength(finalHand, trump);
  } else {
    finalHand = hand;
    strength = handStrength(hand, trump);
    // The up card goes to the dealer: good if that is my partner, bad if not.
    const swing = isRightBower(upCard, trump) ? 1.5 : 0.5;
    strength += dealer === partnerOf(seat) ? swing : -swing;
  }

  if (strength < CALL_THRESHOLD) return { type: 'pass' };
  return { type: 'orderUp', alone: shouldGoAlone(finalHand, trump, strength) };
}

function chooseRound2(view: PlayerView): BidAction {
  const { hand, upCard } = view;

  // Find the strongest suit we are allowed to name.
  let bestSuit: Suit | null = null;
  let bestStrength = -Infinity;
  for (const suit of SUITS) {
    if (suit === upCard.suit) continue;
    const strength = handStrength(hand, suit);
    if (strength > bestStrength) {
      bestSuit = suit;
      bestStrength = strength;
    }
  }

  const suit = bestSuit!;
  // Stick the dealer: must call something, so call the best suit.
  if (bestStrength < CALL_THRESHOLD && !isDealerStuck(view.bidding)) {
    return { type: 'pass' };
  }
  return { type: 'callSuit', suit, alone: shouldGoAlone(hand, suit, bestStrength) };
}

export function chooseBid(view: PlayerView): BidAction {
  return view.bidding.round === 1 ? chooseRound1(view) : chooseRound2(view);
}
