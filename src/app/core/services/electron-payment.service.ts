import { Injectable, NgZone, OnDestroy } from '@angular/core';

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
export class ElectronPaymentService implements OnDestroy {
  private cleanupFunctions: CleanupFn[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }

  private get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  // ============ Stripe Payment ============

  /** Stripe Checkout megnyitasa (desktop: kulso bongeszo, web: redirect) */
  async openStripeCheckout(checkoutUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      window.location.href = checkoutUrl;
      return { success: true };
    }
    return window.electronAPI!.stripe.openCheckout(checkoutUrl);
  }

  /** Stripe Customer Portal megnyitasa */
  async openStripePortal(portalUrl: string): Promise<{ success: boolean; error?: string }> {
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
        console.log('Deep link received:', path);
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
        console.log('Payment success received:', data);
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
        console.log('Payment cancelled');
        callback();
      });
    });
    this.cleanupFunctions.push(cleanup);
  }
}
