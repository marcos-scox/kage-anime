import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LibraryProvider } from '../features/library/LibraryContext';
import { RootBoundary } from '../components/RootBoundary';
import { LoadingState } from '../components/ui';

const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })));
const ExplorePage = lazy(() => import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const HistoryPage = lazy(() => import('../pages/HistoryPage').then((module) => ({ default: module.HistoryPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const AnimeDetailPage = lazy(() => import('../pages/AnimeDetailPage').then((module) => ({ default: module.AnimeDetailPage })));
const PlayerPage = lazy(() => import('../pages/PlayerPage').then((module) => ({ default: module.PlayerPage })));

export function App() {
  return <RootBoundary><LibraryProvider><Suspense fallback={<div className="page"><LoadingState label="Abrindo tela…" /></div>}><Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} />
      <Route path="explorar" element={<ExplorePage />} />
      <Route path="minha-lista" element={<FavoritesPage />} />
      <Route path="historico" element={<HistoryPage />} />
      <Route path="perfil" element={<ProfilePage />} />
      <Route path="anime/:id" element={<AnimeDetailPage />} />
      <Route path="assistir/:animeId/:episode" element={<PlayerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></Suspense></LibraryProvider></RootBoundary>;
}
