# KAGE ANIME

Aplicativo Android-first para explorar animes, organizar uma lista pessoal e acompanhar o histórico de reprodução. Interface em português, criada com React, Vite, TypeScript e Capacitor.

## Baixar o APK

**O primeiro APK ainda não foi publicado.** Depois que o build for concluído e a primeira GitHub Release pública existir, esta seção será atualizada com o link direto para o arquivo `Kage-Anime-debug.apk`.

O APK debug será destinado a instalação e testes; não será um pacote de release assinado para publicação na Play Store.

## Executar localmente

Requisitos: Node.js 22, pnpm 11 e Java 21. Clone o repositório e instale as dependências:

```sh
git clone https://github.com/marcos-scox/kage-anime.git
cd kage-anime
pnpm install --frozen-lockfile
pnpm dev
```

O catálogo público usa a Jikan API e não precisa de chave. A URL base padrão é `https://api.jikan.moe/v4`; uma URL alternativa pode ser definida por `VITE_JIKAN_BASE_URL`.

## Dados pessoais opcionais

Favoritos e histórico funcionam sem conta e são salvos localmente. Para sincronizar entre dispositivos, crie um projeto Supabase, aplique [`supabase/schema.sql`](supabase/schema.sql) e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Use apenas a chave pública anon no cliente; **nunca** inclua `service_role` no APK. As variáveis estão listadas em [`.env.example`](.env.example). Sem Supabase configurado, o catálogo permanece utilizável e nenhuma conta é exigida.

## Android

O projeto Capacitor Android já está incluído. Para sincronizar os arquivos web e compilar o APK debug:

```sh
pnpm build
pnpm cap:sync
pnpm android:debug
```

O arquivo de saída é `android/app/build/outputs/apk/debug/app-debug.apk`. O build requer o Android SDK Platform 35, Build Tools 35.0.0 e Platform Tools, além das licenças SDK aplicáveis. A configuração detalhada está em [`ANDROID_BUILD.md`](ANDROID_BUILD.md). Não envie `android/local.properties`, chaves de assinatura ou arquivos `.env` com valores reais ao GitHub.

## Conteúdo e reprodução

Jikan fornece metadados de catálogo; esses dados não concedem direitos de transmissão e não confirmam vídeo, áudio dublado, legendas em português ou disponibilidade por região. O repositório não incorpora fontes de vídeo. O player só aceita uma fonte própria, licenciada ou explicitamente autorizada; sem uma fonte assim, informa que a reprodução não está disponível e pode apresentar links oficiais se forem fornecidos por uma fonte confiável.

Consulte a [documentação da Jikan](https://docs.api.jikan.moe/) e as condições da própria fonte de mídia antes de distribuir conteúdo. O cache de catálogo pode manter metadados previamente consultados, mas o aplicativo não promete download nem reprodução offline de vídeo.
