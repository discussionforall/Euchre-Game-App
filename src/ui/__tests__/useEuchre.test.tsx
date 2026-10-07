// Drives the real useEuchre hook through whole games with fake timers.
// The human's moves are made by the test (using bot logic as a stand-in),
// and the bots must never act on the human's turn.

import { act, create } from 'react-test-renderer';
import * as bots from '../../bots';
import { GameState } from '../../engine/game';
import { HUMAN, useEuchre } from '../useEuchre';

type Hook = ReturnType<typeof useEuchre>;

let hook: Hook;
function Harness() {
  hook = useEuchre({ speed: 'normal', active: true });
  return null;
}

const realChoose = bots.chooseBotAction;

describe('useEuchre', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('bots never act on the human\'s turn, across many games', () => {
    const botCalls: GameState[] = [];
    jest.spyOn(bots, 'chooseBotAction').mockImplementation((state) => {
      botCalls.push(state);
      return realChoose(state);
    });

    act(() => {
      create(<Harness />);
    });

    let games = 0;
    let humanDiscards = 0;
    for (let step = 0; step < 200000 && games < 20; step++) {
      const { game, humanCanAct } = hook;

      if (game.phase === 'handOver' && hook.shownTrick === null) {
        act(() => hook.nextHand());
      } else if (game.phase === 'gameOver' && hook.shownTrick === null) {
        games++;
        act(() => hook.restart());
      } else if (humanCanAct) {
        // Think slowly: nothing may happen while the human is deciding.
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        expect(hook.game).toBe(game);
        if (game.phase === 'discard') humanDiscards++;
        act(() => hook.act(realChoose(game)));
      } else {
        act(() => {
          jest.advanceTimersByTime(100);
        });
      }
    }

    expect(games).toBe(20);
    expect(botCalls.filter((s) => s.turn === HUMAN)).toHaveLength(0);
    expect(humanDiscards).toBeGreaterThan(0);
  });
});
