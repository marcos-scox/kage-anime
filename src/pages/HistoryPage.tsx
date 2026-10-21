import { Clock3, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IconButton, Poster } from '../components/ui';
import { useLibrary } from '../features/library/LibraryContext';

function timeLabel(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function HistoryPage() {
  const { history, removeHistory } = useLibrary();
  return <div className="page">
    <div className="page-header"><div><span className="eyebrow">SUA ATIVIDADE</span><h1>Histórico</h1><p>Progresso guardado para continuar neste dispositivo.</p></div></div>
    {history.length ? <div className="history-list">{history.map((item) => {
      const progress = item.durationSeconds ? Math.min(100, item.positionSeconds / item.durationSeconds * 100) : 0;
      return <article className="history-card" key={item.id}>
        <Link to={`/anime/${item.anime.mal_id}`} aria-label={`Detalhes de ${item.anime.title}`}><Poster anime={item.anime} /></Link>
        <div className="history-card__copy"><Link to={`/anime/${item.anime.mal_id}`} className="history-card__title">{item.anime.title_english || item.anime.title}</Link><div className="history-card__sub">{item.episodeNumber ? `Episódio ${item.episodeNumber}` : 'Episódio sem numeração'}{item.episodeTitle ? ` · ${item.episodeTitle}` : ''}</div><div className="history-card__sub">{timeLabel(item.positionSeconds)}{item.durationSeconds ? ` de ${timeLabel(item.durationSeconds)}` : ''} · {Math.round(progress)}%</div><div className="history-card__progress"><span style={{ width: `${progress}%` }} /></div></div>
        <div className="history-card__actions"><Link className="icon-button" to={`/assistir/${item.anime.mal_id}/${item.episodeNumber ?? 1}`} aria-label={`Retomar ${item.anime.title}`}><Play size={16} /></Link><IconButton label="Remover do histórico" onClick={() => removeHistory(item.id)}><Trash2 size={16} /></IconButton></div>
      </article>;
    })}</div> : <div className="empty-state"><span className="empty-state__icon"><Clock3 size={22} /></span><h2>Nenhum progresso salvo</h2><p>Quando uma fonte autorizada registrar reprodução, o progresso aparecerá aqui.</p><Link className="button button--primary" to="/explorar">Explorar catálogo</Link></div>}
  </div>;
}
