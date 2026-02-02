import { app, BrowserWindow, shell, ipcMain, nativeTheme, Notification } from 'electron';
import * as path from 'path';
import * as url from 'url';

// Handle __dirname for ES modules
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

// Detect if running in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hiddenInset', // Mac native title bar style
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window', // Mac frosted glass effect
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent for vibrancy
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (isDev) {
    // Development: load from Angular dev server
    mainWindow.loadURL('http://localhost:4205');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/frontend-tablo/index.html'));
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // macOS: recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Show native notification
ipcMain.handle('show-notification', async (_event, { title, body }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false,
    });
    notification.show();
    return true;
  }
  return false;
});

// Get app info
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isDev,
  };
});

// Get dark mode status
ipcMain.handle('get-dark-mode', () => {
  return nativeTheme.shouldUseDarkColors;
});

// Listen for dark mode changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
});

// Security: prevent navigation to unknown URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigins = ['http://localhost:4205', 'file://'];

    if (!allowedOrigins.some(origin => navigationUrl.startsWith(origin))) {
      event.preventDefault();
    }
  });
});
