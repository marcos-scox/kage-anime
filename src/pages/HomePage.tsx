import { useEffect, useState } from 'react';
import { ArrowRight, BookmarkPlus, CircleAlert, Compass, Wifi, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimeCarousel, Button, SectionHeading, StatePanel } from '../components/ui';
import { getAiring, getCurrentSeason, getPopular } from '../features/catalog/jikan';
import { useLibrary } from '../features/library/LibraryContext';
import type { AnimeSummary } from '../types/anime';

type Section = { items: AnimeSummary[]; loading: boolean; error?: string };
const blank = (): Section => ({ items: [], loading: true });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Tente novamente em instantes.';

export function HomePage() {
  const [popular, setPopular] = useState<Section>(blank);
  const [airing, setAiring] = useState<Section>(blank);
  const [season, setSeason] = useState<Section>(blank);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [retry, setRetry] = useState(0);
  const { favorites, history } = useLibrary();
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPopular(blank()); setAiring(blank()); setSeason(blank());
    const loadSection = async (load: (signal: AbortSignal) => Promise<{ data: AnimeSummary[] }>, setter: (value: Section) => void) => {
      try {
        const result = await load(controller.signal);
        if (active) setter({ items: result.data, loading: false });
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return;
        setter({ items: [], loading: false, error: errorMessage(error) });
      }
    };
    void loadSection((signal) => getPopular(1, signal), setPopular);
    void loadSection((signal) => getAiring(1, signal), setAiring);
    void loadSection((signal) => getCurrentSeason(1, signal), setSeason);
    return () => { active = false; controller.abort(); };
  }, [retry]);

  const hero = season.items[0] || airing.items[0] || popular.items[0];
  const continueItems = history.filter((item, index, all) => all.findIndex((other) => other.anime.mal_id === item.anime.mal_id) === index).slice(0, 12);
  const retrySections = () => setRetry((value) => value + 1);
  const sections = [popular, airing, season];
  const firstError = sections.find((section) => section.error)?.error;
  const anyLoading = sections.some((section) => section.loading);

  return <div className="page home-page">
    <div className="home-welcome">
      <p>Descubra sua próxima história, <strong>sem perder o fio da anterior.</strong></p>
      <div className="home-welcome__actions"><span className="offline-note">{offline ? <><WifiOff size={14} /> Offline</> : firstError ? <><WifiOff size={14} /> Catálogo indisponível</> : <><Wifi size={14} /> Conexão disponível</>}</span><Link className="text-link" to="/minha-lista"><BookmarkPlus size={14} /> Minha lista</Link></div>
    </div>

    {hero ? <section className="hero" aria-label="Destaque do catálogo">
      {(hero.images.webp?.large_image_url || hero.images.jpg?.large_image_url || hero.images.webp?.image_url || hero.images.jpg?.image_url) && <img className="hero__image" src={hero.images.webp?.large_image_url || hero.images.jpg?.large_image_url || hero.images.webp?.image_url || hero.images.jpg?.image_url || ''} alt="" />}
      <div className="hero__overlay" /><div className="hero__content">
        <span className="hero__tag">KAGE · EM DESTAQUE</span><h1>{hero.title_english || hero.title}</h1>
        <div className="hero__meta">{hero.type && <span>{hero.type}</span>}{hero.year && <span>{hero.year}</span>}{typeof hero.score === 'number' && <span>Nota {hero.score.toFixed(1)}</span>}</div>
        <p className="hero__synopsis">{hero.synopsis || 'Consulte os detalhes e as informações disponíveis neste catálogo.'}</p>
        <div className="hero__actions"><Button onClick={() => navigate(`/anime/${hero.mal_id}`)}>Ver detalhes <ArrowRight size={15} /></Button><Button variant="ghost" onClick={() => navigate('/explorar')}><Compass size={15} /> Explorar</Button></div>
      </div>
    </section> : <section className="hero hero--empty"><div className="hero__overlay" /><div className="hero__content"><span className="hero__tag">KAGE · CATÁLOGO</span><h1>Histórias à sua maneira.</h1><p className="hero__synopsis">{offline ? 'Sem conexão. Sua lista e o conteúdo previamente salvo continuam neste dispositivo.' : firstError ? 'A API do catálogo não respondeu. Os títulos salvos continuam disponíveis.' : anyLoading ? 'Buscando títulos e imagens reais…' : 'Nenhum destaque está disponível agora.'}</p>{(offline || firstError || !anyLoading) && <Button onClick={retrySections}><Wifi size={15} /> Tentar novamente</Button>}{!offline && !firstError && anyLoading && <span className="loading-state">Buscando títulos…</span>}</div></section>}

    {offline && <StatePanel icon={<WifiOff size={18} />} title="Você está sem conexão" detail="Títulos vistos anteriormente e seus favoritos continuam guardados neste dispositivo. Buscas novas precisam de internet." />}
    <AnimeCarousel title="Animes populares" eyebrow="SELEÇÃO DO CATÁLOGO" items={popular.items} loading={popular.loading} error={popular.error} onRetry={retrySections} empty="Ainda não há títulos em cache." />
    <AnimeCarousel title="Em alta" eyebrow="EM EXIBIÇÃO" items={airing.items} loading={airing.loading} error={airing.error} onRetry={retrySections} empty="Ainda não há títulos em cache." />
    <AnimeCarousel title="Lançamentos" eyebrow="TEMPORADA ATUAL" items={season.items} loading={season.loading} error={season.error} onRetry={retrySections} empty="Ainda não há títulos em cache." linkTo="/explorar" />

    {continueItems.length > 0 && <section className="catalog-section"><SectionHeading title="Continue assistindo" eyebrow="SUA ATIVIDADE" action="Ver histórico" to="/historico" /><div className="poster-row">{continueItems.map((item) => <Link className="anime-card" key={item.id} to={`/assistir/${item.anime.mal_id}/${item.episodeNumber ?? 1}`} aria-label={`Retomar ${item.anime.title}`}>
      <div className="poster">{(item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url) && <img src={item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url || ''} alt={`Capa de ${item.anime.title}`} loading="lazy" />}<div className="poster__shade" /><div className="poster__play"><ArrowRight size={18} /></div></div>
      <div className="anime-card__meta"><span className="anime-card__title">{item.anime.title_english || item.anime.title}</span><span className="anime-card__subline">{item.episodeNumber ? `Episódio ${item.episodeNumber}` : 'Retomar'}</span></div><div className="anime-card__progress"><span style={{ width: `${item.durationSeconds ? Math.min(100, item.positionSeconds / item.durationSeconds * 100) : 0}%` }} /></div>
    </Link>)}</div></section>}
    {favorites.length > 0 && <AnimeCarousel title="Minha lista" eyebrow="SALVOS POR VOCÊ" items={favorites} linkTo="/minha-lista" />}
    {!hero && !anyLoading && !firstError && <StatePanel icon={<CircleAlert size={18} />} title="O catálogo ainda não retornou títulos" detail="Confira a conexão ou tente novamente." action={<Button variant="subtle" onClick={retrySections}>Tentar novamente</Button>} />}
  </div>;
}
