import { Bookmark, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeGrid } from '../components/ui';
import { useLibrary } from '../features/library/LibraryContext';

export function FavoritesPage() {
  const { favorites } = useLibrary();
  return <div className="page">
    <div className="page-header"><div><span className="eyebrow">SALVOS POR VOCÊ</span><h1>Minha lista</h1><p>Seus animes favoritos guardados neste dispositivo.</p></div></div>
    <AnimeGrid items={favorites} empty={<div className="empty-state"><span className="empty-state__icon"><Bookmark size={22} /></span><h2>Sua lista ainda está vazia</h2><p>Abra os detalhes de um anime e salve os títulos que quiser reencontrar.</p><Link className="button button--primary" to="/explorar"><Compass size={15} /> Explorar animes</Link></div>} />
  </div>;
}
