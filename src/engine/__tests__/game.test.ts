import { BidAction } from '../bidding';
import { cardLabel, sameCard } from '../cards';
import { applyAction, GameState, newGame, playableCards, startNextHand } from '../game';
import { seededRandom } from '../random';

const PASS: BidAction = { type: 'pass' };
const bid = (state: GameState, b: BidAction) => applyAction(state, { type: 'bid', bid: b });
const passTimes = (state: GameState, times: number) => {
  for (let i = 0; i < times; i++) state = bid(state, PASS);
  return state;
};
// Plays the first legal card for whoever's turn it is.
const playFirstLegal = (state: GameState) => applyAction(state, { type: 'play', card: playableCards(state)[0] });
const playWholeHand = (state: GameState) => {
  while (state.phase === 'playing') state = playFirstLegal(state);
  return state;
};
const game = () => newGame(seededRandom(42));

describe('newGame', () => {
  it('starts bidding with scores at 0 and the human first to act', () => {
    const state = game();
    expect(state.phase).toBe('bidding');
    expect(state.scores).toEqual([0, 0]);
    expect(state.dealer).toBe(3);
    expect(state.turn).toBe(0);
    for (const hand of state.hands) expect(hand).toHaveLength(5);
  });

  it('deals the same cards for the same seed', () => {
    const a = newGame(seededRandom(7)).hands.flat().map(cardLabel);
    const b = newGame(seededRandom(7)).hands.flat().map(cardLabel);
    expect(a).toEqual(b);
  });
});

describe('bidding into play', () => {
  it('ordering up sends the dealer to discard', () => {
    const state = bid(game(), { type: 'orderUp', alone: false });
    expect(state.phase).toBe('discard');
    expect(state.turn).toBe(3);
    expect(state.contract?.trump).toBe(state.upCard.suit);
  });

  it('after the discard, the dealer has the up card and play starts left of the dealer', () => {
    let state = bid(game(), { type: 'orderUp', alone: false });
    const discard = state.hands[3][0];
    state = applyAction(state, { type: 'discard', card: discard });
    expect(state.phase).toBe('playing');
    expect(state.hands[3]).toHaveLength(5);
    expect(state.hands[3].some((c) => sameCard(c, state.upCard))).toBe(true);
    expect(state.hands[3].some((c) => sameCard(c, discard))).toBe(false);
    expect(state.turn).toBe(0);
  });

  it('calling a suit in round 2 skips the discard', () => {
    let state = passTimes(game(), 4);
    const dealerHand = state.hands[3];
    const suit = (['clubs', 'diamonds', 'hearts', 'spades'] as const).find((s) => s !== state.upCard.suit)!;
    state = bid(state, { type: 'callSuit', suit, alone: false });
    expect(state.phase).toBe('playing');
    expect(state.contract?.trump).toBe(suit);
    expect(state.hands[3]).toEqual(dealerHand);
  });
});

describe('illegal actions', () => {
  it('cannot play a card during bidding', () => {
    const state = game();
    expect(() => applyAction(state, { type: 'play', card: state.hands[0][0] })).toThrow();
  });

  it('cannot play a card that does not follow suit', () => {
    let state = bid(game(), { type: 'orderUp', alone: false });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    // Play on until someone holds a card they are not allowed to play.
    const findIllegal = () =>
      state.hands[state.turn].find((c) => !playableCards(state).some((p) => sameCard(p, c)));
    while (state.phase === 'playing' && findIllegal() === undefined) {
      state = playFirstLegal(state);
    }
    const illegal = findIllegal();
    expect(illegal).toBeDefined();
    expect(() => applyAction(state, { type: 'play', card: illegal! })).toThrow();
  });

  it('does not change the state it was given', () => {
    const state = game();
    const before = JSON.stringify(state);
    bid(state, { type: 'orderUp', alone: false });
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('playing tricks', () => {
  it('after 4 cards the trick is stored and its winner leads next', () => {
    let state = bid(game(), { type: 'orderUp', alone: false });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    for (let i = 0; i < 4; i++) state = playFirstLegal(state);
    expect(state.trick).toHaveLength(0);
    expect(state.completedTricks).toHaveLength(1);
    expect(state.turn).toBe(state.completedTricks[0].winner);
  });

  it('after 5 tricks the hand is scored', () => {
    let state = bid(game(), { type: 'orderUp', alone: false });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    state = playWholeHand(state);
    expect(state.phase).toBe('handOver');
    expect(state.completedTricks).toHaveLength(5);
    expect(state.lastHandScore).not.toBeNull();
    expect(state.scores[0] + state.scores[1]).toBe(state.lastHandScore!.points);
  });
});

describe('going alone', () => {
  it('the partner never plays and tricks have 3 cards', () => {
    // Seat 0 orders up alone, so seat 2 sits out.
    let state = bid(game(), { type: 'orderUp', alone: true });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    state = playWholeHand(state);
    for (const trick of state.completedTricks) {
      expect(trick.plays).toHaveLength(3);
      expect(trick.plays.some((p) => p.seat === 2)).toBe(false);
    }
    expect(state.hands[2]).toHaveLength(5);
  });

  it('skips the sitting-out player for the first lead', () => {
    // Dealer is 3, so seat 0 would lead. Seat 2 goes alone, so seat 0 sits out.
    let state = passTimes(game(), 2);
    state = bid(state, { type: 'orderUp', alone: true });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    expect(state.turn).toBe(1);
  });

  it('the dealer discards even when sitting out', () => {
    // Seat 1 is the dealer's partner; going alone means dealer 3 sits out.
    let state = passTimes(game(), 1);
    state = bid(state, { type: 'orderUp', alone: true });
    expect(state.phase).toBe('discard');
    expect(state.turn).toBe(3);
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    state = playWholeHand(state);
    for (const trick of state.completedTricks) {
      expect(trick.plays.some((p) => p.seat === 3)).toBe(false);
    }
  });
});

describe('the next hand', () => {
  it('moves the deal clockwise and keeps the scores', () => {
    let state = bid(game(), { type: 'orderUp', alone: false });
    state = applyAction(state, { type: 'discard', card: state.hands[3][0] });
    state = playWholeHand(state);
    const scores = state.scores;
    state = startNextHand(state, seededRandom(1));
    expect(state.phase).toBe('bidding');
    expect(state.dealer).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.scores).toEqual(scores);
    expect(state.completedTricks).toHaveLength(0);
  });

  it('cannot start a new hand in the middle of one', () => {
    expect(() => startNextHand(game())).toThrow();
  });
});
