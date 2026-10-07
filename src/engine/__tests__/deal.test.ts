import { cardLabel, createDeck, shuffle } from '../cards';
import { dealHands } from '../deal';

describe('dealHands', () => {
  it('gives every player 5 cards, 1 up card and 3 in the kitty', () => {
    const deal = dealHands(shuffle(createDeck()), 0);
    expect(deal.hands).toHaveLength(4);
    for (const hand of deal.hands) {
      expect(hand).toHaveLength(5);
    }
    expect(deal.kitty).toHaveLength(3);
  });

  it('uses every card exactly once', () => {
    const deal = dealHands(shuffle(createDeck()), 0);
    const all = [...deal.hands.flat(), deal.upCard, ...deal.kitty].map(cardLabel);
    expect(new Set(all).size).toBe(24);
  });

  it('starts with the player left of the dealer', () => {
    const deck = createDeck(); // unshuffled, so we know the order
    const deal = dealHands(deck, 1);
    // Dealer is seat 1, so seat 2 gets the first card, seat 3 the second...
    expect(deal.hands[2][0]).toEqual(deck[0]);
    expect(deal.hands[3][0]).toEqual(deck[1]);
    expect(deal.hands[0][0]).toEqual(deck[2]);
    expect(deal.hands[1][0]).toEqual(deck[3]);
  });

  it('turns up the 21st card and keeps the last 3 as the kitty', () => {
    const deck = createDeck();
    const deal = dealHands(deck, 0);
    expect(deal.upCard).toEqual(deck[20]);
    expect(deal.kitty).toEqual(deck.slice(21));
  });

  it('rejects a deck that is not 24 cards', () => {
    expect(() => dealHands(createDeck().slice(1), 0)).toThrow();
  });
});
