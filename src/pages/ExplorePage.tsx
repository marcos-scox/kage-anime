import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, SlidersHorizontal, X, WifiOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AnimeGrid, Button, LoadingState, StatePanel } from '../components/ui';
import { getGenres, getPopular, searchAnime, type SearchFilters } from '../features/catalog/jikan';
import type { AnimeGenre, AnimeSummary, PageResult } from '../types/anime';

const currentYear = new Date().getFullYear();

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [genreId, setGenreId] = useState('');
  const [year, setYear] = useState('');
  const [season, setSeason] = useState<SearchFilters['season']>('');
  const [status, setStatus] = useState<SearchFilters['status']>('');
  const [order, setOrder] = useState<SearchFilters['order']>('popularity');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AnimeSummary[]>([]);
  const [genres, setGenres] = useState<AnimeGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const [offline, setOffline] = useState(!navigator.onLine);
  const hasFilters = Boolean(query.trim() || genreId || year || season || status);
  const yearOptions = useMemo(() => Array.from({ length: 40 }, (_, index) => currentYear - index), []);

  useEffect(() => { const update = () => setOffline(!navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  useEffect(() => { const controller = new AbortController(); void getGenres(controller.signal).then(setGenres).catch(() => undefined); return () => controller.abort(); }, []);
  useEffect(() => { setQuery(params.get('q') || ''); }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(page === 1); setLoadingMore(page > 1); setError('');
      try {
        const result: PageResult<AnimeSummary> = hasFilters
          ? await searchAnime({ query, genreId: genreId ? Number(genreId) : undefined, year: year ? Number(year) : undefined, season, status, order, page }, controller.signal)
          : await getPopular(page, controller.signal);
        if (controller.signal.aborted) return;
        setItems((current) => {
          if (page === 1) return result.data;
          const merged = new Map(current.map((item) => [item.mal_id, item]));
          for (const item of result.data) merged.set(item.mal_id, item);
          return [...merged.values()];
        });
        setHasMore(Boolean(result.pagination?.has_next_page));
      } catch (cause) {
        if (controller.signal.aborted || (cause instanceof DOMException && cause.name === 'AbortError')) return;
        setError(cause instanceof Error ? cause.message : 'Não foi possível buscar títulos.');
        if (page === 1) setItems([]);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); }
      }
    }, page === 1 ? 360 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, genreId, year, season, status, order, page, retry, hasFilters]);

  const clearFilters = () => { setQuery(''); setGenreId(''); setYear(''); setSeason(''); setStatus(''); setOrder('popularity'); setPage(1); setParams({}); };
  const onSubmit = (event: FormEvent) => { event.preventDefault(); setPage(1); setParams(query.trim() ? { q: query.trim() } : {}); };
  const changeFilter = (setter: (value: never) => void, value: string) => { setter(value as never); setPage(1); };

  return <div className="page">
    <div className="page-header"><div><span className="eyebrow">CATÁLOGO TENRAI</span><h1>Explorar</h1><p>Encontre um título pelo nome ou refine a seleção.</p></div></div>
    {offline && <StatePanel icon={<WifiOff size={18} />} title="Busca precisa de internet" detail="Mostramos apenas resultados que já foram salvos neste dispositivo." />}
    <section className="search-panel" aria-label="Pesquisa e filtros">
      <form className="search-form" onSubmit={onSubmit}>
        <label className="search-field"><Search size={18} /><input aria-label="Pesquisar anime por título" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Pesquisar por título…" autoComplete="off" /></label>
        <Button type="submit"><Search size={15} /><span className="search-submit-label">Buscar</span></Button>
      </form>
      <div className="filter-row">
        <label><span className="sr-only">Gênero</span><select className="filter-select" value={genreId} onChange={(event) => changeFilter(setGenreId as (value: never) => void, event.target.value)}><option value="">Todos os gêneros</option>{genres.map((genre) => <option key={genre.mal_id} value={genre.mal_id}>{genre.name}</option>)}</select></label>
        <label><span className="sr-only">Ano</span><select className="filter-select" value={year} onChange={(event) => changeFilter(setYear as (value: never) => void, event.target.value)}><option value="">Qualquer ano</option>{yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span className="sr-only">Temporada</span><select className="filter-select" value={season} onChange={(event) => changeFilter(setSeason as (value: never) => void, event.target.value)}><option value="">Qualquer temporada</option><option value="winter">Inverno</option><option value="spring">Primavera</option><option value="summer">Verão</option><option value="fall">Outono</option></select></label>
        <label><span className="sr-only">Status</span><select className="filter-select" value={status} onChange={(event) => changeFilter(setStatus as (value: never) => void, event.target.value)}><option value="">Qualquer status</option><option value="airing">Em exibição</option><option value="complete">Concluído</option><option value="upcoming">Em breve</option></select></label>
      </div>
    </section>

    <div className="results-topline"><span>{loading ? 'Consultando catálogo…' : `${items.length} ${items.length === 1 ? 'título' : 'títulos'} nesta página`}</span><span className="sort-control"><SlidersHorizontal size={14} /><label htmlFor="sort-results">Ordenar</label><select id="sort-results" value={order} onChange={(event) => { setOrder(event.target.value as SearchFilters['order']); setPage(1); }}><option value="popularity">Popularidade</option><option value="score">Avaliação</option></select></span></div>

    {loading && page === 1 ? <LoadingState label="Buscando no catálogo…" />
      : error ? <StatePanel icon={<WifiOff size={18} />} title="A pesquisa não foi concluída" detail={error} action={<Button variant="subtle" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</Button>} />
      : <AnimeGrid items={items} hasMore={hasMore} loadingMore={loadingMore} onMore={() => setPage((value) => value + 1)} empty={<div className="empty-state"><span className="empty-state__icon"><Search size={22} /></span><h2>{offline ? 'Sem resultados salvos' : 'Nenhum título encontrado'}</h2><p>{offline ? 'Conecte-se à internet para fazer uma nova busca.' : 'Experimente outro título ou remova algum filtro.'}</p>{(query || genreId || year || season || status) && <Button variant="subtle" onClick={clearFilters}><X size={15} /> Limpar filtros</Button>}</div>} />}
  </div>;
}
