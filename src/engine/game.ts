// The whole game as one state object plus actions.
//
//   bidding -> discard (only if the dealer picked up) -> playing -> handOver -> next hand...
//                                                           \-> gameOver (a team reached 10)
//
// `applyAction` never changes the state it is given; it returns a new one.
// `state.turn` is always the seat whose action is needed next.

import {
  applyBid,
  BidAction,
  BiddingState,
  Contract,
  pickUpAndDiscard,
  sittingOut,
  startBidding,
} from './bidding';
import { Card, createDeck, sameCard, shuffle } from './cards';
import { dealHands } from './deal';
import { legalPlays, Play, trickWinner } from './rules';
import { nextActiveSeat, nextSeat, Seat, Team } from './seats';
import { addScore, gameWinner, HandScore, scoreHand, Scores } from './scoring';

export type Phase = 'bidding' | 'discard' | 'playing' | 'handOver' | 'gameOver';

export interface CompletedTrick {
  readonly plays: readonly Play[];
  readonly winner: Seat;
}

export interface GameState {
  readonly phase: Phase;
  readonly scores: Scores;
  readonly dealer: Seat;
  readonly turn: Seat;

  // This hand's cards. A player sitting out keeps their cards but never plays.
  readonly hands: readonly (readonly Card[])[];
  readonly upCard: Card;
  readonly kitty: readonly Card[];

  readonly bidding: BiddingState;
  readonly contract: Contract | null;

  // The trick being played right now, and the ones already finished.
  readonly trick: readonly Play[];
  readonly completedTricks: readonly CompletedTrick[];

  // Set when a hand ends: how it was scored.
  readonly lastHandScore: HandScore | null;
  readonly winner: Team | null;
}

export type GameAction =
  | { readonly type: 'bid'; readonly bid: BidAction }
  | { readonly type: 'discard'; readonly card: Card }
  | { readonly type: 'play'; readonly card: Card };

// ---------------------------------------------------------------------------
// Starting hands and games

function startHand(scores: Scores, dealer: Seat, random: () => number): GameState {
  const deal = dealHands(shuffle(createDeck(), random), dealer);
  const bidding = startBidding(dealer, deal.upCard);
  return {
    phase: 'bidding',
    scores,
    dealer,
    turn: bidding.turn,
    hands: deal.hands,
    upCard: deal.upCard,
    kitty: deal.kitty,
    bidding,
    contract: null,
    trick: [],
    completedTricks: [],
    lastHandScore: null,
    winner: null,
  };
}

// By default the first dealer is seat 3, so the human (seat 0) bids first.
export function newGame(random: () => number = Math.random, dealer: Seat = 3): GameState {
  return startHand([0, 0], dealer, random);
}

// After a hand is scored, the deal moves one seat clockwise.
export function startNextHand(state: GameState, random: () => number = Math.random): GameState {
  if (state.phase !== 'handOver') {
    throw new Error(`Cannot start the next hand during ${state.phase}`);
  }
  return startHand(state.scores, nextSeat(state.dealer), random);
}

// ---------------------------------------------------------------------------
// Helpers for the UI and bots

// The cards the player whose turn it is may play right now.
export function playableCards(state: GameState): Card[] {
  if (state.phase !== 'playing' || state.contract === null) return [];
  return legalPlays(state.hands[state.turn], state.trick, state.contract.trump);
}

export function cardsPerTrick(contract: Contract): number {
  return contract.alone ? 3 : 4;
}

// ---------------------------------------------------------------------------
// Actions

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'bid':
      return applyBidAction(state, action.bid);
    case 'discard':
      return applyDiscard(state, action.card);
    case 'play':
      return applyPlay(state, action.card);
  }
}

function applyBidAction(state: GameState, bid: BidAction): GameState {
  if (state.phase !== 'bidding') {
    throw new Error(`Cannot bid during ${state.phase}`);
  }

  const result = applyBid(state.bidding, bid);
  if (result.status === 'bidding') {
    return { ...state, bidding: result.state, turn: result.state.turn };
  }

  const contract = result.contract;
  if (contract.dealerPicksUp) {
    // The dealer picks up and discards, even if they will then sit out.
    return { ...state, contract, phase: 'discard', turn: state.dealer };
  }
  return startPlaying({ ...state, contract });
}

function applyDiscard(state: GameState, card: Card): GameState {
  if (state.phase !== 'discard') {
    throw new Error(`Cannot discard during ${state.phase}`);
  }

  const hands = replaceHand(state.hands, state.dealer, pickUpAndDiscard(state.hands[state.dealer], state.upCard, card));
  return startPlaying({ ...state, hands });
}

// The first trick is led by the player left of the dealer, skipping the
// partner of a player going alone.
function startPlaying(state: GameState): GameState {
  const contract = requireContract(state);
  return {
    ...state,
    phase: 'playing',
    turn: nextActiveSeat(state.dealer, sittingOut(contract)),
    trick: [],
  };
}

function applyPlay(state: GameState, card: Card): GameState {
  if (state.phase !== 'playing') {
    throw new Error(`Cannot play a card during ${state.phase}`);
  }
  if (!playableCards(state).some((c) => sameCard(c, card))) {
    throw new Error('That card cannot be played right now');
  }

  const contract = requireContract(state);
  const hand = state.hands[state.turn].filter((c) => !sameCard(c, card));
  const hands = replaceHand(state.hands, state.turn, hand);
  const trick = [...state.trick, { seat: state.turn, card }];

  // Trick not finished yet: next player's turn.
  if (trick.length < cardsPerTrick(contract)) {
    return { ...state, hands, trick, turn: nextActiveSeat(state.turn, sittingOut(contract)) };
  }

  // Trick finished: the winner leads the next one.
  const winner = trickWinner(trick, contract.trump).seat;
  const completedTricks = [...state.completedTricks, { plays: trick, winner }];
  const afterTrick: GameState = { ...state, hands, trick: [], completedTricks, turn: winner };

  return completedTricks.length === 5 ? finishHand(afterTrick) : afterTrick;
}

function finishHand(state: GameState): GameState {
  const contract = requireContract(state);
  const handScore = scoreHand(contract, state.completedTricks.map((t) => t.winner));
  const scores = addScore(state.scores, handScore);
  const winner = gameWinner(scores);
  return {
    ...state,
    scores,
    lastHandScore: handScore,
    winner,
    phase: winner === null ? 'handOver' : 'gameOver',
  };
}

// ---------------------------------------------------------------------------
// Small utilities

function requireContract(state: GameState): Contract {
  if (state.contract === null) throw new Error('No trump has been chosen yet');
  return state.contract;
}

function replaceHand(
  hands: readonly (readonly Card[])[],
  seat: Seat,
  hand: readonly Card[],
): (readonly Card[])[] {
  return hands.map((h, i) => (i === seat ? hand : h));
}
