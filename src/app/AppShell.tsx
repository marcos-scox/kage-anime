import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Clock3, Compass, House, ListVideo, Search, UserRound } from 'lucide-react';
import { BrandMark } from '../components/ui';

const tabs = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/explorar', label: 'Explorar', icon: Compass },
  { to: '/minha-lista', label: 'Minha lista', icon: ListVideo },
  { to: '/historico', label: 'Histórico', icon: Clock3 },
  { to: '/perfil', label: 'Perfil', icon: UserRound }
];

export function AppShell() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/assistir/');
  return <div className={`app-shell ${isPlayer ? 'app-shell--player' : ''}`}>
    {!isPlayer && <header className="topbar">
      <NavLink to="/" className="brand-lockup" aria-label="KAGE ANIME — início"><BrandMark /><span><strong>KAGE</strong><small>ANIME</small></span></NavLink>
      <div className="topbar__actions">
        <NavLink to="/explorar" className="topbar-search"><Search size={17} /><span>Buscar anime</span><kbd>/</kbd></NavLink>
        <NavLink to="/perfil" className="icon-button" aria-label="Abrir perfil" title="Abrir perfil"><UserRound size={19} /></NavLink>
      </div>
    </header>}
    <main className={`main-content ${isPlayer ? 'main-content--player' : ''}`}><Outlet /></main>
    {!isPlayer && <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
        <Icon size={20} strokeWidth={1.8} /><span>{label}</span>
      </NavLink>)}
    </nav>}
  </div>;
}
