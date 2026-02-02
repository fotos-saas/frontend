# Electron + Angular Desktop App Skill

## Mikor Használd

Használd ezt a skill-t amikor:
- Electron desktop app fejlesztés Angular-ral
- Mac vagy Windows natív funkciók kellenek
- Desktop build, packaging, distribution
- IPC kommunikáció (main process ↔ renderer)
- Auto-updater implementálás
- Natív menük, tray ikon, notification

---

## Projekt Struktúra

```
frontend/
├── electron/
│   ├── main.ts              # Main process (Node.js környezet)
│   ├── preload.ts           # Context bridge (biztonságos híd)
│   ├── tsconfig.json        # Electron-specifikus TS config
│   ├── entitlements.mac.plist
│   └── assets/
│       ├── icon.icns        # Mac ikon
│       └── icon.ico         # Windows ikon
├── src/
│   └── app/core/services/
│       └── electron.service.ts  # Angular service natív API-hoz
├── dist/                    # Angular build output
└── release/                 # Electron build output (.dmg, .exe)
```

---

## Alapvető Parancsok

```bash
# Fejlesztés (Angular + Electron együtt)
npm run electron:dev

# Production build Mac-re
npm run electron:build

# Production build Windows-ra (Mac-ről is működik)
npm run electron:build -- --win

# Gyors teszt (DMG/EXE nélkül)
npm run electron:build:dir
```

---

## Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APP                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  MAIN PROCESS    │   IPC   │   RENDERER PROCESS       │ │
│  │  (main.ts)       │◄───────►│   (Angular App)          │ │
│  │                  │         │                          │ │
│  │  Node.js API:    │         │  - Components            │ │
│  │  - File system   │         │  - Services              │ │
│  │  - Native menus  │         │  - ElectronService       │ │
│  │  - Tray icon     │         │  - WebSocket (Laravel)   │ │
│  │  - Notifications │         │                          │ │
│  │  - Auto-updater  │         │  window.electronAPI      │ │
│  └──────────────────┘         └──────────────────────────┘ │
│           │                              │                  │
│           └──────────┬───────────────────┘                  │
│                      │                                      │
│              ┌───────▼───────┐                              │
│              │  preload.ts   │                              │
│              │  contextBridge│                              │
│              └───────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## IPC Kommunikáció Pattern

### 1. Main Process Handler (electron/main.ts)

```typescript
import { ipcMain } from 'electron';

// Egyszerű handler (visszatérési értékkel)
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// Handler paraméterekkel
ipcMain.handle('save-file', async (_event, { filename, content }) => {
  const filePath = path.join(app.getPath('documents'), filename);
  await fs.promises.writeFile(filePath, content);
  return filePath;
});

// Event küldése renderer-nek
mainWindow.webContents.send('update-available', { version: '1.2.0' });
```

### 2. Preload Bridge (electron/preload.ts)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Invoke (válaszra vár)
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  saveFile: (filename: string, content: string) =>
    ipcRenderer.invoke('save-file', { filename, content }),

  // Event listener
  onUpdateAvailable: (callback: (data: any) => void) => {
    ipcRenderer.on('update-available', (_event, data) => callback(data));
  },
});
```

### 3. Angular Service Használat

```typescript
@Injectable({ providedIn: 'root' })
export class ElectronService {
  get isElectron(): boolean {
    return !!window.electronAPI;
  }

  async saveFile(filename: string, content: string): Promise<string> {
    if (!this.isElectron) throw new Error('Not in Electron');
    return window.electronAPI.saveFile(filename, content);
  }
}
```

---

## Gyakori Feladatok

### Native Notification

**main.ts:**
```typescript
ipcMain.handle('show-notification', (_event, { title, body, icon }) => {
  const notification = new Notification({ title, body, icon });
  notification.show();
  return true;
});
```

### File Dialog

**main.ts:**
```typescript
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
    ]
  });
  return result.filePaths;
});
```

### System Tray

**main.ts:**
```typescript
import { Tray, Menu, nativeImage } from 'electron';

let tray: Tray | null = null;

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/tray-icon.png'));
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open PhotoStack', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('PhotoStack');
  tray.setContextMenu(contextMenu);
});
```

### Auto-Updater

**main.ts:**
```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = false;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Check on startup
app.whenReady().then(() => {
  autoUpdater.checkForUpdates();
});
```

---

## Build Configuration

### Mac Build (package.json)

```json
{
  "build": {
    "mac": {
      "category": "public.app-category.photography",
      "icon": "electron/assets/icon.icns",
      "target": [
        { "target": "dmg", "arch": ["universal"] }
      ],
      "hardenedRuntime": true,
      "entitlements": "electron/entitlements.mac.plist",
      "entitlementsInherit": "electron/entitlements.mac.plist"
    }
  }
}
```

### Windows Build

```json
{
  "build": {
    "win": {
      "icon": "electron/assets/icon.ico",
      "target": [
        { "target": "nsis", "arch": ["x64"] }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

---

## Biztonsági Szabályok

1. **SOHA ne használj `nodeIntegration: true`** - biztonsági kockázat
2. **MINDIG használj `contextIsolation: true`** - alapértelmezett
3. **Preload script-en keresztül kommunikálj** - contextBridge
4. **Validáld az IPC paramétereket** - main process-ben
5. **Ne engedj tetszőleges URL navigációt** - will-navigate event

```typescript
// Helyes biztonsági beállítások
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // KÖTELEZŐ
    contextIsolation: true,      // KÖTELEZŐ
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,
  }
});
```

---

## Hibakeresés

### DevTools megnyitása
```typescript
mainWindow.webContents.openDevTools();
```

### Main process debug
```bash
# VS Code-ban: launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": ["."],
  "cwd": "${workspaceFolder}"
}
```

### Renderer process debug
Chrome DevTools automatikusan elérhető (Cmd+Option+I)

---

## Platform-specifikus Kód

```typescript
// Main process
if (process.platform === 'darwin') {
  // macOS specifikus
  app.dock.setIcon(icon);
}

if (process.platform === 'win32') {
  // Windows specifikus
  app.setAppUserModelId('com.photostack.app');
}

// Angular (ElectronService-en keresztül)
if (this.electronService.isMac) {
  // macOS UI adaptációk
}
```

---

## Checklist Új Funkció Hozzáadásához

1. [ ] Main process handler (`ipcMain.handle`)
2. [ ] Preload bridge (`contextBridge.exposeInMainWorld`)
3. [ ] TypeScript típusok (`declare global { interface Window }`)
4. [ ] Angular service metódus
5. [ ] Fallback böngészőben (ha releváns)
6. [ ] Tesztelés dev módban
7. [ ] Tesztelés production build-ben
