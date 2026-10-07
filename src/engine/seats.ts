// Seats around the table, clockwise. Partners sit opposite each other:
//
//          2
//      1       3
//          0   <- the human player
//
// Team 0 is seats 0 & 2, team 1 is seats 1 & 3.

export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;

export const SEATS: readonly Seat[] = [0, 1, 2, 3];

// The next player clockwise, i.e. the player to this seat's left.
export function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 4) as Seat;
}

export function partnerOf(seat: Seat): Seat {
  return ((seat + 2) % 4) as Seat;
}

export function teamOf(seat: Seat): Team {
  return (seat % 2) as Team;
}

// The next player clockwise who is actually playing this hand, skipping the
// partner of someone going alone.
export function nextActiveSeat(seat: Seat, sittingOut: Seat | null): Seat {
  const next = nextSeat(seat);
  return next === sittingOut ? nextSeat(next) : next;
}
