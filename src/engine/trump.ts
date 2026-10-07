// Trump and the bowers.
// Once trump is chosen:
//   - Right bower: the Jack of trump, the highest card.
//   - Left bower:  the Jack of the other suit of the same color, second highest.
//                  It stops belonging to its printed suit and counts as trump.

import { Card, RANKS, Suit } from './cards';

export type Color = 'red' | 'black';

export function suitColor(suit: Suit): Color {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

// The other suit of the same color: hearts <-> diamonds, clubs <-> spades.
export function sameColorSuit(suit: Suit): Suit {
  switch (suit) {
    case 'hearts':
      return 'diamonds';
    case 'diamonds':
      return 'hearts';
    case 'clubs':
      return 'spades';
    case 'spades':
      return 'clubs';
  }
}

export function isRightBower(card: Card, trump: Suit): boolean {
  return card.rank === 'J' && card.suit === trump;
}

export function isLeftBower(card: Card, trump: Suit): boolean {
  return card.rank === 'J' && card.suit === sameColorSuit(trump);
}

// The suit a card actually belongs to for this hand. Only the left bower
// differs from its printed suit.
export function effectiveSuit(card: Card, trump: Suit): Suit {
  return isLeftBower(card, trump) ? trump : card.suit;
}

export function isTrump(card: Card, trump: Suit): boolean {
  return effectiveSuit(card, trump) === trump;
}

// Trump cards from lowest to highest. The plain Jack of trump is never in
// this list because it is always the right bower.
const TRUMP_ORDER = ['9', '10', 'Q', 'K', 'A', 'left', 'right'] as const;

// A number for comparing two cards of the SAME effective suit: higher wins.
// Comparing cards of different suits is a trick-taking question (Step 4).
export function rankValue(card: Card, trump: Suit): number {
  if (isRightBower(card, trump)) return TRUMP_ORDER.indexOf('right');
  if (isLeftBower(card, trump)) return TRUMP_ORDER.indexOf('left');
  if (card.suit === trump) return TRUMP_ORDER.indexOf(card.rank as (typeof TRUMP_ORDER)[number]);
  return RANKS.indexOf(card.rank);
}
