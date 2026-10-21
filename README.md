# KAGE ANIME

Aplicativo Android-first em português para explorar metadados de anime, organizar uma lista pessoal e acompanhar histórico quando houver uma fonte de reprodução autorizada. Interface construída com React, Vite, TypeScript e Capacitor.

## Baixar o APK

[Baixar KAGE ANIME 0.1.0 — APK debug](https://github.com/marcos-scox/kage-anime/releases/latest/download/Kage-Anime-debug.apk)

O APK é destinado a instalação e testes, pacote `br.com.kageanime`, `minSdk 23` e `targetSdk 35`. Foi assinado com uma chave Android debug e **não é uma assinatura de distribuição para a Play Store**. Builds debug feitos com outra chave podem não atualizar esta instalação; talvez seja necessário desinstalar antes de instalar outra versão. SHA-256: `21a629a65b2c2c5f4f3f35734d8f5499d76464214df4e375f45f4a1e03f94af2`.

## O que está incluído

- Início, Explorar, detalhes, Minha lista, Histórico e Perfil, com navegação Android.
- Catálogo e metadados via Jikan, com busca, filtros disponíveis, cache, paginação e estados offline/erro.
- Favoritos e dados do usuário guardados localmente; autenticação e sincronização Supabase opcionais.
- Player que só aceita fonte própria, licenciada ou explicitamente autorizada. **Esta build não contém uma fonte de vídeo autorizada**, então não reproduz streams; mostra a indisponibilidade e, quando fornecidos pelo catálogo, links externos de onde assistir. Não inclui vídeos, listas clandestinas ou contorno de DRM.

Jikan fornece metadados, não direitos de transmissão, disponibilidade regional, dublagem ou legendas. Nenhuma informação de áudio/legenda é inferida sem fonte confiável.

## Executar localmente

Requisitos: Node.js 22, pnpm 11 e Java 21. Clone o repositório público e instale dependências:

```sh
git clone https://github.com/marcos-scox/kage-anime.git
cd kage-anime
pnpm install --frozen-lockfile
pnpm dev
```

A Jikan não precisa de chave. A URL padrão é `https://api.jikan.moe/v4`; `VITE_JIKAN_BASE_URL` pode definir outra base compatível. A API depende de conexão e pode aplicar limite de requisições. O cache serve metadados já consultados quando possível.

## Dados pessoais opcionais

Favoritos e histórico local não exigem login. Para sincronização entre dispositivos, configure um projeto Supabase, aplique [`supabase/schema.sql`](supabase/schema.sql) e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. O exemplo está em [`.env.example`](.env.example). Use somente a chave pública anon no cliente; **nunca** inclua `service_role` no APK. Sem configuração Supabase, o catálogo continua utilizável e os dados locais permanecem no dispositivo.

## Android

O projeto Capacitor completo está em `android/`. Para compilar um APK debug:

```sh
pnpm build
pnpm cap:sync
pnpm android:debug
```

Saída local: `android/app/build/outputs/apk/debug/app-debug.apk`. Requisitos do SDK, licenças, assinatura e uma nota para Linux ARM64 estão em [`ANDROID_BUILD.md`](ANDROID_BUILD.md). Não envie `android/local.properties`, keystores ou arquivos `.env` reais ao GitHub.

## Conteúdo e fontes

Consulte a [documentação da Jikan](https://docs.api.jikan.moe/) e as condições da própria plataforma antes de distribuir conteúdo. O player permanece sem vídeo até integrar uma fonte própria, licenciada ou autorizada. O aplicativo não promete download nem reprodução offline de vídeos sem autorização.
