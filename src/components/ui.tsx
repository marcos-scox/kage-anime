import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowUpRight, Bookmark, CircleAlert, LoaderCircle, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AnimeSummary } from '../types/anime';

export function BrandMark({ className = '' }: { className?: string }) {
  return <img className={`brand-mark ${className}`} src="/kage-mark.svg" alt="" aria-hidden="true" />;
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'subtle' }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function IconButton({ children, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Poster({ anime, className = '' }: { anime: AnimeSummary; className?: string }) {
  const [failed, setFailed] = useState(false);
  const image = anime.images.webp?.large_image_url || anime.images.webp?.image_url || anime.images.jpg?.large_image_url || anime.images.jpg?.image_url;
  return <div className={`poster ${className}`}>
    {image && !failed
      ? <img src={image} alt={`Capa de ${anime.title}`} loading="lazy" onError={() => setFailed(true)} />
      : <div className="poster__fallback" aria-label="Capa indisponível"><BrandMark /></div>}
    <div className="poster__shade" />
  </div>;
}

export function AnimeCard({ anime, compact = false, progress }: { anime: AnimeSummary; compact?: boolean; progress?: number }) {
  const title = anime.title_english || anime.title;
  return <Link className={`anime-card ${compact ? 'anime-card--compact' : ''}`} to={`/anime/${anime.mal_id}`} aria-label={`Ver detalhes de ${title}`}>
    <Poster anime={anime} />
    {typeof progress === 'number' && <div className="anime-card__progress"><span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>}
    <div className="anime-card__meta">
      <span className="anime-card__title">{title}</span>
      <span className="anime-card__subline">
        {anime.type && <span>{anime.type}</span>}
        {anime.year && <span>{anime.year}</span>}
        {typeof anime.score === 'number' && <span className="anime-card__score"><Star size={12} fill="currentColor" /> {anime.score.toFixed(1)}</span>}
      </span>
    </div>
  </Link>;
}

export function SectionHeading({ title, eyebrow, action, to }: { title: string; eyebrow?: string; action?: string; to?: string }) {
  return <div className="section-heading">
    <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
    {action && to && <Link className="text-link" to={to}>{action}<ArrowUpRight size={15} /></Link>}
  </div>;
}

export function AnimeCarousel({ title, eyebrow, items, loading, error, empty, linkTo, onRetry }: { title: string; eyebrow?: string; items: AnimeSummary[]; loading?: boolean; error?: string; empty?: string; linkTo?: string; onRetry?: () => void }) {
  return <section className="catalog-section">
    <SectionHeading title={title} eyebrow={eyebrow} action={linkTo ? 'Ver tudo' : undefined} to={linkTo} />
    {loading ? <div className="poster-row" aria-label="Carregando capas">{Array.from({ length: 5 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-card__poster shimmer" /><div className="skeleton-card__line shimmer" /></div>)}</div>
      : error ? <StatePanel icon={<CircleAlert size={19} />} title="Não foi possível carregar esta seção" detail={error} action={onRetry ? <Button variant="subtle" onClick={onRetry}>Tentar novamente</Button> : undefined} />
      : items.length ? <div className="poster-row">{items.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}</div>
      : <StatePanel icon={<Bookmark size={19} />} title={empty || 'Nenhum título disponível'} detail="Tente novamente quando houver conexão." />}
  </section>;
}

export function StatePanel({ icon, title, detail, action }: { icon?: ReactNode; title: string; detail?: string; action?: ReactNode }) {
  return <div className="state-panel">{icon && <span className="state-panel__icon">{icon}</span>}<div><strong>{title}</strong>{detail && <p>{detail}</p>}{action}</div></div>;
}

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}

export function AnimeGrid({ items, empty, onMore, hasMore, loadingMore }: { items: AnimeSummary[]; empty: ReactNode; onMore?: () => void; hasMore?: boolean; loadingMore?: boolean }) {
  if (!items.length) return <>{empty}</>;
  return <>
    <div className="anime-grid">{items.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} compact />)}</div>
    {hasMore && onMore && <div className="load-more"><Button variant="subtle" onClick={onMore} disabled={loadingMore}>{loadingMore ? <><LoaderCircle className="spin" size={16} /> Carregando</> : 'Carregar mais'}</Button></div>}
  </>;
}

export function PlayerPreview({ title, onClick }: { title: string; onClick?: () => void }) {
  return <div className="player-preview" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} aria-label={title}>
    <div className="player-preview__orb"><Play size={23} fill="currentColor" /></div>
    <span>{title}</span>
  </div>;
}
