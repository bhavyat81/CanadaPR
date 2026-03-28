import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhavyat.canadapr',
  appName: 'Canada PR Chat',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['www.canada.ca'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#DC2626',
      showSpinner: false,
      launchAutoHide: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#DC2626',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
