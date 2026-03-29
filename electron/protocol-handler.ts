import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import log from 'electron-log/main';
import { DEEP_LINK_PROTOCOL } from './constants';

// ============ Deep Link Protocol Registration ============

export function registerProtocol(): void {
  // Register as default protocol handler for photostack://
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
  }
}

/**
 * Handle deep link URL
 * Supported URLs:
 * - photostack://gallery/123
 * - photostack://payment/success?session_id=xxx
 * - photostack://payment/cancel
 * - photostack://partner/projects
 */
export function handleDeepLink(url: string, mainWindow: BrowserWindow | null): void {
  log.info('Deep link received:', url);

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== `${DEEP_LINK_PROTOCOL}:`) {
      log.warn('Invalid deep link protocol:', parsedUrl.protocol);
      return;
    }

    // Extract path for generic deep link handling
    // photostack://gallery/123?foo=bar -> /gallery/123?foo=bar
    const deepPath = '/' + parsedUrl.pathname.replace(/^\/+/, '') + parsedUrl.search;

    // Always send generic deep-link event for routing
    mainWindow?.webContents.send('deep-link', deepPath);

    // Handle specific deep link types
    const pathParts = parsedUrl.pathname.replace(/^\/+/, '').split('/');
    const action = pathParts[0];
    const subAction = pathParts[1];

    if (action === 'payment') {
      if (subAction === 'success') {
        const sessionId = parsedUrl.searchParams.get('session_id');
        if (sessionId) {
          log.info('Payment success, session_id:', sessionId);
          mainWindow?.webContents.send('payment-success', { sessionId });
        }
      } else if (subAction === 'cancel') {
        log.info('Payment cancelled');
        mainWindow?.webContents.send('payment-cancelled');
      }
    }

    // Focus the window for all deep links
    mainWindow?.show();
    mainWindow?.focus();
  } catch (error) {
    log.error('Failed to parse deep link URL:', error);
  }
}

/**
 * Register macOS open-url handler for deep links when app is already running
 */
export function registerOpenUrlHandler(getMainWindow: () => BrowserWindow | null): void {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url, getMainWindow());
  });
}

/**
 * Request single instance lock and handle second-instance deep links (Windows/Linux)
 * Returns false if another instance is already running (caller should quit).
 */
export function requestSingleInstanceLock(getMainWindow: () => BrowserWindow | null): boolean {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    return false;
  }

  app.on('second-instance', (_event, commandLine) => {
    // Windows/Linux: Find the deep link URL in command line args
    const url = commandLine.find(arg => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`));
    if (url) {
      handleDeepLink(url, getMainWindow());
    }

    // Focus the main window
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  return true;
}
