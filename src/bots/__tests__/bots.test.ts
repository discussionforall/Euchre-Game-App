import { botStep, chooseBotAction } from '..';
import { BiddingState, Contract, startBidding } from '../../engine/bidding';
import { Card, cardLabel, Rank, Suit } from '../../engine/cards';
import { GameState, newGame } from '../../engine/game';
import { seededRandom } from '../../engine/random';
import { Play } from '../../engine/rules';
import { Seat } from '../../engine/seats';
import { chooseBid, chooseDiscard } from '../bidding';
import { choosePlay } from '../play';
import { handStrength } from '../strength';
import { PlayerView } from '../view';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const play = (seat: Seat, rank: Rank, suit: Suit): Play => ({ seat, card: c(rank, suit) });
const contract = (trump: Suit, maker: Seat): Contract => ({ trump, maker, alone: false, dealerPicksUp: false });

function view(overrides: Partial<PlayerView>): PlayerView {
  const upCard = overrides.upCard ?? c('9', 'clubs');
  const dealer = overrides.dealer ?? 3;
  return {
    seat: 0,
    phase: 'playing',
    hand: [],
    dealer,
    upCard,
    bidding: startBidding(dealer, upCard),
    contract: null,
    trick: [],
    completedTricks: [],
    scores: [0, 0],
    ...overrides,
  };
}

describe('handStrength', () => {
  it('scores a monster hand highly', () => {
    // 3 + 2.5 + 2 + 1.5 + 1 (A♠) + 0.5 x2 (void in clubs and diamonds) = 11
    const hand = [c('J', 'hearts'), c('J', 'diamonds'), c('A', 'hearts'), c('K', 'hearts'), c('A', 'spades')];
    expect(handStrength(hand, 'hearts')).toBe(11);
  });

  it('scores a hand with no trump and no aces as zero', () => {
    const hand = [c('9', 'clubs'), c('10', 'clubs'), c('Q', 'spades'), c('K', 'diamonds'), c('9', 'diamonds')];
    expect(handStrength(hand, 'hearts')).toBe(0);
  });
});

describe('chooseBid', () => {
  it('orders up a strong hand', () => {
    const hand = [c('J', 'hearts'), c('A', 'hearts'), c('K', 'hearts'), c('9', 'clubs'), c('10', 'spades')];
    // Dealer 1 is an opponent; still strong enough.
    const bid = chooseBid(view({ phase: 'bidding', hand, dealer: 1, upCard: c('9', 'hearts') }));
    expect(bid).toEqual({ type: 'orderUp', alone: false });
  });

  it('passes a weak hand', () => {
    const hand = [c('9', 'hearts'), c('10', 'clubs'), c('Q', 'clubs'), c('9', 'spades'), c('K', 'diamonds')];
    expect(chooseBid(view({ phase: 'bidding', hand, upCard: c('A', 'hearts') }))).toEqual({ type: 'pass' });
  });

  it('goes alone with a monster hand', () => {
    const hand = [c('J', 'hearts'), c('J', 'diamonds'), c('A', 'hearts'), c('K', 'hearts'), c('A', 'spades')];
    const bid = chooseBid(view({ phase: 'bidding', hand, dealer: 2, upCard: c('9', 'hearts') }));
    expect(bid).toEqual({ type: 'orderUp', alone: true });
  });

  it('as dealer, judges the hand after picking up', () => {
    // Alone this hand is weak in hearts, but picking up the right bower makes it strong.
    const hand = [c('A', 'hearts'), c('K', 'hearts'), c('9', 'hearts'), c('9', 'clubs'), c('10', 'spades')];
    const upCard = c('J', 'hearts');
    const bidding: BiddingState = { dealer: 0, upCard, round: 1, turn: 0, passes: 3 };
    expect(chooseBid(view({ phase: 'bidding', hand, dealer: 0, upCard, bidding })).type).toBe('orderUp');
  });

  it('in round 2 switches to the same-color suit when hearts were turned down', () => {
    // Both red Jacks: in diamonds, J♦ is the right bower and J♥ the left.
    const hand = [c('J', 'hearts'), c('J', 'diamonds'), c('A', 'hearts'), c('A', 'spades'), c('K', 'spades')];
    const upCard = c('9', 'hearts');
    const bidding: BiddingState = { dealer: 3, upCard, round: 2, turn: 0, passes: 0 };
    const bid = chooseBid(view({ phase: 'bidding', hand, upCard, bidding }));
    expect(bid).toEqual({ type: 'callSuit', suit: 'diamonds', alone: false });
  });

  it('a stuck dealer always calls something', () => {
    const hand = [c('9', 'clubs'), c('10', 'clubs'), c('Q', 'spades'), c('9', 'diamonds'), c('10', 'hearts')];
    const upCard = c('A', 'hearts');
    const bidding: BiddingState = { dealer: 0, upCard, round: 2, turn: 0, passes: 3 };
    const bid = chooseBid(view({ phase: 'bidding', hand, dealer: 0, upCard, bidding }));
    expect(bid.type).toBe('callSuit');
  });
});

describe('chooseDiscard', () => {
  it('throws away a lone low card to become void', () => {
    const six = [c('J', 'hearts'), c('A', 'hearts'), c('9', 'hearts'), c('K', 'clubs'), c('9', 'clubs'), c('10', 'spades')];
    expect(cardLabel(chooseDiscard(six, 'hearts'))).toBe('10♠');
  });

  it('keeps trump and Aces when possible', () => {
    const six = [c('J', 'hearts'), c('A', 'hearts'), c('A', 'spades'), c('A', 'clubs'), c('9', 'clubs'), c('K', 'hearts')];
    expect(cardLabel(chooseDiscard(six, 'hearts'))).toBe('9♣');
  });

  it('with only trump, throws the lowest trump', () => {
    const six = [c('J', 'hearts'), c('J', 'diamonds'), c('A', 'hearts'), c('K', 'hearts'), c('9', 'hearts'), c('10', 'hearts')];
    expect(cardLabel(chooseDiscard(six, 'hearts'))).toBe('9♥');
  });
});

describe('choosePlay: leading', () => {
  it('pulls trump with the right bower when our team made it', () => {
    const hand = [c('J', 'hearts'), c('9', 'hearts'), c('A', 'clubs')];
    expect(cardLabel(choosePlay(view({ hand, contract: contract('hearts', 2) })))).toBe('J♥');
  });

  it('does not lead the Ace of trump while the bowers are unseen', () => {
    const hand = [c('A', 'hearts'), c('A', 'clubs'), c('9', 'spades')];
    expect(cardLabel(choosePlay(view({ hand, contract: contract('hearts', 0) })))).toBe('A♣');
  });

  it('leads an off-suit Ace when the opponents made trump', () => {
    const hand = [c('J', 'hearts'), c('A', 'clubs'), c('9', 'spades')];
    expect(cardLabel(choosePlay(view({ hand, contract: contract('hearts', 1) })))).toBe('A♣');
  });

  it('otherwise leads its lowest non-trump card', () => {
    const hand = [c('9', 'hearts'), c('K', 'clubs'), c('10', 'spades')];
    expect(cardLabel(choosePlay(view({ hand, contract: contract('hearts', 1) })))).toBe('10♠');
  });
});

describe('choosePlay: following', () => {
  it('plays low when the partner is winning', () => {
    const hand = [c('A', 'clubs'), c('9', 'clubs')];
    const trick = [play(1, '10', 'clubs'), play(2, 'K', 'clubs'), play(3, 'Q', 'clubs')];
    expect(cardLabel(choosePlay(view({ hand, trick, contract: contract('hearts', 1) })))).toBe('9♣');
  });

  it('wins as cheaply as possible', () => {
    const hand = [c('A', 'clubs'), c('K', 'clubs'), c('9', 'clubs')];
    const trick = [play(1, 'Q', 'clubs')];
    expect(cardLabel(choosePlay(view({ hand, trick, contract: contract('hearts', 1) })))).toBe('K♣');
  });

  it('trumps in with its lowest trump when void', () => {
    const hand = [c('9', 'hearts'), c('A', 'hearts'), c('10', 'spades')];
    const trick = [play(1, 'A', 'clubs')];
    expect(cardLabel(choosePlay(view({ hand, trick, contract: contract('hearts', 1) })))).toBe('9♥');
  });

  it('throws its lowest card when it cannot win', () => {
    const hand = [c('9', 'clubs'), c('Q', 'clubs')];
    const trick = [play(1, 'A', 'clubs')];
    expect(cardLabel(choosePlay(view({ hand, trick, contract: contract('hearts', 1) })))).toBe('9♣');
  });
});

describe('no peeking', () => {
  it('a bot decides the same way whatever the other players hold', () => {
    // Let bots play until we are in the middle of a trick.
    let state: GameState = newGame(seededRandom(3));
    while (!(state.phase === 'playing' && state.trick.length === 1)) state = botStep(state);

    // Give every other player someone else's cards. If the bot only uses
    // its own view, its choice cannot change.
    const me = state.turn;
    const others = state.hands.filter((_, seat) => seat !== me);
    const rotated = [others[1], others[2], others[0]];
    let next = 0;
    const tampered: GameState = {
      ...state,
      hands: state.hands.map((h, seat) => (seat === me ? h : rotated[next++])),
    };
    expect(chooseBotAction(tampered)).toEqual(chooseBotAction(state));
  });
});
