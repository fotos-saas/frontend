import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { isDev, PRODUCTION_URL, isAllowedExternalDomain } from './constants';
import { setTouchBarContext } from './touch-bar';

// ============ Window State ============

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

// ============ Window Creation ============

export function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hidden', // Mac: traffic lights always visible
    trafficLightPosition: { x: 20, y: 18 },
    vibrancy: isDev ? undefined : 'under-window', // Mac frosted glass -- dev-ben kikapcsolva (CPU)
    visualEffectState: isDev ? undefined : 'active',
    backgroundColor: isDev ? '#1a1a2e' : '#00000000', // Dev: solid szin, Prod: transparent for vibrancy
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // Extra security layer
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: isDev, // Dev: hatterbe tett ablak CPU-t sporol
    },
    show: false, // Don't show until ready
  });

  // Custom User-Agent to identify Electron app
  mainWindow.webContents.setUserAgent(
    `${mainWindow.webContents.getUserAgent()} PhotoStack/${app.getVersion()}`
  );

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // macOS: ensure traffic light buttons are always visible
    if (process.platform === 'darwin') {
      mainWindow?.setWindowButtonVisibility(true);
      setTouchBarContext('dashboard', mainWindow);
    }
  });

  // Load the app with error handling
  loadApp();

  // Open external links in default browser (with domain restriction)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      (url.startsWith('http://') || url.startsWith('https://')) &&
      isAllowedExternalDomain(url)
    ) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Disable DevTools in production
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Load the app URL with error handling and retry
 */
async function loadApp(): Promise<void> {
  if (!mainWindow) return;

  const targetUrl = isDev ? 'http://localhost:4205' : PRODUCTION_URL;

  try {
    // Dev modban: Chromium cache kiuritese, hogy mindig friss kodot toltson
    if (isDev) {
      await mainWindow.webContents.session.clearCache();
    }

    await mainWindow.loadURL(targetUrl);

    // DevTools: csak ELECTRON_DEVTOOLS=1 env var-ral nyilik (F12-vel kezzel is megnyithato)
    if (isDev && process.env['ELECTRON_DEVTOOLS'] === '1') {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Failed to load URL:', error);

    // Show error page with retry option
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PhotoStack - Kapcsolodasi hiba</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-app-region: drag;
          }
          .container {
            text-align: center;
            padding: 40px;
            -webkit-app-region: no-drag;
          }
          .icon { font-size: 64px; margin-bottom: 24px; }
          h1 { font-size: 24px; margin-bottom: 12px; font-weight: 600; }
          p { color: #a0a0a0; margin-bottom: 32px; line-height: 1.6; }
          button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>Nem sikerult kapcsolodni</h1>
          <p>
            Ellenorizd az internetkapcsolatod,<br>
            majd probald ujra.
          </p>
          <button onclick="location.reload()">Ujraprobalrozas</button>
        </div>
      </body>
      </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }
}
