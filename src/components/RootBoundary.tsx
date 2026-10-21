import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CircleAlert, RotateCcw } from 'lucide-react';

export class RootBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('KAGE ANIME render error', error, info.componentStack); }
  render() {
    if (this.state.error) return <main className="page" style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}><div className="empty-state"><span className="empty-state__icon"><CircleAlert /></span><h1>Esta tela encontrou um problema</h1><p>Seu histórico e sua lista locais continuam salvos. Tente abrir a tela novamente.</p><button className="button button--primary" onClick={() => window.location.reload()}><RotateCcw size={15} /> Tentar novamente</button></div></main>;
    return this.props.children;
  }
}
