import type { AnimeEpisode, AnimeGenre, AnimeSummary, PageResult, PaginationInfo } from '../../types/anime';
import { readCache, writeCache } from './cache';

const API = import.meta.env.VITE_JIKAN_BASE_URL || 'https://api.jikan.moe/v4';
const CACHE_TTL = 60 * 60 * 1000;
const MIN_GAP_MS = 380;
const REQUEST_TIMEOUT_MS = 7000;
let queue: Promise<void> = Promise.resolve();
let lastStartedAt = 0;

export class CatalogError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'CatalogError';
  }
}

interface JikanEnvelope<T> {
  data: T;
  pagination?: PaginationInfo;
  messages?: { error?: string };
}

function request<T>(path: string, signal?: AbortSignal): Promise<JikanEnvelope<T>> {
  const key = path.replace(/^\//, '');
  const cached = readCache<JikanEnvelope<T>>(key);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) return Promise.resolve(cached.data);
  if (!navigator.onLine) return cached ? Promise.resolve(cached.data) : Promise.reject(new CatalogError('Sem conexão. Metadados salvos aparecem quando disponíveis; novas buscas precisam de internet.'));

  const slot = queue.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastStartedAt));
    if (wait) await new Promise<void>((resolve) => window.setTimeout(resolve, wait));
    if (signal?.aborted) throw new DOMException('A busca foi cancelada.', 'AbortError');
    lastStartedAt = Date.now();
  });
  queue = slot.then(() => undefined, () => undefined);

  return slot.then(async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const response = await fetch(`${API}/${key}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const message = response.status === 429
          ? 'A Jikan pediu uma pausa nas consultas. Tente novamente em instantes.'
          : `Não foi possível carregar o catálogo (HTTP ${response.status}).`;
        throw new CatalogError(message, response.status);
      }
      const data = (await response.json()) as JikanEnvelope<T>;
      writeCache(key, data);
      return data;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('A busca foi cancelada.', 'AbortError');
      if (cached) return cached.data;
      if (error instanceof CatalogError) throw error;
      throw new CatalogError('Não foi possível conectar à Jikan. Confira sua conexão e tente novamente.');
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  });
}

function page<T>(result: JikanEnvelope<T[]>): PageResult<T> {
  return { data: result.data, pagination: result.pagination };
}

export async function getPopular(pageNumber = 1, signal?: AbortSignal): Promise<PageResult<AnimeSummary>> {
  return page(await request<AnimeSummary[]>(`top/anime?filter=bypopularity&limit=24&page=${pageNumber}`, signal));
}

export async function getAiring(pageNumber = 1, signal?: AbortSignal): Promise<PageResult<AnimeSummary>> {
  return page(await request<AnimeSummary[]>(`top/anime?filter=airing&limit=24&page=${pageNumber}`, signal));
}

export async function getCurrentSeason(pageNumber = 1, signal?: AbortSignal): Promise<PageResult<AnimeSummary>> {
  return page(await request<AnimeSummary[]>(`seasons/now?limit=24&page=${pageNumber}`, signal));
}

export interface SearchFilters {
  query: string;
  genreId?: number;
  year?: number;
  season?: 'winter' | 'spring' | 'summer' | 'fall' | '';
  status?: 'airing' | 'complete' | 'upcoming' | '';
  order: 'popularity' | 'score';
  page: number;
}

export async function searchAnime(filters: SearchFilters, signal?: AbortSignal): Promise<PageResult<AnimeSummary>> {
  const query = new URLSearchParams({ limit: '24', page: String(filters.page), sfw: 'true' });
  if (filters.query.trim()) query.set('q', filters.query.trim());
  if (filters.genreId) query.set('genres', String(filters.genreId));
  if (filters.status) query.set('status', filters.status);
  query.set('order_by', filters.order === 'popularity' ? 'popularity' : 'score');
  query.set('sort', 'desc');

  if (filters.season) {
    const year = filters.year || new Date().getFullYear();
    const result = await request<AnimeSummary[]>(`seasons/${year}/${filters.season}?limit=24&page=${filters.page}`, signal);
    const narrowed = result.data.filter((anime) => {
      const queryMatch = !filters.query.trim() || `${anime.title} ${anime.title_english ?? ''}`.toLowerCase().includes(filters.query.trim().toLowerCase());
      const genreMatch = !filters.genreId || anime.genres?.some((genre) => genre.mal_id === filters.genreId);
      const statusMatch = !filters.status || anime.status?.toLowerCase().includes(filters.status === 'airing' ? 'airing' : filters.status === 'complete' ? 'finished' : 'not yet aired');
      return queryMatch && genreMatch && statusMatch;
    });
    narrowed.sort((a, b) => filters.order === 'score'
      ? (b.score ?? 0) - (a.score ?? 0)
      : (b.members ?? 0) - (a.members ?? 0));
    return { data: narrowed, pagination: result.pagination };
  }

  if (filters.year) {
    query.set('start_date', `${filters.year}-01-01`);
    query.set('end_date', `${filters.year}-12-31`);
  }
  return page(await request<AnimeSummary[]>(`anime?${query.toString()}`, signal));
}

export async function getAnime(id: number, signal?: AbortSignal): Promise<AnimeSummary> {
  const result = await request<AnimeSummary>(`anime/${id}/full`, signal);
  return result.data;
}

export async function getAnimeEpisodes(id: number, pageNumber = 1, signal?: AbortSignal): Promise<PageResult<AnimeEpisode>> {
  return page(await request<AnimeEpisode[]>(`anime/${id}/episodes?limit=100&page=${pageNumber}`, signal));
}

export async function getGenres(signal?: AbortSignal): Promise<AnimeGenre[]> {
  const result = await request<AnimeGenre[]>('genres/anime', signal);
  return result.data;
}
