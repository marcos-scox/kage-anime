import type { AnimeSummary, WatchProgress } from '../../types/anime';

const FAVORITES_KEY = 'kage:favorites:v1';
const HISTORY_KEY = 'kage:history:v1';

function read<T>(key: string): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : ([] as T);
  } catch {
    return [] as T;
  }
}

export function loadFavorites(): AnimeSummary[] {
  return read<AnimeSummary[]>(FAVORITES_KEY);
}

export function saveFavorites(items: AnimeSummary[]): void {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(items)); } catch { /* Keep app usable if storage is unavailable. */ }
}

export function loadHistory(): WatchProgress[] {
  return read<WatchProgress[]>(HISTORY_KEY);
}

export function saveHistory(items: WatchProgress[]): void {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); } catch { /* Keep app usable if storage is unavailable. */ }
}
