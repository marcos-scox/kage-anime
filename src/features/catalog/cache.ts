interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

const PREFIX = 'kage-cache:v1:';

export function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data } satisfies CacheEntry<T>));
  } catch {
    // Storage quota/private mode must never block catalog browsing.
  }
}
