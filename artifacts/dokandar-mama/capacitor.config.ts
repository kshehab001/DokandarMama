import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dokandarmama.app',
  appName: 'Dokandar Mama',
  webDir: 'dist/public',
  server: {
    url: 'https://dokandar-mama.onrender.com',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#059669',
      showSpinner: false,
    },
  },
};

export default config;
