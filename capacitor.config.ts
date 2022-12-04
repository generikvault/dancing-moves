import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.mvolkert.dancingmoves',
  appName: 'Dancing Moves',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      clientId: '899905894399-7au62afsvq8l1hqcu5mjh6hbll44vr7t.apps.googleusercontent.com',
      androidClientId: '899905894399-1ifjke5s5a8dq80knqjcrivs4rpq619b.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
