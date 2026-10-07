// Choosing trump.
//
// Round 1: starting left of the dealer, each player passes or orders up the
//          up card. Ordering up makes its suit trump, and the dealer takes
//          the up card and discards one.
// Round 2: if all four passed, each player passes or names any OTHER suit.
//          Stick the dealer: if the first three pass, the dealer must call.
//
// Whoever chooses trump (the "maker") also decides whether to go alone.

import { Card, sameCard, Suit, SUITS } from './cards';
import { nextSeat, partnerOf, Seat } from './seats';

export interface BiddingState {
  readonly dealer: Seat;
  readonly upCard: Card;
  readonly round: 1 | 2;
  readonly turn: Seat;
  // How many players have passed in the current round.
  readonly passes: number;
}

export type BidAction =
  | { readonly type: 'pass' }
  | { readonly type: 'orderUp'; readonly alone: boolean }
  | { readonly type: 'callSuit'; readonly suit: Suit; readonly alone: boolean };

export interface Contract {
  readonly trump: Suit;
  readonly maker: Seat;
  readonly alone: boolean;
  // True when trump came from round 1, so the dealer must pick up and discard.
  readonly dealerPicksUp: boolean;
}

// The maker's partner when going alone, otherwise nobody.
export function sittingOut(contract: Contract): Seat | null {
  return contract.alone ? partnerOf(contract.maker) : null;
}

export type BidResult =
  | { readonly status: 'bidding'; readonly state: BiddingState }
  | { readonly status: 'decided'; readonly contract: Contract };

export function startBidding(dealer: Seat, upCard: Card): BiddingState {
  return { dealer, upCard, round: 1, turn: nextSeat(dealer), passes: 0 };
}

// Stick the dealer: in round 2 the dealer is the last to act and cannot pass.
export function isDealerStuck(state: BiddingState): boolean {
  return state.round === 2 && state.turn === state.dealer;
}

// Every action the current player is allowed to take.
export function legalBids(state: BiddingState): BidAction[] {
  const bids: BidAction[] = [];
  if (!isDealerStuck(state)) {
    bids.push({ type: 'pass' });
  }
  if (state.round === 1) {
    bids.push({ type: 'orderUp', alone: false }, { type: 'orderUp', alone: true });
  } else {
    for (const suit of SUITS) {
      if (suit === state.upCard.suit) continue;
      bids.push({ type: 'callSuit', suit, alone: false }, { type: 'callSuit', suit, alone: true });
    }
  }
  return bids;
}

function sameBid(a: BidAction, b: BidAction): boolean {
  if (a.type === 'pass' || b.type === 'pass') return a.type === b.type;
  if (a.type === 'orderUp' && b.type === 'orderUp') return a.alone === b.alone;
  if (a.type === 'callSuit' && b.type === 'callSuit') return a.suit === b.suit && a.alone === b.alone;
  return false;
}

export function applyBid(state: BiddingState, action: BidAction): BidResult {
  if (!legalBids(state).some((bid) => sameBid(bid, action))) {
    throw new Error(`Illegal bid ${JSON.stringify(action)} in round ${state.round}`);
  }

  switch (action.type) {
    case 'orderUp':
      return {
        status: 'decided',
        contract: { trump: state.upCard.suit, maker: state.turn, alone: action.alone, dealerPicksUp: true },
      };

    case 'callSuit':
      return {
        status: 'decided',
        contract: { trump: action.suit, maker: state.turn, alone: action.alone, dealerPicksUp: false },
      };

    case 'pass': {
      const passes = state.passes + 1;
      // Everyone passed in round 1: move to round 2, starting left of the dealer again.
      if (passes === 4) {
        return { status: 'bidding', state: { ...state, round: 2, turn: nextSeat(state.dealer), passes: 0 } };
      }
      return { status: 'bidding', state: { ...state, turn: nextSeat(state.turn), passes } };
    }
  }
}

// The dealer adds the up card to their hand, then discards any one of the
// six cards (including the up card itself) to get back to five.
export function pickUpAndDiscard(hand: readonly Card[], upCard: Card, discard: Card): Card[] {
  const six = [...hand, upCard];
  const index = six.findIndex((card) => sameCard(card, discard));
  if (index === -1) {
    throw new Error('The discard must be one of the dealer\'s cards or the up card');
  }
  six.splice(index, 1);
  return six;
}
