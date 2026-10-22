import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarDays, CircleAlert, Clapperboard, ExternalLink, Play, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState, Poster, StatePanel } from '../components/ui';
import { getAnime, getAnimeEpisodes } from '../features/catalog/jikan';
import { getMyAnimeListPage, getVerifiedStreamingLinks } from '../features/catalog/officialStreaming';
import { useLibrary } from '../features/library/LibraryContext';
import { isSafePlaybackSource, resolveAuthorizedPlaybackSource } from '../features/playback/sources';
import type { AnimeEpisode, AnimeSummary, PageResult } from '../types/anime';

function yearAndSeason(anime: AnimeSummary) {
  const pieces = [anime.year, anime.season].filter(Boolean);
  return pieces.length ? pieces.join(' · ') : null;
}

export function AnimeDetailPage() {
  const { id } = useParams();
  const animeId = Number(id);
  const [anime, setAnime] = useState<AnimeSummary | null>(null);
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [episodePage, setEpisodePage] = useState(1);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(false);
  const [loadingMoreEpisodes, setLoadingMoreEpisodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [episodeError, setEpisodeError] = useState('');
  const [error, setError] = useState('');
  const moreController = useRef<AbortController | null>(null);
  const { favorites, toggleFavorite } = useLibrary();
  const navigate = useNavigate();
  const isFavorite = favorites.some((item) => item.mal_id === animeId);

  useEffect(() => {
    if (!Number.isInteger(animeId) || animeId <= 0) { setError('Este identificador de anime não é válido.'); setLoading(false); return; }
    const controller = new AbortController();
    moreController.current?.abort();
    setLoading(true); setError(''); setEpisodeError(''); setEpisodes([]); setEpisodePage(1); setHasMoreEpisodes(false);
    void Promise.all([getAnime(animeId, controller.signal), getAnimeEpisodes(animeId, 1, controller.signal).catch((reason): PageResult<AnimeEpisode> => { setEpisodeError(reason instanceof Error ? reason.message : 'Episódios indisponíveis.'); return { data: [] }; })])
      .then(([details, result]) => { if (!controller.signal.aborted) { setAnime(details); setEpisodes(result.data); setHasMoreEpisodes(Boolean(result.pagination?.has_next_page)); } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os detalhes.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); moreController.current?.abort(); };
  }, [animeId]);

  const loadMoreEpisodes = async () => {
    if (!anime || !hasMoreEpisodes || loadingMoreEpisodes) return;
    const controller = new AbortController();
    moreController.current?.abort(); moreController.current = controller;
    const nextPage = episodePage + 1;
    setLoadingMoreEpisodes(true); setEpisodeError('');
    try {
      const result = await getAnimeEpisodes(anime.mal_id, nextPage, controller.signal);
      if (controller.signal.aborted) return;
      setEpisodes((current) => {
        const merged = new Map(current.map((item) => [item.mal_id, item]));
        for (const item of result.data) merged.set(item.mal_id, item);
        return [...merged.values()];
      });
      setEpisodePage(nextPage); setHasMoreEpisodes(Boolean(result.pagination?.has_next_page));
    } catch (cause) {
      if (!controller.signal.aborted) setEpisodeError(cause instanceof Error ? cause.message : 'Não foi possível carregar mais episódios.');
    } finally {
      if (!controller.signal.aborted) setLoadingMoreEpisodes(false);
    }
  };

  if (loading) return <div className="page"><LoadingState label="Carregando detalhes…" /></div>;
  if (error || !anime) return <div className="page"><StatePanel icon={<CircleAlert size={18} />} title="Detalhes indisponíveis" detail={error || 'O catálogo Tenrai não retornou este título.'} action={<Button variant="subtle" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Voltar</Button>} /></div>;

  const cover = anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url || anime.images.webp?.image_url || anime.images.jpg?.image_url;
  const title = anime.title_english || anime.title;
  const streams = getVerifiedStreamingLinks(anime.streaming);
  const metadataPage = getMyAnimeListPage(anime.url);
  const playbackFor = (episode: AnimeEpisode) => {
    const source = resolveAuthorizedPlaybackSource(anime, episode);
    return source && isSafePlaybackSource(source) ? source : null;
  };
  const firstPlayableEpisode = episodes.find((episode) => playbackFor(episode));

  return <div className="page page--detail">
    <div className="detail-hero">
      {cover && <img className="detail-hero__backdrop" src={cover} alt="" />}
      <div className="detail-hero__shade" />
      <div className="detail-hero__content">
        <div className="detail-hero__poster-wrap"><Poster anime={anime} className="detail-hero__poster" /></div>
        <div className="detail-hero__copy">
          <span className="eyebrow">DETALHES DO TÍTULO</span><h1>{title}</h1>
          {anime.title_japanese && <div className="detail-original">{anime.title_japanese}</div>}
          <div className="detail-meta">{anime.type && <span><Clapperboard size={13} /> {anime.type}</span>}{typeof anime.score === 'number' && <span className="detail-rating"><Star size={13} fill="currentColor" /> {anime.score.toFixed(1)}{anime.scored_by ? ` · ${anime.scored_by.toLocaleString('pt-BR')} avaliações` : ''}</span>}{yearAndSeason(anime) && <span><CalendarDays size={13} /> {yearAndSeason(anime)}</span>}</div>
          <p className="detail-synopsis">{anime.synopsis || 'A sinopse não está disponível na fonte consultada.'}</p>
          <div className="detail-actions">{firstPlayableEpisode ? <Button onClick={() => navigate(`/assistir/${anime.mal_id}/${firstPlayableEpisode.mal_id}`)}><Play size={15} fill="currentColor" /> Assistir episódio</Button> : <span className="muted-copy">Sem fonte autorizada de reprodução integrada.</span>}<Button variant="ghost" onClick={() => toggleFavorite(anime)}>{isFavorite ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{isFavorite ? 'Na minha lista' : 'Adicionar à lista'}</Button></div>
        </div>
      </div>
    </div>

    <div className="detail-body"><div>
      <section className="detail-block"><h2>Gêneros</h2>{anime.genres?.length ? <div className="genre-list">{anime.genres.map((genre) => <span className="genre-chip" key={genre.mal_id}>{genre.name}</span>)}</div> : <p className="muted-copy">Gêneros não informados.</p>}</section>
      <section className="detail-block"><h2>Episódios {anime.episodes ? <span className="muted-inline">· {anime.episodes} no total</span> : ''}</h2>{episodes.length ? <><div className="episode-list">{episodes.map((episode) => {
        const source = playbackFor(episode);
        const row = <><span className="episode-row__number">{episode.mal_id}</span><span className="episode-row__title">{episode.title || `Episódio ${episode.mal_id}`}</span><span className="episode-row__play">{source ? <Play size={15} /> : <span aria-label="Sem fonte autorizada">—</span>}</span></>;
        return source ? <Link className="episode-row" key={episode.mal_id} to={`/assistir/${anime.mal_id}/${episode.mal_id}`}>{row}</Link> : <div className="episode-row episode-row--unavailable" key={episode.mal_id} aria-disabled="true">{row}</div>;
      })}</div>{hasMoreEpisodes && <Button variant="subtle" disabled={loadingMoreEpisodes} onClick={() => void loadMoreEpisodes()}>{loadingMoreEpisodes ? 'Carregando…' : 'Carregar mais episódios'}</Button>}{episodeError && <p className="auth-message auth-message--error">{episodeError}</p>}</> : <StatePanel icon={<CircleAlert size={17} />} title="Episódios não fornecidos" detail={episodeError || 'A fonte de metadados não disponibilizou uma lista de episódios.'} />}</section>
      <section className="detail-block"><h2>Onde assistir</h2>{streams.length ? <><p className="muted-copy">Plataformas oficiais reconhecidas pelo catálogo. Confirme a disponibilidade do título, região e plano no próprio serviço.</p><div className="stream-list">{streams.map((item) => <a className="stream-link" key={`${item.name}-${item.href}`} href={item.href} target="_blank" rel="noopener noreferrer"><span>{item.name}</span><ExternalLink size={14} /></a>)}</div></> : <StatePanel icon={<CircleAlert size={17} />} title="Nenhuma plataforma verificável informada" detail="O catálogo não indicou uma plataforma reconhecida por domínio oficial. Não há fonte autorizada de vídeo integrada." />}</section>
    </div><aside className="detail-sidebar"><section className="detail-block"><h2>Informações</h2><div className="detail-facts">
      {[['Status', anime.status], ['Temporada', anime.season], ['Ano', anime.year], ['Episódios', anime.episodes], ['Duração', anime.duration], ['Classificação', anime.rating], ['Origem', anime.source]].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => <div className="detail-fact" key={String(label)}><span>{label}</span><span>{String(value)}</span></div>)}
      <div className="detail-fact"><span>Metadados</span>{metadataPage ? <a href={metadataPage} target="_blank" rel="noopener noreferrer">Ficha MyAnimeList ↗</a> : <span>Tenrai</span>}</div>
    </div></section></aside></div>
    <div className="detail-back"><Link className="text-link" to="/explorar"><ArrowLeft size={15} /> Voltar para explorar</Link></div>
  </div>;
}
