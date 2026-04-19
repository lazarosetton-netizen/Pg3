import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pgnews.app',
  appName: 'PGNEWS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
