import { Injectable, NgZone, DestroyRef, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { isSecureUrl } from '../utils/url-validator.util';

type CleanupFn = () => void;

/**
 * ElectronPaymentService - Stripe fizetes es deep link kezeles
 *
 * Funkcionalitas:
 * - Stripe Checkout megnyitasa (desktop: kulso bongeszo, web: redirect)
 * - Stripe Customer Portal megnyitasa
 * - Deep link esemeny figyelese (payment success/cancel)
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronPaymentService {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private cleanupFunctions: CleanupFn[] = [];

  constructor(private ngZone: NgZone) {
    this.destroyRef.onDestroy(() => {
      this.cleanupFunctions.forEach(cleanup => cleanup());
      this.cleanupFunctions = [];
    });
  }

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  // ============ Stripe Payment ============

  /** Stripe Checkout megnyitasa (desktop: kulso bongeszo, web: redirect) */
  async openStripeCheckout(checkoutUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!isSecureUrl(checkoutUrl)) {
      return { success: false, error: 'Érvénytelen fizetési URL' };
    }
    if (!this.isElectron) {
      window.location.href = checkoutUrl;
      return { success: true };
    }
    return window.electronAPI!.stripe.openCheckout(checkoutUrl);
  }

  /** Stripe Customer Portal megnyitasa */
  async openStripePortal(portalUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!isSecureUrl(portalUrl)) {
      return { success: false, error: 'Érvénytelen portál URL' };
    }
    if (!this.isElectron) {
      window.location.href = portalUrl;
      return { success: true };
    }
    return window.electronAPI!.stripe.openPortal(portalUrl);
  }

  // ============ Deep Link Handlers ============

  /** Deep link callback regisztralas */
  onDeepLink(callback: (path: string) => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onDeepLink((path) => {
      this.ngZone.run(() => {
        this.logger.info('Deep link received', path);
        callback(path);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  /** Sikeres fizetes deep link callback */
  onPaymentSuccess(callback: (data: { sessionId: string }) => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onPaymentSuccess((data) => {
      this.ngZone.run(() => {
        this.logger.info('Payment success received', data);
        callback(data);
      });
    });
    this.cleanupFunctions.push(cleanup);
  }

  /** Megszakitott fizetes deep link callback */
  onPaymentCancelled(callback: () => void): void {
    if (!this.isElectron) return;

    const cleanup = window.electronAPI!.onPaymentCancelled(() => {
      this.ngZone.run(() => {
        this.logger.info('Payment cancelled');
        callback();
      });
    });
    this.cleanupFunctions.push(cleanup);
  }
}
