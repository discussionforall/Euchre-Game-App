// State shared by every screen: the current game (so "Continue" works after
// visiting the home screen), the settings, and the win/loss stats.

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { GameState } from '../engine/game';
import { teamOf } from '../engine/seats';
import { EMPTY_STATS, recordResult, Stats } from './stats';
import { loadSaved, save, SETTINGS_KEY, STATS_KEY } from './storage';
import { HUMAN, Speed, useEuchre } from './useEuchre';

export interface Settings {
  speed: Speed;
}

const DEFAULT_SETTINGS: Settings = { speed: 'normal' };

type AppStateValue = ReturnType<typeof useEuchre> & {
  // A game has been started this session (it may already be over).
  started: boolean;
  // There is an unfinished game to continue.
  inProgress: boolean;
  startNewGame: () => void;
  // The game screen sets this while it is visible.
  setActive: (active: boolean) => void;
  settings: Settings;
  updateSettings: (change: Partial<Settings>) => void;
  stats: Stats;
  resetStats: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(false);
  const euchre = useEuchre({ speed: settings.speed, active });
  const { game } = euchre;

  // Load saved settings and stats once, when the app opens.
  useEffect(() => {
    loadSaved(SETTINGS_KEY, DEFAULT_SETTINGS).then(setSettings);
    loadSaved(STATS_KEY, EMPTY_STATS).then(setStats);
  }, []);

  // Record each finished game exactly once.
  const recorded = useRef<GameState | null>(null);
  useEffect(() => {
    if (!started || game.phase !== 'gameOver' || game.winner === null || recorded.current === game) return;
    recorded.current = game;
    setStats((current) => {
      const next = recordResult(current, game.winner === teamOf(HUMAN));
      save(STATS_KEY, next);
      return next;
    });
  }, [game, started]);

  const value: AppStateValue = {
    ...euchre,
    started,
    inProgress: started && game.phase !== 'gameOver',
    startNewGame: () => {
      euchre.restart();
      setStarted(true);
    },
    setActive,
    settings,
    updateSettings: (change) => {
      const next = { ...settings, ...change };
      setSettings(next);
      save(SETTINGS_KEY, next);
    },
    stats,
    resetStats: () => {
      setStats(EMPTY_STATS);
      save(STATS_KEY, EMPTY_STATS);
    },
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside <AppStateProvider>');
  return value;
}
