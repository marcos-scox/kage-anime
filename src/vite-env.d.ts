/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CATALOG_BASE_URL?: string;
  /** Compatibilidade com configurações locais antigas de uma base Jikan v4. */
  readonly VITE_JIKAN_BASE_URL?: string;
}
