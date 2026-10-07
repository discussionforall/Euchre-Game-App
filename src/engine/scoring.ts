// Scoring a hand and deciding when the game is over.
//
// Makers (the team that chose trump):
//   all 5 tricks: 2 points, or 4 when going alone
//   3 or 4 tricks: 1 point
//   fewer than 3:  euchred, the defenders get 2 points

import { Contract } from './bidding';
import { Seat, Team, teamOf } from './seats';

export const WINNING_SCORE = 10;

export type HandOutcome = 'made' | 'march' | 'euchred';

export interface HandScore {
  readonly outcome: HandOutcome;
  // The team that receives the points.
  readonly team: Team;
  readonly points: number;
}

// `trickWinners` is who won each trick, in order.
export function tricksWonBy(team: Team, trickWinners: readonly Seat[]): number {
  return trickWinners.filter((seat) => teamOf(seat) === team).length;
}

export function scoreHand(contract: Contract, trickWinners: readonly Seat[]): HandScore {
  if (trickWinners.length !== 5) {
    throw new Error(`A hand has 5 tricks, got ${trickWinners.length}`);
  }

  const makers = teamOf(contract.maker);
  const defenders: Team = makers === 0 ? 1 : 0;
  const tricks = tricksWonBy(makers, trickWinners);

  if (tricks < 3) return { outcome: 'euchred', team: defenders, points: 2 };
  if (tricks < 5) return { outcome: 'made', team: makers, points: 1 };
  return { outcome: 'march', team: makers, points: contract.alone ? 4 : 2 };
}

export type Scores = readonly [number, number];

export function addScore(scores: Scores, handScore: HandScore): Scores {
  const next: [number, number] = [scores[0], scores[1]];
  next[handScore.team] += handScore.points;
  return next;
}

// The winning team, or null if nobody has reached 10 yet.
export function gameWinner(scores: Scores): Team | null {
  if (scores[0] >= WINNING_SCORE) return 0;
  if (scores[1] >= WINNING_SCORE) return 1;
  return null;
}
