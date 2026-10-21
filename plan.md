# Plano de implementação — KAGE ANIME

## Escopo e abordagem

Construir um aplicativo Android-first em português do Brasil com **React, Vite, TypeScript e Capacitor**, mantendo também a interface executável no navegador do Preview. O projeto gerenciado está vazio; a inicialização Web flexível respeita a stack explicitamente pedida, em vez de substituir Capacitor pelo starter Expo fixo do modo Mobile.

O catálogo público será obtido da Jikan API por uma camada de serviço tipada e substituível. A camada tratará busca com debounce/cancelamento, cache, paginação, limites da API e dados ausentes. Os metadados da Jikan não serão tratados como autorização ou disponibilidade de vídeo. As imagens dos animes virão da API; não serão embutidas imagens de terceiros sem licença clara nem títulos demonstrativos apresentados como reais.

**Decisão de escopo (2026-10-21):** esta versão consulta somente a Jikan. A AniList permanece desativada até haver autorização escrita para o uso neste aplicativo; conta GitHub não é autenticação nem autorização da AniList. A consulta ao endpoint público Jikan não pôde ser validada pelo Sandbox nesta revisão (falha TLS), portanto disponibilidade ao vivo depende da rede/API do dispositivo.

Rotas com React Router: início (`/`), explorar (`/explorar`), minha lista (`/minha-lista`), histórico (`/historico`), perfil (`/perfil`), detalhes (`/anime/:id`) e reprodução (`/assistir/:animeId/:episode`). A navegação inferior fixa terá cinco destinos. No Android, `@capacitor/app` encaminhará o botão físico voltar ao histórico React Router; numa rota sem histórico, voltará ao início e, no início, permitirá sair do aplicativo. O histórico e os favoritos funcionarão primeiro em armazenamento local com dados mínimos para exibição offline; a interface continuará navegável sem rede e explicará quando uma operação depender dela.

O player receberá exclusivamente fontes próprias, licenciadas ou explicitamente autorizadas para incorporação. Como a Jikan não fornece fontes licenciadas, a ausência de fonte resultará em uma tela de indisponibilidade clara, sem vídeos, URLs ou idiomas inventados. O componente poderá atender uma fonte autorizada futura, mas não tentará extrair links nem contornar proteções.

O player receberá exclusivamente fontes próprias, licenciadas ou explicitamente autorizadas para incorporação. Como a Jikan não fornece fontes licenciadas, a ausência de fonte resultará em uma tela de indisponibilidade clara, sem vídeos, URLs ou idiomas inventados. O componente poderá atender uma fonte autorizada futura, mas não tentará extrair links nem contornar proteções.

Supabase será opcional, ativado somente quando URL e chave pública do projeto forem configuradas. O modo local não dependerá de login. A integração terá fallback explícito sem configuração; uma migração SQL documentará `profiles`, `favorites` e `watch_history`, índices e políticas RLS por `auth.uid()`. Nenhuma chave `service_role` será incluída no aplicativo.

## Arquitetura proposta

- `src/app/`: roteamento, shell, navegação e composição global.
- `src/pages/`: início, explorar, minha lista, histórico, perfil, detalhes e reprodução.
- `src/components/`: cards, carrosséis, busca, skeletons, estados vazios/erro/offline, botões e layout compartilhados.
- `src/features/catalog/`: modelos, cliente Jikan, endpoints, mapeadores e cache.
- `src/features/library/`: favoritos, histórico, armazenamento local e progresso.
- `src/features/playback/`: fonte autorizada, player HTML5/HLS e tratamento de falhas.
- `src/features/auth/`: integração Supabase opcional e estado de sessão.
- `src/hooks/`, `src/lib/`, `src/styles/`: hooks, utilitários/configuração e tokens/estilos.
- `public/`: manifesto, ícones, recursos estáticos e `manus-routes.json` sincronizado com as páginas.
- `android/`: projeto Capacitor Android gerado e configurado.
- `supabase/`: migração SQL opcional com tabelas, índices e RLS.

Dependências centrais: React, Vite, TypeScript, React Router, Lucide, Capacitor Android com `@capacitor/app`, cliente `fetch` com cache leve, IndexedDB/localStorage e `hls.js` somente se necessário. O shell offline será servido por service worker/precaching; dados catalográficos aparecerão offline apenas quando previamente armazenados. `packageManager` ficará fixado em pnpm e permissões de scripts serão declaradas antes da instalação, conforme pnpm 11.

## Direção visual

**Movimento:** editorial neo-noir de streaming, com referência à composição vertical de pôsteres japoneses sem reproduzir marcas existentes.

**Princípios:** arte dos títulos como foco; hierarquia cinematográfica com leitura rápida no celular; superfícies escuras e calmas; ações diretas com estados acessíveis e táteis.

**Cores:** fundo `#09090F`, superfície `#12121C`, cards `#1A1A28`, roxo assinatura `#8B5CF6`, destaque `#A78BFA`, texto `#F8FAFC`/`#9CA3AF` e verde `#22C55E` para estados positivos. O roxo funciona como ponto de orientação, não como preenchimento dominante.

**Layout:** home em faixas editoriais assimétricas, hero de altura contida seguido por carrosséis; explorar e biblioteca usam grades de pôsteres; barra inferior fixa com safe area e espaço reservado para o conteúdo. Cards com raio de 12–18 px e gradiente escuro sobre as capas.

**Motivos de marca:** monograma geométrico próprio baseado em um “K” recortado por uma meia-lua; filete roxo como marcador de seleção; gradiente de luz discreto apenas em foco e CTA.

**Interação e movimento:** navegação por rotas reais, estados ativos evidentes, alvos de toque confortáveis, transições curtas de opacidade/deslocamento e seleção com leve realce roxo. Skeletons mantêm a proporção das capas; reduzir movimento conforme preferência do sistema.

**Tipografia:** Manrope para títulos e interface, com Noto Sans JP para caracteres japoneses e fallback de sistema; escala curta e consistente entre título hero, seções, metadados e microtexto.

**Essência da marca:** catálogo móvel para explorar anime com dados claros e sem promessas falsas de reprodução; personalidade precisa, noturna e acolhedora. Voz direta: “Continue de onde parou.” e “Reprodução não disponível nesta fonte.” O nome KAGE ANIME aparece em logotipo vetorial próprio, não em fonte padrão isolada. A cor de marca distintiva é o violeta profundo `#8B5CF6`.

## Serviços, segurança e limites

Não será criado servidor ou banco gerenciado para o catálogo. A integração Supabase não será considerada pronta para uma conta real até receber URL/chave pública; o app deve continuar funcional sem elas. O player não embutirá fontes fictícias nem oferecerá downloads de vídeos. Links de “Onde assistir” só serão mostrados se vierem de uma fonte oficial verificável; caso contrário, a indisponibilidade ficará explícita.

## Fluxo de execução e entrega

O build web/PWA e TypeScript passam; o manifesto de rotas responde como JSON estático e os diagnósticos TypeScript permanecem registrados. `pnpm cap:sync` e `pnpm android:debug` concluíram com sucesso usando Java 21, SDK Platform 35 e o AAPT2 Google 8.7.2 executado por QEMU no Sandbox `aarch64`; o procedimento está documentado em `ANDROID_BUILD.md`. O APK debug tem 4.356.584 bytes, pacote `br.com.kageanime`, versão `0.1.0`, `minSdk 23`, `targetSdk 35`, ZIP íntegro e assinatura Android debug verificada. O certificado debug não é uma chave de release/Play Store.

Não há fonte de vídeo própria/licenciada/autorizada configurada; por isso o player exibe indisponibilidade e links de catálogo em vez de reproduzir streams não autorizados. O Supabase permanece opcional e não foi configurado com credenciais reais; favoritos/histórico local funcionam sem conta e erros de sincronização agora são visíveis.

O projeto está conectado canonicamente ao repositório **público** `marcos-scox/kage-anime`; a transferência foi concluída e verificada no checkpoint `e11958e5df7bb20d7e2ac766a18ad43e1391f0b0`. A Release pública `v0.1.0` contém o ativo `Kage-Anime-debug.apk` (4.356.584 bytes, SHA-256 `21a629a65b2c2c5f4f3f35734d8f5499d76464214df4e375f45f4a1e03f94af2`). O README já tem o link direto estável `https://github.com/marcos-scox/kage-anime/releases/latest/download/Kage-Anime-debug.apk`, testado sem autenticação. O app/site não foi publicado e auto-publish permaneceu desligado.

Entrega prevista: código completo no GitHub, `README.md`, migração Supabase opcional, comandos de execução/build, configuração Capacitor e, se a compilação funcionar, APK debug na release pública com link no README. Se o ambiente não conseguir produzir o APK, informar o bloqueio e não deixar link fingindo que existe artefato para baixar.
