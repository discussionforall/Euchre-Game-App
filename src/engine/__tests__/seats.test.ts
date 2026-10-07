import { nextActiveSeat, nextSeat, partnerOf, Seat, teamOf } from '../seats';

describe('seats', () => {
  it('moves clockwise and wraps around', () => {
    expect(nextSeat(0)).toBe(1);
    expect(nextSeat(2)).toBe(3);
    expect(nextSeat(3)).toBe(0);
  });

  it('partners sit opposite', () => {
    expect(partnerOf(0)).toBe(2);
    expect(partnerOf(1)).toBe(3);
    expect(partnerOf(2)).toBe(0);
    expect(partnerOf(3)).toBe(1);
  });

  it('partners are on the same team, neighbours are not', () => {
    expect(teamOf(0)).toBe(teamOf(2));
    expect(teamOf(1)).toBe(teamOf(3));
    expect(teamOf(0)).not.toBe(teamOf(1));
  });
});

describe('nextActiveSeat', () => {
  it('is just the next seat when nobody sits out', () => {
    expect(nextActiveSeat(0, null)).toBe(1);
    expect(nextActiveSeat(3, null)).toBe(0);
  });

  it('skips the partner who sits out', () => {
    // Seat 0 goes alone, so seat 2 sits out: 1 -> 3, not 1 -> 2.
    expect(nextActiveSeat(1, 2)).toBe(3);
    expect(nextActiveSeat(3, 2)).toBe(0);
  });

  it('goes around a 3-player table in order', () => {
    // Seat 1 goes alone, so seat 3 sits out.
    const order: Seat[] = [0];
    for (let i = 0; i < 3; i++) order.push(nextActiveSeat(order[order.length - 1], 3));
    expect(order).toEqual([0, 1, 2, 0]);
  });
});
