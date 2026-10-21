import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnimeSummary, WatchProgress } from '../../types/anime';
import { loadFavorites, loadHistory, saveFavorites, saveHistory } from './storage';
import { getSupabase, supabaseConfigured } from '../auth/supabase';

const SYNC_FAILURE = 'A sincronização falhou. Seus dados locais foram preservados neste dispositivo.';
type SyncQuery = PromiseLike<{ error: unknown | null }>;

interface LibraryContextValue {
  favorites: AnimeSummary[];
  history: WatchProgress[];
  userId: string | null;
  syncConfigured: boolean;
  syncError: string | null;
  toggleFavorite: (anime: AnimeSummary) => void;
  removeHistory: (id: string) => void;
  recordProgress: (anime: AnimeSummary, episodeNumber: number | null, episodeTitle: string | null, positionSeconds: number, durationSeconds: number) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);
const historyId = (animeId: number, episodeNumber: number | null) => `${animeId}:${episodeNumber ?? 0}`;
const syncHistoryId = (userId: string, animeId: number, episodeNumber: number | null) => `${userId}:${animeId}:${episodeNumber ?? 0}`;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<AnimeSummary[]>(loadFavorites);
  const [history, setHistory] = useState<WatchProgress[]>(loadHistory);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => { saveFavorites(favorites); }, [favorites]);
  useEffect(() => { saveHistory(history); }, [history]);

  const reportSyncResult = useCallback(async (query: SyncQuery) => {
    try {
      const { error } = await query;
      setSyncError(error ? SYNC_FAILURE : null);
    } catch {
      setSyncError(SYNC_FAILURE);
    }
  }, []);

  const hydrateUser = useCallback(async (id: string) => {
    try {
      const client = await getSupabase();
      if (!client) return;
      const [remoteFavorites, remoteHistory] = await Promise.all([
        client.from('favorites').select('anime_id, anime_data').eq('user_id', id),
        client.from('watch_history').select('*').eq('user_id', id).order('updated_at', { ascending: false })
      ]);
      let failed = Boolean(remoteFavorites.error || remoteHistory.error);

      if (!remoteFavorites.error && Array.isArray(remoteFavorites.data)) {
        const fromCloud = remoteFavorites.data.flatMap((row) => row.anime_data ? [row.anime_data as AnimeSummary] : []);
        const merged = new Map<number, AnimeSummary>(fromCloud.map((anime) => [anime.mal_id, anime]));
        for (const anime of loadFavorites()) merged.set(anime.mal_id, anime);
        setFavorites([...merged.values()]);
        const writes = await Promise.all(loadFavorites().map((anime) => client.from('favorites').upsert({
          user_id: id,
          anime_id: anime.mal_id,
          anime_data: anime
        }, { onConflict: 'user_id,anime_id' })));
        if (writes.some((result) => result.error)) failed = true;
      }

      if (!remoteHistory.error && Array.isArray(remoteHistory.data)) {
        const fromCloud: WatchProgress[] = remoteHistory.data.flatMap((row) => {
          if (!row.anime_data) return [];
          const anime = row.anime_data as AnimeSummary;
          return [{
            id: historyId(anime.mal_id, row.episode_number ?? null),
            anime,
            episodeNumber: row.episode_number ?? null,
            episodeTitle: row.episode_title ?? null,
            positionSeconds: Number(row.playback_position_seconds ?? 0),
            durationSeconds: Number(row.duration_seconds ?? 0),
            updatedAt: row.updated_at ?? new Date().toISOString()
          }];
        });
        const merged = new Map<string, WatchProgress>(fromCloud.map((item) => [item.id, item]));
        for (const item of loadHistory()) {
          const cloudItem = merged.get(item.id);
          if (!cloudItem || item.updatedAt > cloudItem.updatedAt) merged.set(item.id, item);
        }
        setHistory([...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        const writes = await Promise.all(loadHistory().map((item) => client.from('watch_history').upsert({
          id: syncHistoryId(id, item.anime.mal_id, item.episodeNumber),
          user_id: id,
          anime_id: item.anime.mal_id,
          anime_data: item.anime,
          episode_number: item.episodeNumber,
          episode_title: item.episodeTitle,
          playback_position_seconds: item.positionSeconds,
          duration_seconds: item.durationSeconds,
          updated_at: item.updatedAt
        })));
        if (writes.some((result) => result.error)) failed = true;
      }

      setSyncError(failed ? SYNC_FAILURE : null);
    } catch {
      setSyncError(SYNC_FAILURE);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    void getSupabase().then(async (client) => {
      if (!client || !mounted) return;
      const { data, error } = await client.auth.getSession();
      if (error) setSyncError(SYNC_FAILURE);
      if (mounted && data.session?.user) {
        userIdRef.current = data.session.user.id;
        setUserId(data.session.user.id);
        void hydrateUser(data.session.user.id);
      }
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        const id = session?.user.id ?? null;
        userIdRef.current = id;
        setUserId(id);
        if (!id) setSyncError(null);
        if (id) window.setTimeout(() => { if (mounted) void hydrateUser(id); }, 0);
      });
      unsubscribe = () => subscription.unsubscribe();
    }).catch(() => setSyncError(SYNC_FAILURE));
    return () => { mounted = false; unsubscribe?.(); };
  }, [hydrateUser]);

  const toggleFavorite = useCallback((anime: AnimeSummary) => {
    const current = loadFavorites();
    const exists = current.some((item) => item.mal_id === anime.mal_id);
    const next = exists ? current.filter((item) => item.mal_id !== anime.mal_id) : [anime, ...current];
    saveFavorites(next);
    setFavorites(next);
    const id = userIdRef.current;
    if (id) void getSupabase().then((client) => {
      if (!client) return;
      const query = exists
        ? client.from('favorites').delete().eq('user_id', id).eq('anime_id', anime.mal_id)
        : client.from('favorites').upsert({ user_id: id, anime_id: anime.mal_id, anime_data: anime }, { onConflict: 'user_id,anime_id' });
      return reportSyncResult(query);
    }).catch(() => setSyncError(SYNC_FAILURE));
  }, [reportSyncResult]);

  const removeHistory = useCallback((id: string) => {
    const current = loadHistory();
    const removed = current.find((item) => item.id === id);
    const next = current.filter((item) => item.id !== id);
    saveHistory(next);
    setHistory(next);
    const user = userIdRef.current;
    if (user && removed) void getSupabase().then((client) => {
      if (!client) return;
      return reportSyncResult(client.from('watch_history').delete().eq('user_id', user).eq('id', syncHistoryId(user, removed.anime.mal_id, removed.episodeNumber)));
    }).catch(() => setSyncError(SYNC_FAILURE));
  }, [reportSyncResult]);

  const recordProgress = useCallback((anime: AnimeSummary, episodeNumber: number | null, episodeTitle: string | null, positionSeconds: number, durationSeconds: number) => {
    const item: WatchProgress = {
      id: historyId(anime.mal_id, episodeNumber),
      anime,
      episodeNumber,
      episodeTitle,
      positionSeconds: Math.max(0, Math.floor(positionSeconds)),
      durationSeconds: Math.max(0, Math.floor(durationSeconds)),
      updatedAt: new Date().toISOString()
    };
    const next = [item, ...loadHistory().filter((old) => old.id !== item.id)].slice(0, 80);
    saveHistory(next);
    setHistory(next);
    const user = userIdRef.current;
    if (user) void getSupabase().then((client) => {
      if (!client) return;
      return reportSyncResult(client.from('watch_history').upsert({
        id: syncHistoryId(user, anime.mal_id, episodeNumber),
        user_id: user,
        anime_id: anime.mal_id,
        anime_data: anime,
        episode_number: episodeNumber,
        episode_title: episodeTitle,
        playback_position_seconds: item.positionSeconds,
        duration_seconds: item.durationSeconds,
        updated_at: item.updatedAt
      }));
    }).catch(() => setSyncError(SYNC_FAILURE));
  }, [reportSyncResult]);

  const value = useMemo(() => ({
    favorites,
    history,
    userId,
    syncConfigured: supabaseConfigured,
    syncError,
    toggleFavorite,
    removeHistory,
    recordProgress
  }), [favorites, history, userId, syncError, toggleFavorite, removeHistory, recordProgress]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary precisa estar dentro de LibraryProvider.');
  return context;
}
