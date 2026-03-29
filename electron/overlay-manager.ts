import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import log from 'electron-log/main';
import { isDev, PRODUCTION_URL } from './constants';
import { getMainWindow } from './window-manager';

// ============ Overlay Window (Always-on-top Command Palette) ============

let overlayWindow: BrowserWindow | null = null;

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

export function createOverlayWindow(): void {
  // Vizszintes toolbar sav -- felulre pozicionalva
  // Az ablak nagyobb mint a toolbar (upload panel hely alatta), a toolbar a tetejen van
  const activeDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH, x: screenX, y: screenY } = activeDisplay.workArea;
  const windowW = screenW;
  const windowH = screenH; // teljes munkaterulet magassag -- panel felfelé nohet

  overlayWindow = new BrowserWindow({
    width: windowW,
    height: windowH,
    x: screenX,
    y: screenY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    movable: true,
    show: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Overlay route betoltese (path-based, NEM hash!)
  const overlayUrl = isDev
    ? 'http://localhost:4205/overlay'
    : `${PRODUCTION_URL}/overlay`;

  overlayWindow.loadURL(overlayUrl).catch((error) => {
    log.error('Failed to load overlay URL:', error);
  });

  // Auth token szinkronizalas amint az overlay betoltodott
  overlayWindow.webContents.once('did-finish-load', () => {
    syncAuthToOverlay();
  });

  // NEM rejtjuk el blur-ra! Always-on-top marad.
  // Csak a hide gomb vagy Ctrl+K rejti el.

  // Ablak ne mehessen ki a keperorol
  overlayWindow.on('move', () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    const [x, y] = overlayWindow.getPosition();
    const [w, h] = overlayWindow.getSize();
    const display = screen.getDisplayMatching({ x, y, width: w, height: h });
    const { x: sx, y: sy, width: sw, height: sh } = display.workArea;

    let newX = x;
    let newY = y;
    let changed = false;

    if (newX < sx - w + 100) { newX = sx - w + 100; changed = true; }
    if (newX > sx + sw - 100) { newX = sx + sw - 100; changed = true; }
    if (newY < sy) { newY = sy; changed = true; }
    if (newY > sy + sh - 60) { newY = sy + sh - 60; changed = true; }

    if (changed) overlayWindow.setPosition(newX, newY);
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  log.info('Overlay window created');
}

export function toggleOverlayWindow(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    overlayWindow?.once('ready-to-show', () => {
      showOverlayWindow();
    });
    return;
  }

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
  } else {
    showOverlayWindow();
  }
}

export function showOverlayWindow(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  overlayWindow.show();
  // Auth token szinkronizalas: main window -> overlay window
  syncAuthToOverlay();
}

export async function syncAuthToOverlay(): Promise<void> {
  const mw = getMainWindow();
  if (!mw || mw.isDestroyed() || !overlayWindow || overlayWindow.isDestroyed()) return;
  try {
    // OSSZES sessionStorage kulcs szinkronizalasa (marketer_token + tablo:*:*:token + egyeb)
    const allEntries = await mw.webContents.executeJavaScript(`
      (() => {
        const entries = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key === 'marketer_token' || key === 'marketer_user' || key.startsWith('tablo:'))) {
            entries[key] = sessionStorage.getItem(key);
          }
        }
        return entries;
      })()
    `);
    if (allEntries && Object.keys(allEntries).length > 0) {
      const entriesJson = JSON.stringify(allEntries);
      await overlayWindow.webContents.executeJavaScript(`
        (() => {
          const entries = ${entriesJson};
          Object.keys(entries).forEach(key => {
            sessionStorage.setItem(key, entries[key]);
          });
        })()
      `);
      overlayWindow.webContents.send('overlay:auth-synced');
      log.info('Auth synced to overlay:', Object.keys(allEntries).join(', '));
    }
  } catch { /* window may not be ready */ }
}

// Main window login utan szinkronizalja az OSSZES tokent az overlay-be
export function listenMainWindowAuthChanges(): void {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  // 2 mp-enkent ellenorzi az osszes auth kulcsot (marketer_token + tablo:* entries)
  let lastSyncHash = '';
  const authCheckInterval = setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) { clearInterval(authCheckInterval); return; }
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    try {
      const allEntries = await mainWindow.webContents.executeJavaScript(`
        (() => {
          const entries = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key === 'marketer_token' || key === 'marketer_user' || key.startsWith('tablo:'))) {
              entries[key] = sessionStorage.getItem(key);
            }
          }
          return entries;
        })()
      `);
      if (!allEntries || Object.keys(allEntries).length === 0) return;
      // Csak akkor szinkronizalunk ha valtozott
      const currentHash = JSON.stringify(allEntries);
      if (currentHash === lastSyncHash) return;
      lastSyncHash = currentHash;
      const entriesJson = JSON.stringify(allEntries);
      await overlayWindow.webContents.executeJavaScript(`
        (() => {
          const entries = ${entriesJson};
          Object.keys(entries).forEach(key => {
            sessionStorage.setItem(key, entries[key]);
          });
        })()
      `);
      overlayWindow.webContents.send('overlay:auth-synced');
      log.info('Auth synced to overlay (periodic):', Object.keys(allEntries).join(', '));
    } catch { /* window not ready */ }
  }, 2000);

  mainWindow.on('closed', () => clearInterval(authCheckInterval));
}
