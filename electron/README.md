# PhotoStack Electron App

## Gyors Indítás

### 1. Függőségek telepítése

```bash
cd frontend
npm install
```

### 2. Fejlesztés (Dev Mode)

```bash
npm run electron:dev
```

Ez elindítja:
- Angular dev server-t (localhost:4205)
- Electron-t dev módban, ami a dev server-re csatlakozik
- DevTools automatikusan megnyílik

### 3. Production Build

```bash
# Mac DMG (universal - Intel + Apple Silicon)
npm run electron:build

# Windows NSIS installer
npm run electron:build:win

# Linux AppImage + deb
npm run electron:build:linux

# Minden platform egyszerre
npm run electron:build:all
```

**Output mappa:** `frontend/release/`

| Platform | Fájl |
|----------|------|
| macOS | `PhotoStack-1.0.0-universal.dmg` |
| Windows | `PhotoStack Setup 1.0.0.exe` |
| Linux | `PhotoStack-1.0.0.AppImage`, `.deb` |

### 4. Tesztelés (gyors, telepítés nélkül)

```bash
npm run electron:build:dir
```

Az app itt lesz: `frontend/release/mac-universal/PhotoStack.app`

---

## Fájlstruktúra

```
electron/
├── main.ts                  # Electron fő folyamat (ablak kezelés, IPC)
├── preload.ts               # Bridge az Angular és natív API között
├── tsconfig.json            # TypeScript konfig az Electron fájlokhoz
├── entitlements.mac.plist   # Mac app jogosultságok
└── assets/
    ├── icon.icns            # Mac app ikon (1024x1024)
    ├── icon.ico             # Windows app ikon
    └── icons/               # Linux ikonok (különböző méretek)
        ├── 16x16.png
        ├── 32x32.png
        ├── 64x64.png
        ├── 128x128.png
        ├── 256x256.png
        └── 512x512.png
```

---

## Ikonok Készítése

### Forrás
Készíts egy **1024x1024 PNG** ikont átlátszó háttérrel.

### macOS (.icns)

```bash
# Iconset mappa létrehozása
mkdir PhotoStack.iconset

# Méretek generálása (sips Mac-en)
sips -z 16 16     icon-1024.png --out PhotoStack.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out PhotoStack.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out PhotoStack.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out PhotoStack.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out PhotoStack.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out PhotoStack.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out PhotoStack.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out PhotoStack.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out PhotoStack.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out PhotoStack.iconset/icon_512x512@2x.png

# Konvertálás icns-re
iconutil -c icns PhotoStack.iconset -o electron/assets/icon.icns
```

### Windows (.ico)

Online: https://icoconvert.com/ vagy ImageMagick:

```bash
convert icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 electron/assets/icon.ico
```

### Linux (PNG-k)

```bash
mkdir -p electron/assets/icons
for size in 16 32 64 128 256 512; do
  sips -z $size $size icon-1024.png --out electron/assets/icons/${size}x${size}.png
done
```

---

## Angular ElectronService Használata

```typescript
import { ElectronService } from '@core/services/electron.service';

@Component({...})
export class MyComponent {
  constructor(private electronService: ElectronService) {}

  async showNativeNotification() {
    if (this.electronService.isElectron) {
      await this.electronService.showNotification(
        'PhotoStack',
        'Sikeres mentés!'
      );
    }
  }

  checkPlatform() {
    if (this.electronService.isMac) {
      console.log('Running on macOS');
    }
  }
}
```

---

## Elérhető IPC Funkciók

| Handler | Leírás |
|---------|--------|
| `show-notification` | Natív OS értesítés |
| `get-app-info` | App verzió, név, platform |
| `get-dark-mode` | Rendszer dark mode állapot |

**Event:**
- `dark-mode-changed` - Dark mode változás figyelése

---

## Code Signing & Notarization (Production)

### macOS

1. **Apple Developer ID** beszerzése ($99/év)
2. Environment variables beállítása:

```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

3. `package.json` kiegészítése:

```json
"afterSign": "scripts/notarize.js"
```

### Windows

Code signing certificate beszerzése (pl. DigiCert, Sectigo).

---

## Következő Lépések

- [ ] App ikonok elkészítése minden platformra
- [ ] Code Signing beállítása
- [ ] Auto-updater hozzáadása (electron-updater)
- [ ] Crash reporter integrálása
- [ ] Deep linking (photostack:// protokoll)

---

## Hasznos Parancsok

```bash
# Dev mód
npm run electron:dev

# Mac build
npm run electron:build

# Windows build (Mac-ről is működik Wine-nal)
npm run electron:build:win

# Linux build
npm run electron:build:linux

# Gyors teszt (DMG nélkül)
npm run electron:build:dir

# Összes platform
npm run electron:build:all
```
