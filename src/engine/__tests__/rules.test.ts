import { Card, cardLabel, Rank, Suit } from '../cards';
import { ledSuit, legalPlays, Play, trickWinner } from '../rules';
import { Seat } from '../seats';

const card = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const play = (seat: Seat, rank: Rank, suit: Suit): Play => ({ seat, card: card(rank, suit) });
const labels = (cards: Card[]) => cards.map(cardLabel);

describe('ledSuit', () => {
  it('is null before anyone plays', () => {
    expect(ledSuit([], 'hearts')).toBeNull();
  });

  it('is the suit of the first card', () => {
    expect(ledSuit([play(0, 'A', 'clubs')], 'hearts')).toBe('clubs');
  });

  it('is trump when the left bower is led', () => {
    expect(ledSuit([play(0, 'J', 'diamonds')], 'hearts')).toBe('hearts');
  });
});

describe('legalPlays', () => {
  const hand = [card('A', 'clubs'), card('9', 'clubs'), card('K', 'hearts'), card('J', 'diamonds')];

  it('allows any card when leading', () => {
    expect(legalPlays(hand, [], 'spades')).toHaveLength(4);
  });

  it('must follow the led suit', () => {
    const trick = [play(0, '10', 'clubs')];
    expect(labels(legalPlays(hand, trick, 'spades'))).toEqual(['A♣', '9♣']);
  });

  it('allows any card when void in the led suit', () => {
    const trick = [play(0, '10', 'spades')];
    expect(legalPlays(hand, trick, 'spades')).toHaveLength(4);
  });

  it('the left bower cannot follow its printed suit', () => {
    // Hearts are trump, so J♦ is a heart. This hand has no diamonds at all.
    const trick = [play(0, 'A', 'diamonds')];
    const myHand = [card('J', 'diamonds'), card('9', 'spades')];
    expect(labels(legalPlays(myHand, trick, 'hearts'))).toEqual(['J♦', '9♠']);
  });

  it('the left bower must be played to follow trump', () => {
    // Hearts are trump and lead; J♦ is my only heart, so I must play it.
    const trick = [play(0, '9', 'hearts')];
    const myHand = [card('J', 'diamonds'), card('A', 'diamonds')];
    expect(labels(legalPlays(myHand, trick, 'hearts'))).toEqual(['J♦']);
  });

  it('quiz answer: spades trump, clubs led, holding J♣ and K♥ only', () => {
    const trick = [play(0, 'A', 'clubs')];
    const myHand = [card('J', 'clubs'), card('K', 'hearts')];
    expect(labels(legalPlays(myHand, trick, 'spades'))).toEqual(['J♣', 'K♥']);
  });
});

describe('trickWinner', () => {
  it('highest card of the led suit wins when no trump is played', () => {
    const trick = [play(0, 'K', 'clubs'), play(1, 'A', 'clubs'), play(2, '9', 'clubs'), play(3, 'Q', 'clubs')];
    expect(trickWinner(trick, 'hearts').seat).toBe(1);
  });

  it('an off-suit Ace cannot win', () => {
    const trick = [play(0, '9', 'clubs'), play(1, 'A', 'spades'), play(2, 'A', 'diamonds'), play(3, '10', 'clubs')];
    expect(trickWinner(trick, 'hearts').seat).toBe(3);
  });

  it('the lowest trump beats the led suit', () => {
    const trick = [play(0, 'A', 'clubs'), play(1, '9', 'hearts'), play(2, 'K', 'clubs'), play(3, 'Q', 'clubs')];
    expect(trickWinner(trick, 'hearts').seat).toBe(1);
  });

  it('higher trump beats lower trump', () => {
    const trick = [play(0, 'A', 'clubs'), play(1, '9', 'hearts'), play(2, 'A', 'hearts'), play(3, 'Q', 'clubs')];
    expect(trickWinner(trick, 'hearts').seat).toBe(2);
  });

  it('right bower beats left bower beats Ace of trump', () => {
    const trick = [play(0, 'A', 'hearts'), play(1, 'J', 'diamonds'), play(2, 'J', 'hearts'), play(3, 'K', 'hearts')];
    expect(trickWinner(trick, 'hearts').seat).toBe(2);
  });

  it('the left bower wins over the Ace of trump', () => {
    const trick = [play(0, 'A', 'hearts'), play(1, 'J', 'diamonds'), play(2, 'K', 'hearts'), play(3, '9', 'hearts')];
    expect(trickWinner(trick, 'hearts').seat).toBe(1);
  });

  it('the left bower trumps a diamond lead', () => {
    // Hearts are trump: J♦ is not a diamond, it is trump, so it wins.
    const trick = [play(0, 'A', 'diamonds'), play(1, 'J', 'diamonds'), play(2, 'K', 'diamonds'), play(3, '9', 'diamonds')];
    expect(trickWinner(trick, 'hearts').seat).toBe(1);
  });

  it('the leader wins if nobody follows or trumps', () => {
    const trick = [play(2, '9', 'spades'), play(3, 'A', 'clubs'), play(0, 'A', 'diamonds'), play(1, 'K', 'clubs')];
    expect(trickWinner(trick, 'hearts').seat).toBe(2);
  });

  it('works with only 3 cards (someone going alone)', () => {
    const trick = [play(1, 'K', 'spades'), play(2, 'A', 'spades'), play(3, '10', 'spades')];
    expect(trickWinner(trick, 'hearts').seat).toBe(2);
  });

  it('refuses an empty trick', () => {
    expect(() => trickWinner([], 'hearts')).toThrow();
  });
});
