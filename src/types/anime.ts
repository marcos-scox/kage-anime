export interface AnimeImageSet {
  jpg?: { image_url?: string | null; small_image_url?: string | null; large_image_url?: string | null };
  webp?: { image_url?: string | null; small_image_url?: string | null; large_image_url?: string | null };
}

export interface AnimeGenre {
  mal_id: number;
  name: string;
  type?: string;
  url?: string;
}

export interface AnimeStreamingLink {
  name: string;
  url: string;
}

export interface AnimeSummary {
  mal_id: number;
  url: string;
  images: AnimeImageSet;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: { from?: string | null; to?: string | null; string?: string | null };
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  synopsis?: string | null;
  season?: string | null;
  year?: number | null;
  genres?: AnimeGenre[];
  themes?: AnimeGenre[];
  demographics?: AnimeGenre[];
  streaming?: AnimeStreamingLink[];
}

export interface AnimeEpisode {
  mal_id: number;
  url?: string | null;
  title?: string | null;
  title_japanese?: string | null;
  title_romanji?: string | null;
  aired?: string | null;
  score?: number | null;
  filler?: boolean;
  recap?: boolean;
}

export interface PaginationInfo {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items?: { count: number; total: number; per_page: number };
}

export interface PageResult<T> {
  data: T[];
  pagination?: PaginationInfo;
}

export interface WatchProgress {
  id: string;
  anime: AnimeSummary;
  episodeNumber: number | null;
  episodeTitle: string | null;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
}
