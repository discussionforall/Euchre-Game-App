import { Card, cardLabel, Rank, Suit } from '../../engine/cards';
import { describeAnnouncement, describeBid, describeHandResult, sortHand } from '../text';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });

describe('describeBid', () => {
  it('names each kind of bid', () => {
    expect(describeBid({ type: 'pass' }, 1, 3)).toBe('Pass');
    expect(describeBid({ type: 'orderUp', alone: false }, 1, 3)).toBe('Order up');
    expect(describeBid({ type: 'orderUp', alone: true }, 3, 3)).toBe('Picks it up alone');
    expect(describeBid({ type: 'callSuit', suit: 'hearts', alone: false }, 2, 3)).toBe('♥ Hearts');
  });
});

describe('describeHandResult', () => {
  const contract = { trump: 'hearts' as Suit, maker: 1 as const, alone: true, dealerPicksUp: false };

  it('describes a euchre of a lone player by name', () => {
    const result = describeHandResult({ outcome: 'euchred', team: 0, points: 2 }, contract, 1);
    expect(result.title).toBe('Euchred!');
    expect(result.detail).toBe('West went alone but took only 1 trick.\n+2 to You & Partner');
  });

  it('describes a euchre of a team', () => {
    const result = describeHandResult({ outcome: 'euchred', team: 0, points: 2 }, { ...contract, alone: false }, 2);
    expect(result.detail).toBe('Opponents called trump but took only 2 tricks.\n+2 to You & Partner');
  });

  it('calls a 4-point hand a lone march', () => {
    expect(describeHandResult({ outcome: 'march', team: 1, points: 4 }, contract, 5).title).toBe('Lone march!');
  });

  it('gives the real trick count when made', () => {
    const made = describeHandResult({ outcome: 'made', team: 1, points: 1 }, { ...contract, alone: false }, 3);
    expect(made.detail).toBe('Opponents took 3 tricks.\n+1 to Opponents');
  });
});

describe('sortHand', () => {
  it('groups by suit, highest first, before trump is known', () => {
    const hand = [c('9', 'hearts'), c('A', 'spades'), c('K', 'hearts'), c('10', 'clubs'), c('J', 'diamonds')];
    expect(sortHand(hand, null).map(cardLabel)).toEqual(['A♠', 'K♥', '9♥', '10♣', 'J♦']);
  });

  it('puts trump first and treats the left bower as trump', () => {
    const hand = [c('9', 'hearts'), c('A', 'spades'), c('K', 'hearts'), c('10', 'clubs'), c('J', 'diamonds')];
    expect(sortHand(hand, 'hearts').map(cardLabel)).toEqual(['J♦', 'K♥', '9♥', 'A♠', '10♣']);
  });
});

describe('describeAnnouncement', () => {
  const upCard = c('A', 'clubs');

  it('tells the human dealer the card is going into their hand', () => {
    const contract = { trump: 'clubs' as Suit, maker: 1 as const, alone: false, dealerPicksUp: true };
    expect(describeAnnouncement(contract, 0, upCard)).toEqual({
      title: 'West ordered up ♣ Clubs',
      details: ["You're the dealer: the A♣ goes into your hand."],
    });
  });

  it('a dealer picking up for themselves needs no extra line', () => {
    const contract = { trump: 'clubs' as Suit, maker: 3 as const, alone: false, dealerPicksUp: true };
    expect(describeAnnouncement(contract, 3, upCard)).toEqual({ title: 'East picked up ♣ Clubs', details: [] });
  });

  it('names a called suit and who sits out when going alone', () => {
    const contract = { trump: 'hearts' as Suit, maker: 2 as const, alone: true, dealerPicksUp: false };
    expect(describeAnnouncement(contract, 1, upCard)).toEqual({
      title: 'Partner called ♥ Hearts alone',
      details: ['Your partner goes alone: you sit this hand out.'],
    });
  });
});
