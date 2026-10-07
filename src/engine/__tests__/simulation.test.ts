// Plays many complete games with random (but legal) choices and checks that
// the rules hold after every single action.

import { isDealerStuck, legalBids, sittingOut } from '../bidding';
import { cardLabel } from '../cards';
import { applyAction, cardsPerTrick, GameState, newGame, playableCards, startNextHand } from '../game';
import { seededRandom } from '../random';
import { SEATS } from '../seats';
import { WINNING_SCORE } from '../scoring';

const GAMES = 300;

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

// One random legal action for whoever's turn it is.
function randomStep(state: GameState, random: () => number): GameState {
  switch (state.phase) {
    case 'bidding': {
      const bids = legalBids(state.bidding);
      // Pass most of the time so round 2 and stick the dealer get exercised.
      const canPass = bids[0].type === 'pass';
      const bid = canPass && random() < 0.7 ? bids[0] : pick(bids.filter((b) => b.type !== 'pass'), random);
      return applyAction(state, { type: 'bid', bid });
    }
    case 'discard':
      return applyAction(state, { type: 'discard', card: pick([...state.hands[state.dealer], state.upCard], random) });
    case 'playing':
      return applyAction(state, { type: 'play', card: pick(playableCards(state), random) });
    case 'handOver':
      return startNextHand(state, random);
    case 'gameOver':
      throw new Error('The game is already over');
  }
}

// A plain check instead of Jest's expect(): this runs hundreds of thousands
// of times, and expect() is much slower.
function check(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Rules that must be true at every moment of the game.
function checkInvariants(state: GameState) {
  for (const hand of state.hands) {
    check(new Set(hand.map(cardLabel)).size === hand.length, 'duplicate card in a hand');
  }

  if (state.phase === 'playing' && state.contract) {
    const out = sittingOut(state.contract);
    check(state.turn !== out, 'the sitting-out player was given a turn');
    for (const seat of SEATS) {
      const playedThisTrick = state.trick.some((p) => p.seat === seat) ? 1 : 0;
      const expected = seat === out ? 5 : 5 - state.completedTricks.length - playedThisTrick;
      check(state.hands[seat].length === expected, `seat ${seat} has the wrong number of cards`);
    }
  }

  for (const trick of state.completedTricks) {
    check(trick.plays.length === cardsPerTrick(state.contract!), 'a trick has the wrong number of cards');
  }
}

describe(`simulating ${GAMES} random games`, () => {
  const seen = { stuckDealer: 0, alone: 0, aloneMarch: 0, march: 0, euchred: 0 };

  it('every game finishes with a valid winner and no rule broken', () => {
    for (let seed = 1; seed <= GAMES; seed++) {
      const random = seededRandom(seed);
      let state = newGame(random);
      let hands = 0;

      while (state.phase !== 'gameOver') {
        if (state.phase === 'bidding' && isDealerStuck(state.bidding)) seen.stuckDealer++;

        const before = state.scores;
        state = randomStep(state, random);
        checkInvariants(state);

        // Scores only change at the end of a hand, by 1, 2 or 4 for one team.
        const gained = state.scores[0] - before[0] + (state.scores[1] - before[1]);
        if (gained > 0) {
          hands++;
          check([1, 2, 4].includes(gained), `a hand scored ${gained} points`);
          const { outcome } = state.lastHandScore!;
          if (state.contract!.alone) seen.alone++;
          if (outcome === 'march') (state.contract!.alone ? seen.aloneMarch++ : seen.march++);
          if (outcome === 'euchred') seen.euchred++;
        }
        check(hands < 100, 'the game never ended');
      }

      expect(state.winner).not.toBeNull();
      expect(state.scores[state.winner!]).toBeGreaterThanOrEqual(WINNING_SCORE);
      expect(state.scores[state.winner === 0 ? 1 : 0]).toBeLessThan(WINNING_SCORE);
    }
  });

  it('the random games covered every special case', () => {
    expect(seen.stuckDealer).toBeGreaterThan(0);
    expect(seen.alone).toBeGreaterThan(0);
    expect(seen.aloneMarch).toBeGreaterThan(0);
    expect(seen.march).toBeGreaterThan(0);
    expect(seen.euchred).toBeGreaterThan(0);
  });
});
