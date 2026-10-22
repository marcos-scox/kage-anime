import { useEffect, useState, type FormEvent } from 'react';
import { Cloud, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '../components/ui';
import { getSupabase, supabaseConfigured } from '../features/auth/supabase';
import { useLibrary } from '../features/library/LibraryContext';

export function ProfilePage() {
  const { favorites, history, userId, syncError } = useLibrary();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured || !userId) return;
    void getSupabase().then(async (client) => {
      if (!client) return;
      const displayName = email.split('@')[0] || 'Kage';
      const { error: profileError } = await client.from('profiles').upsert({ id: userId, display_name: displayName }, { onConflict: 'id' });
      if (profileError) setError('Não foi possível atualizar o perfil. A lista local continua disponível.');
    }).catch(() => setError('Não foi possível acessar o perfil Supabase. A lista local continua disponível.'));
  }, [userId, email]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const client = await getSupabase();
      if (!client) { setError('O Supabase ainda não está configurado.'); return; }
      const result = mode === 'login' ? await client.auth.signInWithPassword({ email, password }) : await client.auth.signUp({ email, password });
      if (result.error) { setError(result.error.message); return; }
      setMessage(mode === 'signup' && !result.data.session ? 'Confira seu e-mail para confirmar a conta. Sua lista local continua disponível.' : 'Sessão iniciada. Seus itens pessoais serão sincronizados conforme as políticas do Supabase.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível acessar o Supabase.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      const client = await getSupabase();
      if (!client) return;
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) setError(signOutError.message);
      else setMessage('Sessão encerrada. Favoritos e histórico locais permanecem neste dispositivo.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível encerrar a sessão.');
    }
  };

  return <div className="page">
    <div className="page-header"><div><span className="eyebrow">PREFERÊNCIAS</span><h1>Perfil</h1><p>O catálogo funciona sem conta. A conta é usada apenas para sincronização.</p></div></div>
    <section className="profile-card">
      <span className="state-panel__icon"><UserRound size={19} /></span>
      <h2>{userId ? 'Sincronização conectada' : 'Sua experiência KAGE'}</h2>
      <p>{userId ? 'A sessão está ativa neste dispositivo. Dados pessoais são limitados pelas políticas RLS configuradas no seu projeto.' : 'Sua lista e seu histórico ficam salvos localmente. Conecte Supabase se quiser sincronizar entre dispositivos.'}</p>
      <div className="profile-stats">
        <div className="profile-stat"><strong>{favorites.length}</strong><span>animes na lista</span></div>
        <div className="profile-stat"><strong>{history.length}</strong><span>itens no histórico</span></div>
      </div>
    </section>
    {!supabaseConfigured ? <div className="state-panel" style={{ marginTop: 16 }}>
      <span className="state-panel__icon"><Cloud size={18} /></span>
      <div><strong>Sincronização não configurada</strong><p>Para ativar, crie um projeto Supabase, aplique `supabase/schema.sql` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente. Nunca use `service_role` no aplicativo.</p></div>
    </div> : userId ? <div className="profile-card" style={{ marginTop: 16 }}>
      <p><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#22c55e' }} />Sessão autenticada.</p>
      <Button variant="ghost" onClick={signOut} style={{ marginTop: 16 }}><LogOut size={15} /> Sair</Button>
    </div> : <form className="auth-form" onSubmit={submit}>
      <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
      <label>Senha<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" /></label>
      <Button type="submit" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar para sincronizar' : 'Criar conta'}</Button>
      <Button type="button" variant="subtle" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); setError(''); }}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</Button>
      {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
    </form>}
    {syncError && <p className="auth-message auth-message--error" role="alert">{syncError}</p>}
    {supabaseConfigured && userId && (error || message) && <p className={`auth-message ${error ? 'auth-message--error' : ''}`}>{error || message}</p>}
    <section className="profile-card" style={{ marginTop: 16 }}>
      <h2>Fonte do catálogo</h2>
      <p>Metadados fornecidos pela Tenrai API v1, serviço não oficial compatível com o formato Jikan v4. Não há afiliação com a MyAnimeList. Dados podem estar desatualizados; direitos de títulos, imagens e marcas pertencem aos respectivos titulares.</p>
    </section>
  </div>;
}
