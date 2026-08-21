import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.qalbimdaqiquron.tracker',
  appName: 'QuranTracker',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#E57399',
      style: 'DARK'
    }
  }
};

export default config;
