/**
 * Sentry Service - Angular oldali crash reporting
 *
 * Ez a service kezeli a Sentry inicializalasat es a hiba/uzenet kuldeseket
 * a renderer process-bol (Angular app).
 */
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as Sentry from '@sentry/angular';

// Environment import
import { environment } from '../../../environments/environment';

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
 * User context interface
 */
export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  partnerId?: string;
}

/**
 * Breadcrumb kategoria tipus
 */
export type BreadcrumbCategory =
  | 'navigation'
  | 'ui.click'
  | 'ui.input'
  | 'http'
  | 'auth'
  | 'error'
  | 'info'
  | 'debug';

/**
 * Sentry Service
 * Kezeli a Sentry inicializalasat, hiba/uzenet kuldeseket es felhasznalo kontextust
 */
@Injectable({
  providedIn: 'root'
})
export class SentryService {
  private initialized = false;
  private dsn = '';

  constructor() {
    // DSN a window objektumbol (Electron preload altal beallitva) vagy environment-bol
    this.dsn = (window as { SENTRY_DSN?: string }).SENTRY_DSN ||
               (environment as { sentryDsn?: string }).sentryDsn ||
               '';
  }

  /**
   * Inicializalja a Sentry-t a renderer process-ben
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    if (!this.dsn) {
      if (!environment.production) {
        console.log('[Sentry] No DSN configured, skipping initialization');
      }
      return;
    }

    const isProduction = environment.production;

    Sentry.init({
      dsn: this.dsn,

      // Release verzio - a window objektumbol vagy package.json-bol
      release: `photostack@${this.getAppVersion()}`,

      // Environment
      environment: isProduction ? 'production' : 'development',

      // Debug mode fejleszteshez
      debug: !isProduction,

      // Sample rate
      sampleRate: isProduction ? 1.0 : 0.1,

      // Traces sample rate
      tracesSampleRate: isProduction ? 0.2 : 0.1,

      // Integraciok
      integrations: [
        // Browser integraciok
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          // Session replay beallitasok
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Replay sample rates
      replaysSessionSampleRate: isProduction ? 0.1 : 0,
      replaysOnErrorSampleRate: isProduction ? 1.0 : 0,

      // beforeSend hook - erzekeny adatok szurese
      beforeSend(event) {
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

        return event;
      },

      // beforeBreadcrumb hook
      beforeBreadcrumb(breadcrumb) {
        // API kulcsok szurese az URL-ekbol
        if (breadcrumb.data?.['url'] && typeof breadcrumb.data['url'] === 'string') {
          const url = breadcrumb.data['url'];
          breadcrumb.data['url'] = url.replace(
            /([?&])(token|key|api_key|apiKey|secret)=[^&]*/gi,
            '$1$2=[REDACTED]'
          );
        }
        return breadcrumb;
      },
    });

    // Alapertelmezett tagek
    Sentry.setTag('platform', this.getPlatform());
    Sentry.setTag('app_version', this.getAppVersion());
    Sentry.setTag('renderer', 'angular');

    this.initialized = true;
    if (!isProduction) {
      console.log(`[Sentry] Initialized for development environment`);
    }
  }

  /**
   * Visszaadja az app verziot
   */
  private getAppVersion(): string {
    // Electron app verzio
    const electronVersion = (window as { electronAPI?: { version?: string } }).electronAPI?.version;
    if (electronVersion) {
      return electronVersion;
    }

    // Fallback: package.json verzio (build time-ban beallitva)
    return (window as { APP_VERSION?: string }).APP_VERSION || '1.0.0';
  }

  /**
   * Visszaadja a platformot
   */
  private getPlatform(): string {
    const electronAPI = (window as { electronAPI?: { platform?: string; isElectron?: boolean } }).electronAPI;
    if (electronAPI?.isElectron) {
      return `electron-${electronAPI.platform || 'unknown'}`;
    }
    return 'web';
  }

  /**
   * Beallitja a felhasznalo kontextust
   */
  setUser(user: SentryUser | null): void {
    if (!this.initialized) return;

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      // Extra user adatok tagkent
      if (user.role) {
        Sentry.setTag('user_role', user.role);
      }
      if (user.partnerId) {
        Sentry.setTag('partner_id', user.partnerId);
      }
    } else {
      Sentry.setUser(null);
      Sentry.setTag('user_role', undefined as unknown as string);
      Sentry.setTag('partner_id', undefined as unknown as string);
    }
  }

  /**
   * Manualis hiba kuldes
   */
  captureException(error: Error | unknown, context?: Record<string, unknown>): string | undefined {
    if (!this.initialized) {
      if (!environment.production) {
        console.error('[Sentry] Error (not sent - not initialized):', error);
      }
      return undefined;
    }

    return Sentry.captureException(error, {
      extra: context ? sanitizeData(context) as Record<string, unknown> : undefined,
    });
  }

  /**
   * Manualis uzenet kuldes
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, unknown>
  ): string | undefined {
    if (!this.initialized) {
      if (!environment.production) {
        console.log(`[Sentry] Message (not sent - not initialized): [${level}] ${message}`);
      }
      return undefined;
    }

    return Sentry.captureMessage(message, {
      level,
      extra: context ? sanitizeData(context) as Record<string, unknown> : undefined,
    });
  }

  /**
   * Breadcrumb hozzaadasa
   */
  addBreadcrumb(
    message: string,
    category: BreadcrumbCategory = 'info',
    data?: Record<string, unknown>,
    level: Sentry.SeverityLevel = 'info'
  ): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data: data ? sanitizeData(data) as Record<string, unknown> : undefined,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Tag beallitasa
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  /**
   * Extra context beallitasa
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.initialized) return;
    Sentry.setContext(name, sanitizeData(context) as Record<string, unknown>);
  }

  /**
   * Transaction inditasa (performance monitoring)
   */
  startTransaction(name: string, op: string): Sentry.Span | undefined {
    if (!this.initialized) return undefined;
    return Sentry.startInactiveSpan({ name, op });
  }
}

/**
 * Sentry Error Handler
 * Angular ErrorHandler implementacio ami elküldi a hibakat a Sentry-nek
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  private sentryService = inject(SentryService);

  handleError(error: unknown): void {
    // Hiba kuldese a Sentry-nek
    const eventId = this.sentryService.captureException(error);

    // Konzolra is kiirjuk (fejleszteshez)
    console.error('[SentryErrorHandler] Error captured:', error, 'Event ID:', eventId);
  }
}

/**
 * Sentry providerei az Angular apphoz
 */
export function provideSentry() {
  return [
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler,
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
  ];
}
