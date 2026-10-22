import type { AnimeEpisode, AnimeSummary } from '../../types/anime';

export interface AuthorizedPlaybackSource {
  url: string;
  providerName: string;
  episodeNumber: number;
  confirmedAuthorized: true;
}

/**
 * Tenrai carries metadata, not video rights or playable URLs. No providers have
 * been configured for this project, so this adapter deliberately returns null.
 * Add a provider only when its owner has explicitly authorized embedding.
 */
export function resolveAuthorizedPlaybackSource(_anime: AnimeSummary, _episode: AnimeEpisode | null): AuthorizedPlaybackSource | null {
  return null;
}

export function isSafePlaybackSource(source: AuthorizedPlaybackSource): boolean {
  if (!source.confirmedAuthorized || !source.providerName.trim()) return false;
  try {
    const url = new URL(source.url);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
