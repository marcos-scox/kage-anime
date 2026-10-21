import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.kageanime',
  appName: 'KAGE ANIME',
  webDir: 'dist',
  backgroundColor: '#09090f',
  android: {
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
