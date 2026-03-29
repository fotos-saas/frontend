import { app, ipcMain, shell, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import { isAllowedOrigin, isAllowedExternalDomain } from './constants';

// ============ Stripe Payment / Checkout ============

export function registerStripeHandlers(): void {
  /**
   * Open Stripe Checkout URL in external browser
   * The success/cancel redirects will use deep links to return to the app
   */
  ipcMain.handle('open-stripe-checkout', async (_event, { checkoutUrl }) => {
    if (typeof checkoutUrl !== 'string') {
      log.warn('Invalid checkout URL');
      return { success: false, error: 'Invalid checkout URL' };
    }

    try {
      const parsedUrl = new URL(checkoutUrl);
      const isStripeUrl = parsedUrl.hostname === 'checkout.stripe.com' ||
                          parsedUrl.hostname.endsWith('.stripe.com');

      if (!isStripeUrl) {
        log.warn('Blocked non-Stripe checkout URL:', checkoutUrl);
        return { success: false, error: 'Invalid checkout URL' };
      }

      log.info('Opening Stripe checkout:', checkoutUrl);
      await shell.openExternal(checkoutUrl);
      return { success: true };
    } catch (error) {
      log.error('Failed to open Stripe checkout:', error);
      return { success: false, error: 'Failed to open checkout' };
    }
  });

  /**
   * Open Stripe Customer Portal URL in external browser
   */
  ipcMain.handle('open-stripe-portal', async (_event, { portalUrl }) => {
    if (typeof portalUrl !== 'string') {
      log.warn('Invalid portal URL');
      return { success: false, error: 'Invalid portal URL' };
    }

    try {
      const parsedUrl = new URL(portalUrl);
      const isStripeUrl = parsedUrl.hostname === 'billing.stripe.com' ||
                          parsedUrl.hostname.endsWith('.stripe.com');

      if (!isStripeUrl) {
        log.warn('Blocked non-Stripe portal URL:', portalUrl);
        return { success: false, error: 'Invalid portal URL' };
      }

      log.info('Opening Stripe portal:', portalUrl);
      await shell.openExternal(portalUrl);
      return { success: true };
    } catch (error) {
      log.error('Failed to open Stripe portal:', error);
      return { success: false, error: 'Failed to open portal' };
    }
  });
}

// ============ Security: Navigation Guards ============

export function registerSecurityHandlers(): void {
  app.on('web-contents-created', (_event, contents) => {
    // Navigation security
    contents.on('will-navigate', (event, navigationUrl) => {
      if (!isAllowedOrigin(navigationUrl)) {
        console.warn('Blocked navigation to:', navigationUrl);
        event.preventDefault();
      }
    });

    // Redirect security
    contents.on('will-redirect', (event, navigationUrl) => {
      if (!isAllowedOrigin(navigationUrl)) {
        console.warn('Blocked redirect to:', navigationUrl);
        event.preventDefault();
      }
    });

    // Frame navigation security
    contents.on('will-frame-navigate', (event) => {
      const url = event.url;
      if (!isAllowedOrigin(url)) {
        console.warn('Blocked frame navigation to:', url);
        event.preventDefault();
      }
    });

    // Prevent new window creation from renderer
    contents.setWindowOpenHandler(({ url }) => {
      if (isAllowedExternalDomain(url)) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
  });
}
