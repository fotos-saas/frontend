export const environment = {
  production: true,
  apiUrl: 'https://api.tablostudio.hu/api',
  // WebSocket konfiguráció
  wsHost: 'api.tablostudio.hu',
  wsPort: 443,
  wsScheme: 'https',
  wsKey: 'tablo-production-key',
  wsCluster: 'mt1',
  wsEnabled: true,
  // Sentry DSN - build-time env variable-ből kell beállítani (SENTRY_DSN)
  sentryDsn: ''
};
