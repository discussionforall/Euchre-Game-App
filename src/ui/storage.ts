// Saving small things between app launches (stats, settings) with
// AsyncStorage. Failures are ignored: the game still works, it just
// forgets.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const STATS_KEY = 'euchre.stats.v1';
export const SETTINGS_KEY = 'euchre.settings.v1';

// Loads a saved object, filling in any missing fields from `fallback`
// (so adding a new field later does not break old saves).
export async function loadSaved<T extends object>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}
