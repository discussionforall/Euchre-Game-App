// What one player is allowed to know: their own cards plus everything
// that happened face up on the table. Bots only ever see this, never the
// full GameState, so they cannot peek at other players' hands.

import { BiddingState, Contract } from '../engine/bidding';
import { Card } from '../engine/cards';
import { CompletedTrick, GameState, Phase } from '../engine/game';
import { Play } from '../engine/rules';
import { Seat } from '../engine/seats';
import { Scores } from '../engine/scoring';

export interface PlayerView {
  readonly seat: Seat;
  readonly phase: Phase;
  readonly hand: readonly Card[];
  readonly dealer: Seat;
  readonly upCard: Card;
  readonly bidding: BiddingState;
  readonly contract: Contract | null;
  readonly trick: readonly Play[];
  readonly completedTricks: readonly CompletedTrick[];
  readonly scores: Scores;
}

export function viewFor(state: GameState, seat: Seat): PlayerView {
  return {
    seat,
    phase: state.phase,
    hand: state.hands[seat],
    dealer: state.dealer,
    upCard: state.upCard,
    bidding: state.bidding,
    contract: state.contract,
    trick: state.trick,
    completedTricks: state.completedTricks,
    scores: state.scores,
  };
}
