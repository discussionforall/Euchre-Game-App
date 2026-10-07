// Runs a game for the screen: holds the state, lets bots act after a short
// delay, and keeps a finished trick on the table long enough to see it.

import { useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { chooseBotAction } from '../bots';
import { Contract } from '../engine/bidding';
import { applyAction, CompletedTrick, GameAction, GameState, newGame, startNextHand } from '../engine/game';
import { Seat } from '../engine/seats';
import { describeBid } from './text';

export const HUMAN: Seat = 0;

export type Speed = 'normal' | 'fast';

export interface Timings {
  // How long a bot "thinks" before acting.
  botDelay: number;
  // How long a finished trick stays on the table in total...
  trickPause: number;
  // ...of which it sits still this long, then sweeps to the winner.
  collectAfter: number;
  collectDuration: number;
  // How long the "West ordered up ♣" banner stays before play goes on.
  announce: number;
}

export const TIMINGS: Record<Speed, Timings> = {
  normal: { botDelay: 800, trickPause: 1450, collectAfter: 950, collectDuration: 400, announce: 2600 },
  fast: { botDelay: 350, trickPause: 800, collectAfter: 450, collectDuration: 280, announce: 1600 },
};

// How long the deal animation takes (5 cards, staggered). Nobody acts
// until it has finished.
export const DEAL_STAGGER_MS = 90;
export const DEAL_DURATION_MS = 5 * DEAL_STAGGER_MS + 350;

// True for the very first action of a hand, before anyone has bid.
function isStartOfHand(game: GameState): boolean {
  return game.phase === 'bidding' && game.bidding.round === 1 && game.bidding.passes === 0;
}

// Lets layout changes (a card leaving your hand, a bot's card count
// shrinking) slide smoothly instead of jumping.
function animateNextLayout() {
  LayoutAnimation.configureNext({
    duration: 260,
    update: { type: LayoutAnimation.Types.spring, springDamping: 0.75 },
  });
}

type BidLog = readonly (string | null)[];
const EMPTY_LOG: BidLog = [null, null, null, null];

function isActionPhase(game: GameState): boolean {
  return game.phase === 'bidding' || game.phase === 'discard' || game.phase === 'playing';
}

interface Options {
  speed: Speed;
  // Bots only act (and tricks only clear) while the game is on screen, so a
  // game left for the home screen waits exactly where it was.
  active: boolean;
}

export function useEuchre({ speed, active }: Options) {
  const [game, setGame] = useState<GameState>(() => newGame());
  // What each player said during bidding this hand, e.g. "Pass".
  const [bidLog, setBidLog] = useState<BidLog>(EMPTY_LOG);
  // A finished trick still being shown before it is cleared away.
  const [shownTrick, setShownTrick] = useState<CompletedTrick | null>(null);
  // Trump was just chosen: everything pauses while this is announced.
  const [announcement, setAnnouncement] = useState<Contract | null>(null);
  const timings = TIMINGS[speed];
  const { botDelay, trickPause, announce } = timings;

  const act = (action: GameAction) => {
    const next = applyAction(game, action);
    animateNextLayout();
    if (action.type === 'bid') {
      const text = describeBid(action.bid, game.turn, game.dealer);
      setBidLog((log) => log.map((entry, seat) => (seat === game.turn ? text : entry)));
    }
    if (game.phase === 'bidding' && next.phase !== 'bidding') {
      setAnnouncement(next.contract);
    }
    if (next.completedTricks.length > game.completedTricks.length) {
      setShownTrick(next.completedTricks[next.completedTricks.length - 1]);
    }
    setGame(next);
  };

  const isPaused = shownTrick !== null || announcement !== null;
  const humanCanAct = !isPaused && isActionPhase(game) && game.turn === HUMAN;

  // Timers: first let a finished trick sit on the table, then let bots act.
  // Each timer is cancelled if the state changes before it fires.
  useEffect(() => {
    if (!active) return;
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(null), announce);
      return () => clearTimeout(timer);
    }
    if (shownTrick) {
      const timer = setTimeout(() => setShownTrick(null), trickPause);
      return () => clearTimeout(timer);
    }
    if (isActionPhase(game) && game.turn !== HUMAN) {
      const delay = isStartOfHand(game) ? Math.max(botDelay, DEAL_DURATION_MS) : botDelay;
      const timer = setTimeout(() => act(chooseBotAction(game)), delay);
      return () => clearTimeout(timer);
    }
  }, [game, shownTrick, announcement, botDelay, trickPause, announce, active]);

  return {
    game,
    bidLog,
    shownTrick,
    announcement,
    humanCanAct,
    act,
    timings,
    nextHand: () => {
      setBidLog(EMPTY_LOG);
      setAnnouncement(null);
      setGame(startNextHand(game));
    },
    restart: () => {
      setBidLog(EMPTY_LOG);
      setAnnouncement(null);
      setShownTrick(null);
      setGame(newGame());
    },
  };
}
