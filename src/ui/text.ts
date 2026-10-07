// Words shown on screen, and sorting the human's hand. Plain functions with
// no React, so they are easy to unit test.

import { BidAction, Contract } from '../engine/bidding';
import { Card, cardLabel, RANKS, Suit, SUIT_SYMBOLS } from '../engine/cards';
import { HandScore } from '../engine/scoring';
import { partnerOf, Seat, Team, teamOf } from '../engine/seats';
import { effectiveSuit, rankValue } from '../engine/trump';

export const SEAT_NAMES: Record<Seat, string> = { 0: 'You', 1: 'West', 2: 'Partner', 3: 'East' };
export const TEAM_NAMES: Record<Team, string> = { 0: 'You & Partner', 1: 'Opponents' };

export const SUIT_NAMES: Record<Suit, string> = {
  clubs: 'Clubs',
  diamonds: 'Diamonds',
  hearts: 'Hearts',
  spades: 'Spades',
};

export function suitText(suit: Suit): string {
  return `${SUIT_SYMBOLS[suit]} ${SUIT_NAMES[suit]}`;
}

export function describeBid(bid: BidAction, seat: Seat, dealer: Seat): string {
  const alone = 'alone' in bid && bid.alone ? ' alone' : '';
  switch (bid.type) {
    case 'pass':
      return 'Pass';
    case 'orderUp':
      return (seat === dealer ? 'Picks it up' : 'Order up') + alone;
    case 'callSuit':
      return `${SUIT_SYMBOLS[bid.suit]} ${SUIT_NAMES[bid.suit]}${alone}`;
  }
}

// Just the trump part, e.g. "♥ (alone)".
export function describeCall(contract: Contract): string {
  return `${SUIT_SYMBOLS[contract.trump]}${contract.alone ? ' (alone)' : ''}`;
}

export function describeContract(contract: Contract): string {
  return `${SEAT_NAMES[contract.maker]} called ${describeCall(contract)}`;
}

// The banner shown the moment trump is chosen, e.g.
//   "West ordered up ♣ Clubs" / "You're the dealer: the A♣ goes into your hand."
export function describeAnnouncement(contract: Contract, dealer: Seat, upCard: Card): { title: string; details: string[] } {
  const { maker, trump, alone, dealerPicksUp } = contract;
  const verb = !dealerPicksUp ? 'called' : maker === dealer ? 'picked up' : 'ordered up';
  const title = `${SEAT_NAMES[maker]} ${verb} ${suitText(trump)}${alone ? ' alone' : ''}`;

  const details: string[] = [];
  if (dealerPicksUp && maker !== dealer) {
    details.push(
      dealer === 0
        ? `You're the dealer: the ${cardLabel(upCard)} goes into your hand.`
        : `${SEAT_NAMES[dealer]} is the dealer and picks up the ${cardLabel(upCard)}.`,
    );
  }
  if (alone) {
    const out = partnerOf(maker);
    details.push(out === 0 ? 'Your partner goes alone: you sit this hand out.' : `${SEAT_NAMES[out]} sits this hand out.`);
  }
  return { title, details };
}

// `makerTricks` is how many tricks the makers' team took.
export function describeHandResult(
  score: HandScore,
  contract: Contract,
  makerTricks: number,
): { title: string; detail: string } {
  // A lone player is named on their own; otherwise the whole team.
  const makers = contract.alone ? SEAT_NAMES[contract.maker] : TEAM_NAMES[teamOf(contract.maker)];
  const called = contract.alone ? 'went alone' : 'called trump';
  const tricks = makerTricks === 1 ? '1 trick' : `${makerTricks} tricks`;
  const points = `+${score.points} to ${TEAM_NAMES[score.team]}`;
  switch (score.outcome) {
    case 'euchred':
      return { title: 'Euchred!', detail: `${makers} ${called} but took only ${tricks}.\n${points}` };
    case 'march':
      return { title: contract.alone ? 'Lone march!' : 'March!', detail: `${makers} took all 5 tricks.\n${points}` };
    case 'made':
      return { title: 'Made it', detail: `${makers} took ${tricks}.\n${points}` };
  }
}

// Suits alternate colors so neighbouring groups are easy to tell apart.
const DISPLAY_ORDER: readonly Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

// Groups cards by suit (trump first once it is known), highest card first.
export function sortHand(cards: readonly Card[], trump: Suit | null): Card[] {
  const order = trump ? [trump, ...DISPLAY_ORDER.filter((s) => s !== trump)] : DISPLAY_ORDER;
  const key = (card: Card) => {
    const suit = trump ? effectiveSuit(card, trump) : card.suit;
    const rank = trump ? rankValue(card, trump) : RANKS.indexOf(card.rank);
    return order.indexOf(suit) * 10 - rank;
  };
  return [...cards].sort((a, b) => key(a) - key(b));
}
