# KAGE ANIME

Aplicativo Android-first em português para explorar metadados de anime, organizar uma lista pessoal e acompanhar histórico quando houver uma fonte de reprodução autorizada. Interface construída com React, Vite, TypeScript e Capacitor.

## Baixar o APK

[Baixar KAGE ANIME 0.2.0 — APK debug](https://github.com/marcos-scox/kage-anime/releases/latest/download/Kage-Anime-debug.apk)

Pacote `br.com.kageanime`, `versionCode 2`, `minSdk 23`, `targetSdk 35`; 4.488.892 bytes. SHA-256: `6c24daf30fac8983610b47122e8bdb80a2bacdfa375da043dcf334f099f130fb`. Assinado com a mesma chave Android debug da versão 0.1.0, permitindo atualizar essa instalação; **não é uma assinatura de distribuição para a Play Store**. Builds debug futuros feitos com outra chave podem exigir desinstalação antes da atualização.

## O que está incluído

- Início, Explorar, detalhes, Minha lista, Histórico e Perfil, com navegação Android.
- Catálogo e metadados pelo Tenrai REST API v1, compatível com o formato Jikan v4: busca, filtros documentados, cache, paginação e estados offline/erro.
- A integração usa somente o endpoint público Tenrai, sem chave no APK, com intervalo entre requisições e respeito ao `Retry-After` em respostas de limite.
- AniList não é consultada nesta versão; sua integração permanece suspensa até autorização escrita do usuário.
- Favoritos e dados do usuário guardados localmente; autenticação e sincronização Supabase opcionais.
- Player que só aceita fonte própria, licenciada ou explicitamente autorizada. **Esta build não contém uma fonte de vídeo autorizada**, então não reproduz streams; mostra a indisponibilidade e apenas apresenta plataformas reconhecidas quando tanto o nome quanto o domínio correspondem à allowlist do app. Isso não comprova disponibilidade do título, região ou plano: confirme no próprio serviço. Não inclui vídeos, listas clandestinas ou contorno de DRM.

## Catálogo e direitos

O endpoint público original Jikan (`api.jikan.moe`) foi anunciado como descontinuado; esta versão usa o [Tenrai REST API v1](https://api.tenrai.org/documentation), um espelho compatível com Jikan v4. O acesso público não precisa de credencial e documenta os limites de 120 requisições por minuto e 4 por segundo. O cliente limita o ritmo, usa cache e respeita `Retry-After`.

Tenrai v1 está em beta/interina, não oferece SLA e pode servir metadados em cache ou desatualizados. Os [Termos de Serviço](https://tenrai.org/terms) permitem uso em apps e cache de respostas, mas não transferem direitos sobre dados, capas, nomes ou marcas de terceiros. O catálogo não prova disponibilidade regional, áudio/dublagem, legendas ou direito de transmissão. O aplicativo não é afiliado ao Tenrai ou ao MyAnimeList.

## Executar localmente

Requisitos: Node.js 22, pnpm 11 e Java 21. Clone o repositório público e instale dependências:

```sh
git clone https://github.com/marcos-scox/kage-anime.git
cd kage-anime
pnpm install --frozen-lockfile
pnpm dev
```

A URL padrão é `https://api.tenrai.org/v1`; não é necessária chave. Para uma base compatível administrada por você, use `VITE_CATALOG_BASE_URL`. A variável antiga `VITE_JIKAN_BASE_URL` também é aceita como override de compatibilidade. Veja [`.env.example`](.env.example); não coloque chaves privadas no cliente.

## Dados pessoais opcionais

Favoritos e histórico local não exigem login. Para sincronização entre dispositivos, configure um projeto Supabase, aplique [`supabase/schema.sql`](supabase/schema.sql) e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Use somente a chave pública anon no cliente; **nunca** inclua `service_role` no APK. Sem configuração Supabase, o catálogo continua utilizável e os dados locais permanecem no dispositivo.

## Android

O projeto Capacitor completo está em `android/`. Para compilar um APK debug:

```sh
pnpm build
pnpm cap:sync
pnpm android:debug
```

Saída local: `android/app/build/outputs/apk/debug/app-debug.apk`. Requisitos do SDK, licenças, assinatura e uma nota para Linux ARM64 estão em [`ANDROID_BUILD.md`](ANDROID_BUILD.md). Não envie `android/local.properties`, keystores ou arquivos `.env` reais ao GitHub.

## Conteúdo e fontes

Consulte a [documentação Tenrai](https://api.tenrai.org/documentation), seus [termos](https://tenrai.org/terms) e as licenças/condições aplicáveis dos titulares do conteúdo antes de redistribuí-lo. O player permanece sem vídeo até integrar uma fonte própria, licenciada ou autorizada. O aplicativo não promete download nem reprodução offline de vídeos sem autorização.
