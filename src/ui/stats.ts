// Win/loss record. Plain functions with no storage, so they are easy to test;
// saving and loading lives in storage.ts.

export interface Stats {
  played: number;
  won: number;
  lost: number;
  // Games won in a row right now, and the best run ever.
  streak: number;
  bestStreak: number;
}

export const EMPTY_STATS: Stats = { played: 0, won: 0, lost: 0, streak: 0, bestStreak: 0 };

export function recordResult(stats: Stats, won: boolean): Stats {
  const streak = won ? stats.streak + 1 : 0;
  return {
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    lost: stats.lost + (won ? 0 : 1),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

// Whole-number percentage, or null before any game has been played.
export function winRate(stats: Stats): number | null {
  return stats.played === 0 ? null : Math.round((stats.won / stats.played) * 100);
}
