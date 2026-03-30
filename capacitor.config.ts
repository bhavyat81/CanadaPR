import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.bhavyat.canadapr',
  appName: 'Canada PR Chat',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
    allowNavigation: ['www.canada.ca', '*.supabase.co'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 4000,
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
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
