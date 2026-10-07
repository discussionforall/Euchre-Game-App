import { Card, cardLabel, createDeck, Rank, Suit } from '../cards';
import {
  effectiveSuit,
  isLeftBower,
  isRightBower,
  isTrump,
  rankValue,
  sameColorSuit,
  suitColor,
} from '../trump';

const card = (rank: Rank, suit: Suit): Card => ({ rank, suit });

// Sorts cards of one effective suit from highest to lowest and returns labels.
const highToLow = (cards: Card[], trump: Suit) =>
  [...cards].sort((a, b) => rankValue(b, trump) - rankValue(a, trump)).map(cardLabel);

describe('colors', () => {
  it('knows red and black suits', () => {
    expect(suitColor('hearts')).toBe('red');
    expect(suitColor('diamonds')).toBe('red');
    expect(suitColor('clubs')).toBe('black');
    expect(suitColor('spades')).toBe('black');
  });

  it('pairs each suit with the other suit of its color', () => {
    expect(sameColorSuit('hearts')).toBe('diamonds');
    expect(sameColorSuit('diamonds')).toBe('hearts');
    expect(sameColorSuit('clubs')).toBe('spades');
    expect(sameColorSuit('spades')).toBe('clubs');
  });
});

describe('bowers with hearts as trump', () => {
  const trump: Suit = 'hearts';

  it('J♥ is the right bower', () => {
    expect(isRightBower(card('J', 'hearts'), trump)).toBe(true);
    expect(isLeftBower(card('J', 'hearts'), trump)).toBe(false);
  });

  it('J♦ is the left bower', () => {
    expect(isLeftBower(card('J', 'diamonds'), trump)).toBe(true);
    expect(isRightBower(card('J', 'diamonds'), trump)).toBe(false);
  });

  it('black Jacks are ordinary cards', () => {
    for (const suit of ['clubs', 'spades'] as const) {
      expect(isLeftBower(card('J', suit), trump)).toBe(false);
      expect(isRightBower(card('J', suit), trump)).toBe(false);
      expect(effectiveSuit(card('J', suit), trump)).toBe(suit);
    }
  });

  it('the left bower counts as a heart, not a diamond', () => {
    expect(effectiveSuit(card('J', 'diamonds'), trump)).toBe('hearts');
    expect(isTrump(card('J', 'diamonds'), trump)).toBe(true);
  });

  it('other diamonds stay diamonds', () => {
    expect(effectiveSuit(card('A', 'diamonds'), trump)).toBe('diamonds');
    expect(isTrump(card('A', 'diamonds'), trump)).toBe(false);
  });
});

describe('suit sizes once trump is chosen', () => {
  it('trump has 7 cards, its same-color suit has 5, the others have 6', () => {
    const deck = createDeck();
    const count = (suit: Suit) => deck.filter((c) => effectiveSuit(c, 'spades') === suit).length;
    expect(count('spades')).toBe(7);
    expect(count('clubs')).toBe(5);
    expect(count('hearts')).toBe(6);
    expect(count('diamonds')).toBe(6);
  });
});

describe('rankValue ordering', () => {
  it('orders trump: right, left, A, K, Q, 10, 9', () => {
    const trumpCards = createDeck().filter((c) => isTrump(c, 'hearts'));
    expect(highToLow(trumpCards, 'hearts')).toEqual(['J♥', 'J♦', 'A♥', 'K♥', 'Q♥', '10♥', '9♥']);
  });

  it('orders a plain suit: A, K, Q, J, 10, 9', () => {
    const clubs = createDeck().filter((c) => c.suit === 'clubs');
    expect(highToLow(clubs, 'hearts')).toEqual(['A♣', 'K♣', 'Q♣', 'J♣', '10♣', '9♣']);
  });

  it('orders the same-color suit without its Jack: A, K, Q, 10, 9', () => {
    const diamonds = createDeck().filter((c) => effectiveSuit(c, 'hearts') === 'diamonds');
    expect(highToLow(diamonds, 'hearts')).toEqual(['A♦', 'K♦', 'Q♦', '10♦', '9♦']);
  });

  it('works the same for a black trump suit', () => {
    const trumpCards = createDeck().filter((c) => isTrump(c, 'clubs'));
    expect(highToLow(trumpCards, 'clubs')).toEqual(['J♣', 'J♠', 'A♣', 'K♣', 'Q♣', '10♣', '9♣']);
  });
});
