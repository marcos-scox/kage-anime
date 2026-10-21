import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleAlert, ExternalLink, Maximize, Play, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingState } from '../components/ui';
import { getAnime, getAnimeEpisodes } from '../features/catalog/jikan';
import { isSafePlaybackSource, resolveAuthorizedPlaybackSource } from '../features/playback/sources';
import { useLibrary } from '../features/library/LibraryContext';
import type { AnimeEpisode, AnimeSummary } from '../types/anime';

function safeUrl(value: string) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } }

export function PlayerPage() {
  const { animeId: rawAnimeId, episode: rawEpisode } = useParams();
  const animeId = Number(rawAnimeId); const episodeNumber = Number(rawEpisode);
  const [anime, setAnime] = useState<AnimeSummary | null>(null);
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const restoredKey = useRef('');
  const navigate = useNavigate();
  const { recordProgress, history } = useLibrary();

  useEffect(() => {
    if (!Number.isInteger(animeId) || animeId <= 0 || !Number.isInteger(episodeNumber) || episodeNumber <= 0) {
      setMessage('Este anime ou episódio não é válido.'); setLoading(false); return;
    }
    const controller = new AbortController();
    const episodesPage = Math.floor((episodeNumber - 1) / 100) + 1;
    setLoading(true); setMessage(''); setAnime(null); setEpisodes([]);
    void Promise.all([getAnime(animeId, controller.signal), getAnimeEpisodes(animeId, episodesPage, controller.signal).catch(() => ({ data: [] as AnimeEpisode[] }))])
      .then(([details, result]) => { if (!controller.signal.aborted) { setAnime(details); setEpisodes(result.data); } })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Não foi possível abrir este episódio.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [animeId, episodeNumber]);

  const episode = useMemo(() => episodes.find((item) => item.mal_id === episodeNumber) || null, [episodes, episodeNumber]);
  const source = anime ? resolveAuthorizedPlaybackSource(anime, episode) : null;
  const allowedSource = source && isSafePlaybackSource(source) ? source : null;
  const previousProgress = history.find((item) => item.anime.mal_id === animeId && item.episodeNumber === episodeNumber);
  const streams = anime?.streaming?.map((item) => ({ ...item, href: safeUrl(item.url) })).filter((item): item is typeof item & { href: string } => Boolean(item.href)) ?? [];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !allowedSource || !previousProgress || !episode) return;
    const key = `${animeId}:${episodeNumber}:${allowedSource.url}`;
    if (restoredKey.current === key) return;
    const restore = () => {
      if (restoredKey.current === key || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const target = Math.max(0, Math.min(previousProgress.positionSeconds, video.duration - 1));
      if (target > 0.5) video.currentTime = target;
      restoredKey.current = key;
    };
    video.addEventListener('loadedmetadata', restore);
    if (video.readyState >= 1) restore();
    return () => video.removeEventListener('loadedmetadata', restore);
  }, [animeId, episodeNumber, episode?.mal_id, allowedSource?.url, previousProgress?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !anime || !allowedSource) return;
    let cancelled = false;
    let hls: import('hls.js').default | null = null;
    lastSaved.current = 0;
    const save = () => {
      const now = Date.now();
      if (now - lastSaved.current < 12000 && !video.ended) return;
      lastSaved.current = now;
      recordProgress(anime, episodeNumber, episode?.title || null, video.currentTime, video.duration || 0);
    };
    const onVideoError = () => setMessage('A fonte autorizada está indisponível ou falhou durante a reprodução. Verifique a conexão e tente novamente.');
    video.addEventListener('timeupdate', save); video.addEventListener('pause', save); video.addEventListener('ended', save); video.addEventListener('error', onVideoError);
    const attach = async () => {
      if (!allowedSource.url.toLowerCase().includes('.m3u8')) { video.src = allowedSource.url; return; }
      if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = allowedSource.url; return; }
      const { default: Hls } = await import('hls.js');
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true }); hls.loadSource(allowedSource.url); hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setMessage('A transmissão autorizada encontrou um erro. Tente novamente mais tarde.'); });
      } else setMessage('Este dispositivo não oferece suporte ao formato da fonte autorizada.');
    };
    void attach().catch(() => setMessage('Não foi possível preparar a transmissão autorizada.'));
    return () => { cancelled = true; video.removeEventListener('timeupdate', save); video.removeEventListener('pause', save); video.removeEventListener('ended', save); video.removeEventListener('error', onVideoError); hls?.destroy(); video.removeAttribute('src'); video.load(); };
  }, [anime, episode, episodeNumber, allowedSource, recordProgress]);

  const goLandscape = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      await orientation.lock?.('landscape');
    } catch { /* Fullscreen/orientation may be controlled by Android. */ }
  };

  if (loading) return <div className="player-page"><LoadingState label="Preparando episódio…" /></div>;
  if (!anime) return <div className="player-page"><div className="player-info"><Link className="text-link" to="/explorar"><ArrowLeft size={15} /> Voltar ao catálogo</Link><div className="state-panel" style={{ marginTop: 25 }}><CircleAlert size={18} /><div><strong>Episódio indisponível</strong><p>{message || 'Não foi possível carregar os dados do anime.'}</p></div></div></div></div>;

  return <div className="player-page">
    <div className="player-top"><button className="player-top__back" onClick={() => navigate(-1)} aria-label="Voltar"><ArrowLeft size={18} /> <span>{anime.title_english || anime.title}</span></button><button className="icon-button" aria-label="Abrir tela cheia e orientação horizontal" onClick={() => void goLandscape()}><Maximize size={17} /></button></div>
    <section className="player-stage">{allowedSource ? <video ref={videoRef} controls playsInline autoPlay aria-label={`Reprodução de ${anime.title}`} /> : <div className="player-unavailable"><span className="player-unavailable__icon"><CircleAlert size={22} /></span><h1>Reprodução não disponível</h1><p>A Jikan fornece metadados, não direitos ou arquivos de transmissão. O KAGE ANIME só reproduz fontes próprias, licenciadas ou autorizadas; nenhuma fonte autorizada foi integrada para este episódio.</p>{message && <p>{message}</p>}{previousProgress && <p>Última posição salva: {Math.floor(previousProgress.positionSeconds / 60)}:{String(Math.floor(previousProgress.positionSeconds % 60)).padStart(2, '0')}{previousProgress.durationSeconds ? ` de ${Math.floor(previousProgress.durationSeconds / 60)}:${String(Math.floor(previousProgress.durationSeconds % 60)).padStart(2, '0')}` : ''}.</p>}</div>}</section>
    <div className="player-info"><span className="eyebrow">KAGE · PLAYER</span><h2>{episode?.title || `Episódio ${episodeNumber}`}</h2><p>{anime.title_english || anime.title}</p>
      {streams.length > 0 && <div className="stream-list">{streams.map((item) => <a className="stream-link" key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"><span>Onde assistir · {item.name}</span><ExternalLink size={14} /></a>)}</div>}
      {episodes.length > 0 && <section className="detail-block"><h2>Selecionar episódio</h2><div className="player-episode-list">{episodes.map((item) => <button key={item.mal_id} className={`player-episode-chip ${item.mal_id === episodeNumber ? 'is-active' : ''}`} onClick={() => navigate(`/assistir/${animeId}/${item.mal_id}`)}><strong>EP {item.mal_id} {item.mal_id === episodeNumber ? '· atual' : ''}</strong><span>{item.title || `Episódio ${item.mal_id}`}</span></button>)}</div></section>}
      <div className="detail-actions"><Link className="button button--ghost" to={`/anime/${animeId}`}><ArrowLeft size={14} /> Detalhes</Link>{episodeNumber > 1 && <Link className="button button--subtle" to={`/assistir/${animeId}/${episodeNumber - 1}`}><RotateCcw size={14} /> Episódio anterior</Link>}{anime.episodes && episodeNumber < anime.episodes && <Link className="button button--subtle" to={`/assistir/${animeId}/${episodeNumber + 1}`}><Play size={14} /> Próximo episódio</Link>}{!allowedSource && <Button variant="subtle" onClick={() => navigate(`/anime/${animeId}`)}>Voltar aos detalhes</Button>}</div>
    </div>
  </div>;
}
