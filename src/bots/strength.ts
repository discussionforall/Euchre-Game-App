// Measuring cards and hands, shared by the bidding and playing logic.

import { Card, Suit, SUITS } from '../engine/cards';
import { effectiveSuit, isLeftBower, isRightBower, isTrump, rankValue } from '../engine/trump';

// One number per card for "how good is this card?" once trump is known.
// Every trump card is worth more than every non-trump card.
export function cardValue(card: Card, trump: Suit): number {
  return (isTrump(card, trump) ? 100 : 0) + rankValue(card, trump);
}

export function lowest(cards: readonly Card[], trump: Suit): Card {
  return cards.reduce((low, c) => (cardValue(c, trump) < cardValue(low, trump) ? c : low));
}

export function highest(cards: readonly Card[], trump: Suit): Card {
  return cards.reduce((high, c) => (cardValue(c, trump) > cardValue(high, trump) ? c : high));
}

export function countTrump(hand: readonly Card[], trump: Suit): number {
  return hand.filter((c) => isTrump(c, trump)).length;
}

// How strong a hand would be with `trump` as trump. Roughly: 6 or more is
// worth calling, 10 or more (with 3+ trump) is worth going alone.
export function handStrength(hand: readonly Card[], trump: Suit): number {
  let strength = 0;
  for (const card of hand) {
    if (isRightBower(card, trump)) strength += 3;
    else if (isLeftBower(card, trump)) strength += 2.5;
    else if (card.suit === trump && card.rank === 'A') strength += 2;
    else if (card.suit === trump && card.rank === 'K') strength += 1.5;
    else if (card.suit === trump) strength += 1;
    else if (card.rank === 'A') strength += 1;
  }

  // Being void in a side suit lets you trump it, but only if you have trump.
  if (countTrump(hand, trump) >= 2) {
    for (const suit of SUITS) {
      if (suit === trump) continue;
      if (!hand.some((c) => effectiveSuit(c, trump) === suit)) strength += 0.5;
    }
  }
  return strength;
}
