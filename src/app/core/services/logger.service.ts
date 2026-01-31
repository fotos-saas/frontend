import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Environment-aware Logger Service
 *
 * Production környezetben NEM ír console-ra (security + performance)
 * Development környezetben normál console logging
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;

  /**
   * Info level log (csak development)
   */
  info(message: string, ...data: unknown[]): void {
    if (!this.isProduction) {
      console.info(`[INFO] ${message}`, ...data);
    }
  }

  /**
   * Warning level log (csak development)
   */
  warn(message: string, ...data: unknown[]): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, ...data);
    }
  }

  /**
   * Error level log (csak development)
   * Production-ben NEM logol console-ra, de a hibát továbbra is kezelni kell!
   */
  error(message: string, error?: unknown): void {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error);
    }
    // Production: Itt lehetne error tracking service-be küldeni (pl. Sentry)
    // this.errorTrackingService.captureException(error);
  }

  /**
   * Debug level log (csak development)
   */
  debug(message: string, ...data: unknown[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
  }

  /**
   * Group log (csak development)
   */
  group(label: string): void {
    if (!this.isProduction) {
      console.group(label);
    }
  }

  /**
   * Group end (csak development)
   */
  groupEnd(): void {
    if (!this.isProduction) {
      console.groupEnd();
    }
  }
}
