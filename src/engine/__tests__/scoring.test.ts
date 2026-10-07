import { Contract } from '../bidding';
import { Seat } from '../seats';
import { addScore, gameWinner, scoreHand, tricksWonBy } from '../scoring';

const contract = (maker: Seat, alone = false): Contract => ({
  trump: 'hearts',
  maker,
  alone,
  dealerPicksUp: false,
});

describe('tricksWonBy', () => {
  it('counts tricks won by either partner', () => {
    expect(tricksWonBy(0, [0, 2, 1, 2, 3])).toBe(3);
    expect(tricksWonBy(1, [0, 2, 1, 2, 3])).toBe(2);
  });
});

describe('scoreHand with a partner', () => {
  it('3 tricks: makers get 1', () => {
    expect(scoreHand(contract(0), [0, 2, 0, 1, 3])).toEqual({ outcome: 'made', team: 0, points: 1 });
  });

  it('4 tricks: makers still get 1', () => {
    expect(scoreHand(contract(1), [1, 3, 3, 1, 0])).toEqual({ outcome: 'made', team: 1, points: 1 });
  });

  it('5 tricks: a march, makers get 2', () => {
    expect(scoreHand(contract(2), [0, 2, 2, 0, 0])).toEqual({ outcome: 'march', team: 0, points: 2 });
  });

  it('2 tricks: euchred, defenders get 2', () => {
    expect(scoreHand(contract(0), [0, 2, 1, 3, 1])).toEqual({ outcome: 'euchred', team: 1, points: 2 });
  });

  it('0 tricks: still just 2 for the defenders', () => {
    expect(scoreHand(contract(3), [0, 0, 2, 2, 0])).toEqual({ outcome: 'euchred', team: 0, points: 2 });
  });
});

describe('scoreHand going alone', () => {
  it('all 5 tricks: 4 points', () => {
    expect(scoreHand(contract(0, true), [0, 0, 0, 0, 0])).toEqual({ outcome: 'march', team: 0, points: 4 });
  });

  it('3 or 4 tricks: only 1 point', () => {
    expect(scoreHand(contract(1, true), [1, 1, 1, 0, 1])).toEqual({ outcome: 'made', team: 1, points: 1 });
  });

  it('euchred: defenders get 2', () => {
    expect(scoreHand(contract(1, true), [1, 0, 2, 0, 1])).toEqual({ outcome: 'euchred', team: 0, points: 2 });
  });
});

describe('scoreHand input check', () => {
  it('rejects anything but 5 tricks', () => {
    expect(() => scoreHand(contract(0), [0, 0, 0])).toThrow();
  });
});

describe('game score', () => {
  it('adds points to the right team', () => {
    expect(addScore([3, 5], { outcome: 'euchred', team: 1, points: 2 })).toEqual([3, 7]);
    expect(addScore([3, 5], { outcome: 'march', team: 0, points: 4 })).toEqual([7, 5]);
  });

  it('nobody wins below 10', () => {
    expect(gameWinner([9, 9])).toBeNull();
  });

  it('a team wins at 10 or more', () => {
    expect(gameWinner([10, 4])).toBe(0);
    expect(gameWinner([6, 12])).toBe(1);
  });
});
