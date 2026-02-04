import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'hu.tablostudio.app',
  appName: 'PhotoStack',
  webDir: 'dist/frontend-tablo/browser',

  // Server config - load from hosted URL (same as Electron)
  server: {
    url: 'https://app.tablostudio.hu',
    cleartext: false, // HTTPS only
  },

  // iOS specific
  ios: {
    scheme: 'PhotoStack',
    contentInset: 'automatic', // Safe area handling
    preferredContentMode: 'mobile', // Force mobile viewport
    limitsNavigationsToAppBoundDomains: true, // Security
    allowsLinkPreview: false,
    scrollEnabled: false, // Disable bounce scroll
  },

  // Android specific
  android: {
    allowMixedContent: false, // Security
    captureInput: true, // Better keyboard handling
    webContentsDebuggingEnabled: false, // Disable in prod!
    initialFocus: false,
  },

  // Plugins config
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resize: 'body' as const,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
