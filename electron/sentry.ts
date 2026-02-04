/**
 * Sentry configuration for Electron Main Process
 *
 * Inicializalja a Sentry crash reporting-ot a main process-ben.
 * A DSN-t kornyezeti valtozobol vesszuk (SENTRY_DSN).
 */
import * as Sentry from '@sentry/electron/main';
import { app } from 'electron';

// Sentry DSN kornyezeti valtozobol
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';

// Erzekeny adatok szurese
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'credential',
  'credit_card',
  'creditCard',
  'ssn',
  'social_security',
];

/**
 * Rekurzivan szuri az erzekeny adatokat egy objektumbol
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Inicializalja a Sentry-t a main process-ben
 */
export function initSentryMain(): void {
  // Ne inicializaljuk, ha nincs DSN
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;

  Sentry.init({
    dsn: SENTRY_DSN,

    // Release verzio az app verziobol
    release: `photostack@${app.getVersion()}`,

    // Environment
    environment: isDev ? 'development' : 'production',

    // Debug mode fejleszteshez
    debug: isDev,

    // Sample rate (production-ben 100%, fejlesztesben 10%)
    sampleRate: isDev ? 0.1 : 1.0,

    // Traces sample rate (teljesitmeny monitoring)
    tracesSampleRate: isDev ? 0.1 : 0.2,

    // beforeSend hook - erzekeny adatok szurese
    beforeSend(event) {
      // Fejlesztesi modban csak loggoljuk
      if (isDev) {
        console.log('[Sentry] Would send event:', event.event_id);
      }

      // Extra data szurese
      if (event.extra) {
        event.extra = sanitizeData(event.extra) as Record<string, unknown>;
      }

      // Breadcrumbs szurese
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeData(breadcrumb.data) as Record<string, unknown>;
          }
          return breadcrumb;
        });
      }

      // Request data szurese
      if (event.request?.data) {
        event.request.data = sanitizeData(event.request.data);
      }

      // Contexts szurese - cast to Contexts to satisfy type checker
      if (event.contexts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event.contexts = sanitizeData(event.contexts) as typeof event.contexts;
      }

      return event;
    },

    // beforeBreadcrumb hook - URL-ek szurese
    beforeBreadcrumb(breadcrumb) {
      // API kulcsok szurese az URL-ekbol
      if (breadcrumb.data && breadcrumb.data['url'] && typeof breadcrumb.data['url'] === 'string') {
        const url = breadcrumb.data['url'];
        // Token/key parameterek szurese
        breadcrumb.data['url'] = url.replace(/([?&])(token|key|api_key|apiKey|secret)=[^&]*/gi, '$1$2=[REDACTED]');
      }
      return breadcrumb;
    },
  });

  // Alapertelmezett tagek beallitasa
  Sentry.setTag('platform', process.platform);
  Sentry.setTag('arch', process.arch);
  Sentry.setTag('electron_version', process.versions.electron);
  Sentry.setTag('node_version', process.versions.node);
  Sentry.setTag('app_version', app.getVersion());

  console.log(`[Sentry] Initialized for ${isDev ? 'development' : 'production'} environment`);
}

/**
 * Beallitja a felhasznalo kontextust
 */
export function setSentryUser(user: { id?: string; email?: string; username?: string } | null): void {
  if (!SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Manualis hiba kuldes
 */
export function captureMainException(error: Error, context?: Record<string, unknown>): string | undefined {
  if (!SENTRY_DSN) {
    console.error('[Sentry] Error (not sent - no DSN):', error);
    return undefined;
  }

  return Sentry.captureException(error, {
    extra: context ? sanitizeData(context) as Record<string, unknown> : undefined,
  });
}

/**
 * Manualis uzenet kuldes
 */
export function captureMainMessage(message: string, level: Sentry.SeverityLevel = 'info'): string | undefined {
  if (!SENTRY_DSN) {
    console.log(`[Sentry] Message (not sent - no DSN): [${level}] ${message}`);
    return undefined;
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Breadcrumb hozzaadasa
 */
export function addMainBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    ...breadcrumb,
    data: breadcrumb.data ? sanitizeData(breadcrumb.data) as Record<string, unknown> : undefined,
  });
}
