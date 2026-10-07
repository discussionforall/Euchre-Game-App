import {
  applyBid,
  BidAction,
  BiddingState,
  BidResult,
  isDealerStuck,
  legalBids,
  pickUpAndDiscard,
  sittingOut,
  startBidding,
} from '../bidding';
import { Card, cardLabel, Rank, Suit } from '../cards';

const card = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const PASS: BidAction = { type: 'pass' };

// Applies a bid that is expected to keep bidding going, and returns the new state.
function continueWith(state: BiddingState, action: BidAction): BiddingState {
  const result = applyBid(state, action);
  if (result.status !== 'bidding') throw new Error('Expected bidding to continue');
  return result.state;
}

function passTimes(state: BiddingState, times: number): BiddingState {
  for (let i = 0; i < times; i++) state = continueWith(state, PASS);
  return state;
}

function contractOf(result: BidResult) {
  if (result.status !== 'decided') throw new Error('Expected a decided contract');
  return result.contract;
}

describe('starting the bidding', () => {
  it('begins in round 1 with the player left of the dealer', () => {
    const state = startBidding(3, card('K', 'hearts'));
    expect(state.round).toBe(1);
    expect(state.turn).toBe(0);
  });
});

describe('round 1', () => {
  const upCard = card('K', 'hearts');

  it('lets players pass or order up', () => {
    const types = legalBids(startBidding(0, upCard)).map((b) => b.type);
    expect(types).toEqual(['pass', 'orderUp', 'orderUp']);
  });

  it('passing moves the turn clockwise', () => {
    const state = continueWith(startBidding(0, upCard), PASS);
    expect(state.turn).toBe(2);
  });

  it('ordering up makes the up card suit trump', () => {
    const state = passTimes(startBidding(0, upCard), 1); // seat 1 passes, seat 2 to act
    const contract = contractOf(applyBid(state, { type: 'orderUp', alone: false }));
    expect(contract).toEqual({ trump: 'hearts', maker: 2, alone: false, dealerPicksUp: true });
  });

  it('the dealer can pick it up for themselves', () => {
    const state = passTimes(startBidding(0, upCard), 3);
    expect(state.turn).toBe(0);
    const contract = contractOf(applyBid(state, { type: 'orderUp', alone: false }));
    expect(contract.maker).toBe(0);
    expect(contract.dealerPicksUp).toBe(true);
  });

  it('records going alone', () => {
    const contract = contractOf(applyBid(startBidding(0, upCard), { type: 'orderUp', alone: true }));
    expect(contract.alone).toBe(true);
  });

  it('does not allow naming a suit in round 1', () => {
    expect(() => applyBid(startBidding(0, upCard), { type: 'callSuit', suit: 'spades', alone: false })).toThrow();
  });
});

describe('round 2', () => {
  const upCard = card('K', 'hearts');
  const round2 = () => passTimes(startBidding(0, upCard), 4);

  it('starts after all four pass, again left of the dealer', () => {
    const state = round2();
    expect(state.round).toBe(2);
    expect(state.turn).toBe(1);
    expect(state.passes).toBe(0);
  });

  it('cannot name the up card suit', () => {
    const suits = legalBids(round2()).flatMap((b) => (b.type === 'callSuit' ? [b.suit] : []));
    expect(new Set(suits)).toEqual(new Set(['clubs', 'diamonds', 'spades']));
    expect(() => applyBid(round2(), { type: 'callSuit', suit: 'hearts', alone: false })).toThrow();
  });

  it('cannot order up any more', () => {
    expect(() => applyBid(round2(), { type: 'orderUp', alone: false })).toThrow();
  });

  it('naming a suit decides trump without a pickup', () => {
    const contract = contractOf(applyBid(round2(), { type: 'callSuit', suit: 'spades', alone: false }));
    expect(contract).toEqual({ trump: 'spades', maker: 1, alone: false, dealerPicksUp: false });
  });
});

describe('stick the dealer', () => {
  const upCard = card('K', 'hearts');

  it('the dealer is stuck after three passes in round 2', () => {
    const state = passTimes(startBidding(0, upCard), 4 + 3);
    expect(state.turn).toBe(0);
    expect(isDealerStuck(state)).toBe(true);
  });

  it('the stuck dealer cannot pass', () => {
    const state = passTimes(startBidding(0, upCard), 4 + 3);
    expect(legalBids(state).some((b) => b.type === 'pass')).toBe(false);
    expect(() => applyBid(state, PASS)).toThrow();
  });

  it('the stuck dealer can still call a suit, and go alone', () => {
    const state = passTimes(startBidding(0, upCard), 4 + 3);
    const contract = contractOf(applyBid(state, { type: 'callSuit', suit: 'clubs', alone: true }));
    expect(contract).toEqual({ trump: 'clubs', maker: 0, alone: true, dealerPicksUp: false });
  });

  it('the dealer is not stuck in round 1', () => {
    const state = passTimes(startBidding(0, upCard), 3);
    expect(state.turn).toBe(0);
    expect(isDealerStuck(state)).toBe(false);
  });
});

describe('pickUpAndDiscard', () => {
  const hand = [card('9', 'clubs'), card('A', 'spades'), card('Q', 'hearts'), card('10', 'diamonds'), card('K', 'clubs')];
  const upCard = card('J', 'hearts');

  it('adds the up card and removes the discard', () => {
    const result = pickUpAndDiscard(hand, upCard, card('9', 'clubs'));
    expect(result.map(cardLabel)).toEqual(['A♠', 'Q♥', '10♦', 'K♣', 'J♥']);
  });

  it('can discard the up card itself', () => {
    const result = pickUpAndDiscard(hand, upCard, upCard);
    expect(result.map(cardLabel)).toEqual(hand.map(cardLabel));
  });

  it('rejects a discard the dealer does not hold', () => {
    expect(() => pickUpAndDiscard(hand, upCard, card('A', 'hearts'))).toThrow();
  });

  it('does not change the original hand', () => {
    pickUpAndDiscard(hand, upCard, card('9', 'clubs'));
    expect(hand).toHaveLength(5);
  });
});

describe('sittingOut', () => {
  it('is nobody when playing with a partner', () => {
    expect(sittingOut({ trump: 'hearts', maker: 1, alone: false, dealerPicksUp: false })).toBeNull();
  });

  it('is the maker\'s partner when going alone', () => {
    expect(sittingOut({ trump: 'hearts', maker: 1, alone: true, dealerPicksUp: false })).toBe(3);
    expect(sittingOut({ trump: 'hearts', maker: 2, alone: true, dealerPicksUp: true })).toBe(0);
  });
});
