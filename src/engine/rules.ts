// Playing a trick: which cards are legal, and who wins.

import { Card, Suit } from './cards';
import { Seat } from './seats';
import { effectiveSuit, isTrump, rankValue } from './trump';

export interface Play {
  readonly seat: Seat;
  readonly card: Card;
}

// The suit everyone must follow. Uses the effective suit, so leading the
// left bower means trump was led.
export function ledSuit(trick: readonly Play[], trump: Suit): Suit | null {
  return trick.length === 0 ? null : effectiveSuit(trick[0].card, trump);
}

// Cards the player may play from `hand` into the current trick.
// Must follow the led suit if possible; otherwise anything goes.
export function legalPlays(hand: readonly Card[], trick: readonly Play[], trump: Suit): Card[] {
  const led = ledSuit(trick, trump);
  if (led === null) return [...hand];

  const following = hand.filter((card) => effectiveSuit(card, trump) === led);
  return following.length > 0 ? following : [...hand];
}

// How strong a card is within this trick. Trump beats the led suit, and
// any other suit can never win (-1).
function trickPower(card: Card, led: Suit, trump: Suit): number {
  if (isTrump(card, trump)) return 100 + rankValue(card, trump);
  if (effectiveSuit(card, trump) === led) return rankValue(card, trump);
  return -1;
}

// Returns the play that wins the trick. Works for 4 cards, or 3 when
// someone is going alone.
export function trickWinner(trick: readonly Play[], trump: Suit): Play {
  const led = ledSuit(trick, trump);
  if (led === null) throw new Error('Cannot find the winner of an empty trick');

  let best = trick[0];
  for (const play of trick.slice(1)) {
    if (trickPower(play.card, led, trump) > trickPower(best.card, led, trump)) {
      best = play;
    }
  }
  return best;
}
