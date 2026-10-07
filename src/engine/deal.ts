// Dealing a hand: 5 cards to each player, one card face up, 3 left over.

import { Card } from './cards';
import { nextSeat, Seat } from './seats';

export const HAND_SIZE = 5;

export interface Deal {
  // hands[seat] is that player's 5 cards.
  readonly hands: readonly (readonly Card[])[];
  // Turned face up for the first round of bidding.
  readonly upCard: Card;
  // The 3 face-down cards nobody uses this hand.
  readonly kitty: readonly Card[];
}

// Deals from an already shuffled deck, starting left of the dealer and going
// clockwise one card at a time. Taking the deck as input (instead of
// shuffling here) keeps deals reproducible in tests.
export function dealHands(deck: readonly Card[], dealer: Seat): Deal {
  if (deck.length !== 24) {
    throw new Error(`Expected a 24-card deck, got ${deck.length}`);
  }

  const hands: Card[][] = [[], [], [], []];
  let seat = nextSeat(dealer);
  let next = 0;
  for (let round = 0; round < HAND_SIZE; round++) {
    for (let i = 0; i < 4; i++) {
      hands[seat].push(deck[next++]);
      seat = nextSeat(seat);
    }
  }

  return {
    hands,
    upCard: deck[next],
    kitty: deck.slice(next + 1),
  };
}
