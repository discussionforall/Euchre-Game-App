// The single entry point the game uses: "it's a bot's turn, what does it do?"

import { applyAction, GameAction, GameState } from '../engine/game';
import { chooseBid, chooseDiscard } from './bidding';
import { choosePlay } from './play';
import { viewFor } from './view';

export function chooseBotAction(state: GameState): GameAction {
  const view = viewFor(state, state.turn);
  switch (state.phase) {
    case 'bidding':
      return { type: 'bid', bid: chooseBid(view) };
    case 'discard':
      return { type: 'discard', card: chooseDiscard([...view.hand, view.upCard], view.upCard.suit) };
    case 'playing':
      return { type: 'play', card: choosePlay(view) };
    default:
      throw new Error(`Bots have nothing to do during ${state.phase}`);
  }
}

// Convenience: let the bot whose turn it is act, returning the new state.
export function botStep(state: GameState): GameState {
  return applyAction(state, chooseBotAction(state));
}
