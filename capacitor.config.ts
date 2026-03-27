import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.bhavyat.canadapr',
  appName: 'Canada PR Chat',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#DC2626',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#DC2626',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
