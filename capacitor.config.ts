import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.mvolkert.dancingmoves',
  appName: 'Dancing Moves',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '899905894399-v3cadm0moeq4scdist85ntc16qk5e25f.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
