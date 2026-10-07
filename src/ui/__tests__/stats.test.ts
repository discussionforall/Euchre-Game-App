import { EMPTY_STATS, recordResult, winRate } from '../stats';

describe('recordResult', () => {
  it('counts a win and starts a streak', () => {
    expect(recordResult(EMPTY_STATS, true)).toEqual({ played: 1, won: 1, lost: 0, streak: 1, bestStreak: 1 });
  });

  it('a loss ends the streak but keeps the best one', () => {
    let stats = recordResult(recordResult(EMPTY_STATS, true), true);
    stats = recordResult(stats, false);
    expect(stats).toEqual({ played: 3, won: 2, lost: 1, streak: 0, bestStreak: 2 });
  });

  it('a new streak only replaces the best once it is longer', () => {
    let stats = EMPTY_STATS;
    for (const won of [true, true, true, false, true]) stats = recordResult(stats, won);
    expect(stats.streak).toBe(1);
    expect(stats.bestStreak).toBe(3);
  });
});

describe('winRate', () => {
  it('is null before any games', () => {
    expect(winRate(EMPTY_STATS)).toBeNull();
  });

  it('rounds to a whole percentage', () => {
    expect(winRate({ ...EMPTY_STATS, played: 3, won: 2 })).toBe(67);
  });
});
