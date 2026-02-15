export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  // WebSocket konfiguráció
  wsHost: 'localhost',
  wsPort: 6001,
  wsScheme: 'http',
  wsKey: 'tablo-production-key',
  wsCluster: 'mt1',
  wsEnabled: true,
  // Sentry konfiguráció - FONTOS: A DSN-t környezeti változóból kell beállítani build időben!
  // Használd a SENTRY_DSN környezeti változót a build konfigurációban
  sentryDsn: '', // Placeholder - a valós DSN-t NE commitold be!
};
