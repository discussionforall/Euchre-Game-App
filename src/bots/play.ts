// Bot decisions during play: which card to lead or follow with.

import { Card, createDeck, sameCard, Suit } from '../engine/cards';
import { legalPlays, trickWinner } from '../engine/rules';
import { partnerOf, teamOf } from '../engine/seats';
import { isTrump } from '../engine/trump';
import { cardValue, highest, lowest } from './strength';
import { PlayerView } from './view';

// Every card already played this hand, including the current trick.
function playedCards(view: PlayerView): Card[] {
  return [...view.completedTricks.flatMap((t) => t.plays), ...view.trick].map((p) => p.card);
}

// True if no unseen card can beat `card` in trump: every higher trump has
// either been played already or is in our own hand.
function isBossTrump(card: Card, view: PlayerView, trump: Suit): boolean {
  const known = [...playedCards(view), ...view.hand];
  return createDeck()
    .filter((c) => isTrump(c, trump) && cardValue(c, trump) > cardValue(card, trump))
    .every((higher) => known.some((k) => sameCard(k, higher)));
}

function chooseLead(view: PlayerView, trump: Suit): Card {
  const { hand, seat, contract } = view;
  const trumps = hand.filter((c) => isTrump(c, trump));
  const plain = hand.filter((c) => !isTrump(c, trump));
  const weMadeTrump = contract !== null && teamOf(contract.maker) === teamOf(seat);

  // Our trump: pull the opponents' trump with a card nobody can beat.
  if (weMadeTrump && trumps.length > 0) {
    const top = highest(trumps, trump);
    if (isBossTrump(top, view, trump)) return top;
  }

  // An off-suit Ace usually wins the trick.
  const ace = plain.find((c) => c.rank === 'A');
  if (ace) return ace;

  // Otherwise lead something cheap, keeping trump for later.
  return lowest(plain.length > 0 ? plain : hand, trump);
}

function chooseFollow(view: PlayerView, legal: Card[], trump: Suit): Card {
  const { seat, trick } = view;

  // Partner is already winning: don't waste a good card on it.
  if (trickWinner(trick, trump).seat === partnerOf(seat)) {
    return lowest(legal, trump);
  }

  // Win as cheaply as possible; if we can't win, throw away the lowest card.
  const winners = legal.filter((card) => trickWinner([...trick, { seat, card }], trump).seat === seat);
  return lowest(winners.length > 0 ? winners : legal, trump);
}

export function choosePlay(view: PlayerView): Card {
  if (view.contract === null) throw new Error('No trump has been chosen');
  const trump = view.contract.trump;
  const legal = legalPlays(view.hand, view.trick, trump);

  if (legal.length === 1) return legal[0];
  return view.trick.length === 0 ? chooseLead(view, trump) : chooseFollow(view, legal, trump);
}
