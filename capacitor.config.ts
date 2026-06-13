import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.santiagopc08.mile',
  appName: 'mile',
  webDir: 'public',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
