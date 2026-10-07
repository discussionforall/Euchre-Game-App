// A small seeded random number generator (mulberry32).
// The same seed always produces the same numbers, so a game can be replayed
// exactly: useful for tests and for reproducing bugs.
// Returns a function with the same shape as Math.random: a number in [0, 1).

export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
