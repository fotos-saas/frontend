import { Injectable, inject, NgZone } from '@angular/core';
import { LoggerService } from './logger.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ElectronService } from './electron.service';
import { isSecureUrl } from '../utils/url-validator.util';

/**
 * Checkout Session valasz a backend-tol
 */
export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Portal Session valasz a backend-tol
 */
export interface PortalSessionResponse {
  portal_url: string;
}

/**
 * Payment eredmeny tipus
 */
export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Registration adatok a checkout-hoz
 */
export interface CheckoutRegistrationData {
  name: string;
  email: string;
  password: string;
  billing: {
    company_name: string;
    tax_number?: string;
    country: string;
    postal_code: string;
    city: string;
    address: string;
    phone: string;
  };
  plan: 'alap' | 'iskola' | 'studio';
  billing_cycle: 'monthly' | 'yearly';
}

/**
 * Payment Service
 *
 * Kezeli a Stripe fizeteseket mind desktop (Electron), mind web kornyezetben.
 *
 * Desktop mukodes:
 * 1. Backend letrehozza a Checkout Session-t (deep link URL-ekkel)
 * 2. Electron megnyitja a Stripe Checkout-ot kulso bongeszobe
 * 3. Sikeres fizetes utan deep link visszairanyitas: photostack://payment/success?session_id=xxx
 * 4. Az app feldolgozza a deep linket es befejezi a regisztraciot
 *
 * Web mukodes:
 * 1. Backend letrehozza a Checkout Session-t
 * 2. Redirect a Stripe Checkout-ra
 * 3. Sikeres fizetes utan redirect vissza a success URL-re
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly logger = inject(LoggerService);
  private readonly http = inject(HttpClient);
  private readonly electronService = inject(ElectronService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly baseUrl = environment.apiUrl;

  // Payment eredmeny Subject-ek az aszinkron ertesitesekhez
  private paymentSuccess$ = new Subject<PaymentResult>();
  private paymentCancelled$ = new Subject<void>();

  constructor() {
    this.initDesktopPaymentListeners();
  }

  /**
   * Desktop deep link listenerek inicializalasa
   */
  private initDesktopPaymentListeners(): void {
    if (!this.electronService.isElectron) {
      return;
    }

    // Sikeres fizetes deep link
    this.electronService.onPaymentSuccess((data) => {
      this.ngZone.run(() => {
        this.logger.info('Payment success deep link received', data.sessionId);
        this.paymentSuccess$.next({
          success: true,
          sessionId: data.sessionId
        });
      });
    });

    // Megszakitott fizetes deep link
    this.electronService.onPaymentCancelled(() => {
      this.ngZone.run(() => {
        this.logger.info('Payment cancelled deep link received');
        this.paymentCancelled$.next();
      });
    });
  }

  /**
   * Observable a sikeres fizetesekhez
   */
  get onPaymentSuccess(): Observable<PaymentResult> {
    return this.paymentSuccess$.asObservable();
  }

  /**
   * Observable a megszakitott fizetesekhez
   */
  get onPaymentCancelled(): Observable<void> {
    return this.paymentCancelled$.asObservable();
  }

  /**
   * Ellenorzi, hogy desktop kornyezetben futunk-e
   */
  get isDesktop(): boolean {
    return this.electronService.isElectron;
  }

  /**
   * Stripe Checkout Session letrehozasa regisztracihoz
   * A backend altal visszaadott URL-t megnyitja (desktop: kulso bongeszo, web: redirect)
   *
   * @param data - Regisztracios adatok
   * @returns Promise ami akkor teljesul, amikor a checkout megnyilt
   */
  async createCheckoutSession(data: CheckoutRegistrationData): Promise<{ sessionId: string }> {
    // Checkout Session letrehozasa a backend-en
    // A backend automatikusan beallitja a helyes success/cancel URL-eket
    // Desktop eseten: photostack://payment/success?session_id={CHECKOUT_SESSION_ID}
    // Web eseten: https://tablostudio.hu/register-success?session_id={CHECKOUT_SESSION_ID}
    const response = await firstValueFrom(
      this.http.post<CheckoutSessionResponse>(
        `${this.baseUrl}/subscription/checkout`,
        {
          ...data,
          // Jelezzuk a backend-nek, hogy desktop appbol erkezik a keres
          // Igy tudja beallitani a deep link URL-eket
          is_desktop: this.isDesktop
        }
      )
    );

    // Checkout megnyitasa
    if (this.isDesktop) {
      // Desktop: kulso bongeszoben megnyitjuk
      const result = await this.electronService.openStripeCheckout(response.checkout_url);
      if (!result.success) {
        throw new Error(result.error || 'Nem sikerult megnyitni a fizetesi oldalt');
      }
    } else {
      // Web: redirect a Stripe Checkout-ra
      if (!isSecureUrl(response.checkout_url)) {
        throw new Error('Érvénytelen fizetési URL');
      }
      window.location.href = response.checkout_url;
    }

    return { sessionId: response.session_id };
  }

  /**
   * Stripe Customer Portal megnyitasa
   * Meglevo elofizetok szamara: csomag valtas, fizetesi mod, szamlak
   *
   * @returns Promise ami akkor teljesul, amikor a portal megnyilt
   */
  async openCustomerPortal(): Promise<void> {
    // Portal Session letrehozasa a backend-en
    const response = await firstValueFrom(
      this.http.post<PortalSessionResponse>(
        `${this.baseUrl}/subscription/portal`,
        {}
      )
    );

    // Portal megnyitasa
    if (this.isDesktop) {
      // Desktop: kulso bongeszoben megnyitjuk
      const result = await this.electronService.openStripePortal(response.portal_url);
      if (!result.success) {
        throw new Error(result.error || 'Nem sikerult megnyitni a fiokkezelot');
      }
    } else {
      // Web: redirect a Stripe Portal-ra
      if (!isSecureUrl(response.portal_url)) {
        throw new Error('Érvénytelen portál URL');
      }
      window.location.href = response.portal_url;
    }
  }

  /**
   * Regisztracio befejezese sikeres fizetes utan
   * A checkout session alapjan letrehozza a partner fiokot
   *
   * @param sessionId - Stripe Checkout Session ID
   * @returns Promise a regisztracios eredmennyel
   */
  completeRegistration(sessionId: string): Observable<{
    message: string;
    user?: { id: number; name: string; email: string };
    already_registered?: boolean;
  }> {
    return this.http.post<{
      message: string;
      user?: { id: number; name: string; email: string };
      already_registered?: boolean;
    }>(`${this.baseUrl}/subscription/complete-registration`, { session_id: sessionId });
  }

  /**
   * Checkout Session ellenorzese
   * Hasznos a fizetes allapotanak ellenorzesere
   *
   * @param sessionId - Stripe Checkout Session ID
   * @returns Observable a session allapottal
   */
  verifySession(sessionId: string): Observable<{
    status: string;
    payment_status: string;
  }> {
    return this.http.post<{
      status: string;
      payment_status: string;
    }>(`${this.baseUrl}/subscription/verify`, { session_id: sessionId });
  }
}
