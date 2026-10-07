// Full games between bots and random players, to check the bots never get
// stuck or break a rule, and that they actually play well.

import { chooseBotAction } from '..';
import { legalBids } from '../../engine/bidding';
import { applyAction, GameAction, GameState, newGame, playableCards, startNextHand } from '../../engine/game';
import { seededRandom } from '../../engine/random';
import { Seat, Team, teamOf } from '../../engine/seats';

const GAMES = 300;

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function randomAction(state: GameState, random: () => number): GameAction {
  switch (state.phase) {
    case 'bidding':
      return { type: 'bid', bid: pick(legalBids(state.bidding), random) };
    case 'discard':
      return { type: 'discard', card: pick([...state.hands[state.dealer], state.upCard], random) };
    default:
      return { type: 'play', card: pick(playableCards(state), random) };
  }
}

// Plays one full game. `isBot(seat)` decides who is a bot.
function playGame(seed: number, isBot: (seat: Seat) => boolean): Team {
  const random = seededRandom(seed);
  let state = newGame(random);
  while (state.phase !== 'gameOver') {
    if (state.phase === 'handOver') {
      state = startNextHand(state, random);
      continue;
    }
    const action = isBot(state.turn) ? chooseBotAction(state) : randomAction(state, random);
    state = applyAction(state, action);
  }
  return state.winner!;
}

describe('bot matches', () => {
  it('bots beat random players almost every game', () => {
    let wins = 0;
    for (let seed = 1; seed <= GAMES; seed++) {
      // Alternate which team the bots play on, so seating cannot bias the result.
      const botTeam: Team = seed % 2 === 0 ? 0 : 1;
      if (playGame(seed, (seat) => teamOf(seat) === botTeam) === botTeam) wins++;
    }
    expect(wins / GAMES).toBeGreaterThan(0.9);
  });

  it('four bots can play full games without errors', () => {
    for (let seed = 1; seed <= 100; seed++) {
      playGame(seed, () => true);
    }
  });
});
