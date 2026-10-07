import { Card, cardLabel, createDeck, RANKS, sameCard, shuffle, SUITS } from '../cards';

describe('createDeck', () => {
  it('has 24 cards', () => {
    expect(createDeck()).toHaveLength(24);
  });

  it('has 6 cards in every suit', () => {
    const deck = createDeck();
    for (const suit of SUITS) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(6);
    }
  });

  it('has no duplicates', () => {
    const labels = createDeck().map(cardLabel);
    expect(new Set(labels).size).toBe(24);
  });

  it('contains no cards below 9', () => {
    const deck = createDeck();
    expect(deck.every((c) => RANKS.includes(c.rank))).toBe(true);
  });
});

describe('cardLabel', () => {
  it('combines rank and suit symbol', () => {
    expect(cardLabel({ suit: 'hearts', rank: 'J' })).toBe('J♥');
    expect(cardLabel({ suit: 'spades', rank: '10' })).toBe('10♠');
  });
});

describe('sameCard', () => {
  it('compares by suit and rank', () => {
    const a: Card = { suit: 'clubs', rank: 'A' };
    expect(sameCard(a, { suit: 'clubs', rank: 'A' })).toBe(true);
    expect(sameCard(a, { suit: 'spades', rank: 'A' })).toBe(false);
  });
});

describe('shuffle', () => {
  it('keeps exactly the same cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(24);
    expect(shuffled.map(cardLabel).sort()).toEqual(deck.map(cardLabel).sort());
  });

  it('does not modify the original deck', () => {
    const deck = createDeck();
    const before = deck.map(cardLabel);
    shuffle(deck);
    expect(deck.map(cardLabel)).toEqual(before);
  });

  it('is predictable when given a fixed random function', () => {
    const alwaysZero = () => 0;
    const first = shuffle(createDeck(), alwaysZero).map(cardLabel);
    const second = shuffle(createDeck(), alwaysZero).map(cardLabel);
    expect(first).toEqual(second);
  });

  it('actually changes the order', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, () => 0);
    expect(shuffled.map(cardLabel)).not.toEqual(deck.map(cardLabel));
  });
});
