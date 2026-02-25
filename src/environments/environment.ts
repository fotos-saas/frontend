export const environment = {
  production: false,
  apiUrl: '/api',
  // WebSocket konfiguráció
  wsHost: 'api.tablostudio.hu',
  wsPort: 443,
  wsScheme: 'https',
  wsKey: 'tablo-production-key',
  wsCluster: 'mt1',
  wsEnabled: true,
  // Sentry konfiguráció - FONTOS: A DSN-t környezeti változóból kell beállítani build időben!
  // Használd a SENTRY_DSN környezeti változót a build konfigurációban
  sentryDsn: '', // Placeholder - a valós DSN-t NE commitold be!
};
