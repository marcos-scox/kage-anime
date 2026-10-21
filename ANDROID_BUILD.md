# Build Android do KAGE ANIME

O projeto Capacitor usa `minSdkVersion 23`, `compileSdkVersion 35` e `targetSdkVersion 35`. O build debug usa o Gradle Wrapper incluído, Java 21 e o plugin oficial `@capacitor/app` para encaminhar o botão físico Android ao histórico do React Router.

## Instalação do SDK

Instale o Android CLI oficial ou o pacote de Command-line Tools do Android Studio. O instalador atual do Android CLI para Linux x86_64 está publicado pelo Android Developers:

```sh
curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
```

Defina `ANDROID_HOME` para a pasta de SDK escolhida e liste os pacotes disponíveis:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
android --sdk="$ANDROID_HOME" sdk list --all
```

Para este projeto, instale `platforms/android-35`, `build-tools/35.0.0` e `platform-tools`:

```sh
android --sdk="$ANDROID_HOME" sdk install platforms/android-35 build-tools/35.0.0 platform-tools
```

O instalador pode solicitar a aceitação das licenças aplicáveis. Leia os termos no fluxo oficial antes de aceitar. O Android CLI atual é a interface indicada pela documentação; `sdkmanager` é legado/depreciado.

## Build

Na raiz do projeto:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm cap:sync
pnpm android:debug
```

O APK debug será criado em `android/app/build/outputs/apk/debug/app-debug.apk`. Um APK debug serve para instalação e testes; não substitui um APK assinado de distribuição comercial/Play Store. Não inclua `android/local.properties`, chaves de assinatura ou arquivos `.env` reais no Git.

## Linux ARM64

No Linux ARM64, o Android Gradle Plugin 8.7.2 baixa um AAPT2 Google Maven x86_64 que não executa nativamente. Este projeto foi compilado com sucesso no Sandbox `aarch64` usando o AAPT2 Google correspondente ao AGP 8.7.2 sob QEMU user-mode. O APK resultante foi validado como íntegro e com assinatura debug.

Para repetir em outro host ARM64, use um `qemu-x86_64-static` e um sysroot x86_64 com o dynamic loader e as bibliotecas requeridas pelo binário AAPT2. Crie um wrapper executável chamado `aapt2` que encaminhe todos os argumentos ao AAPT2 baixado pelo AGP. Exemplo conceitual:

```sh
#!/bin/sh
SYSROOT="/caminho/para/sysroot-x86_64"
GOOGLE_AAPT2="/caminho/para/aapt2-do-gradle"
if [ "${1-}" = "version" ]; then
  exec qemu-x86_64-static -L "$SYSROOT" "$GOOGLE_AAPT2" "$@" 2>&1
fi
exec qemu-x86_64-static -L "$SYSROOT" "$GOOGLE_AAPT2" "$@"
```

A versão do AAPT2 escreve informações de versão em stderr, por isso o wrapper junta stderr ao stdout apenas no comando `version`; no modo daemon mantém os canais separados. Aponte o Gradle para o caminho absoluto do wrapper em `~/.gradle/gradle.properties`:

```properties
android.aapt2FromMavenOverride=/caminho/absoluto/aapt2
```

Depois reinicie o daemon com `cd android && ./gradlew --stop` e execute `pnpm android:debug`. Esse override é local ao ambiente e não deve ser commitado no projeto. É uma compatibilidade de build/teste, não uma garantia de suporte oficial do Google para Linux ARM64. Em hosts x86_64, não use o wrapper.

## Segurança do cliente

Mantenha `android/local.properties`, keystores e segredos fora do Git. O Supabase no cliente usa somente URL e chave pública anon, protegida por políticas RLS; nunca inclua `service_role` no APK.

## Referências

- [Android SDK command-line tools](https://developer.android.com/tools): pacotes SDK, diretórios e `ANDROID_HOME`.
- [Android CLI — download](https://developer.android.com/tools/agents/android-cli/download): instalador oficial Linux.
- [Android CLI — SDK](https://developer.android.com/tools/agents/android-cli/commands/sdk): gerenciar pacotes do SDK.
- [Android CLI — instalação de pacotes](https://developer.android.com/tools/agents/android-cli/commands/sdk_install): sintaxe e nomes dos pacotes.
- [AAPT2](https://developer.android.com/tools/aapt2): compilação e empacotamento de recursos.
- [Android Issue Tracker #227219818](https://issuetracker.google.com/issues/227219818): limitações Linux ARM64 e `android.aapt2FromMavenOverride`; mantenha o override apenas para teste/compatibilidade.
- [Building Android apps on Asahi Linux](https://ignacio.tech/blog/building-android-apps-on-asahi-linux/): exemplo de QEMU user-mode e wrapper do AAPT2.
- [SDK Manager legado](https://developer.android.com/tools/sdkmanager): referência da ferramenta anterior.
- [Capacitor App plugin](https://capacitorjs.com/docs/apis/app): `backButton` Android-only, `canGoBack` e `App.exitApp()`.
