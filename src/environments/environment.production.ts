export const environment = {
  production: true,
  apiUrl: 'https://api.kepvalaszto.hu/api',
  // WebSocket konfiguráció
  wsHost: 'api.kepvalaszto.hu',
  wsPort: 443,
  wsScheme: 'https',
  wsKey: 'tablo-production-key',
  wsCluster: 'mt1',
  wsEnabled: true,
  // Sentry DSN - Coolify env-ből: SENTRY_DSN
  // Ha üres, a Sentry nem inicializálódik
  sentryDsn: ''
};
