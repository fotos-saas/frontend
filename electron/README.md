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

### 3. Production Build (Mac DMG)

```bash
npm run electron:build
```

A kész `.dmg` fájl itt lesz: `frontend/release/PhotoStack-1.0.0-universal.dmg`

### 4. Tesztelés (gyors, telepítés nélkül)

```bash
npm run electron:build:dir
```

Ez létrehozza az app-ot de nem csomagolja DMG-be. Az app itt lesz:
`frontend/release/mac-universal/PhotoStack.app`

---

## Fájlstruktúra

```
electron/
├── main.ts           # Electron fő folyamat (ablak kezelés, IPC)
├── preload.ts        # Bridge az Angular és natív API között
├── tsconfig.json     # TypeScript konfig az Electron fájlokhoz
├── entitlements.mac.plist  # Mac app jogosultságok
└── assets/
    └── icon.icns     # Mac app ikon (HIÁNYZIK - pótolni kell!)
```

---

## ⚠️ Hiányzó: App Ikon

A build előtt kell egy `icon.icns` fájl ide: `electron/assets/icon.icns`

**Készítés módja:**

1. Készíts egy 1024x1024 PNG ikont
2. Mac-en használd az `iconutil` tool-t:

```bash
# Hozz létre iconset mappát
mkdir MyIcon.iconset

# Másold be a különböző méretű ikonokat (16, 32, 64, 128, 256, 512, 1024)
# vagy használj online konvertert

# Konvertálás icns-re
iconutil -c icns MyIcon.iconset
```

Vagy használj online tool-t: https://cloudconvert.com/png-to-icns

---

## Angular ElectronService Használata

Az Angular app-ban már elérhető az `ElectronService`:

```typescript
import { ElectronService } from '@core/services/electron.service';

@Component({...})
export class MyComponent {
  constructor(private electronService: ElectronService) {}

  async showNativeNotification() {
    if (this.electronService.isElectron) {
      await this.electronService.showNotification(
        'PhotoStack',
        'Új fotók érkeztek!'
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

## Következő Lépések

1. **App ikon** - Készíts/szerezz be egy `.icns` ikont
2. **Code Signing** - Apple Developer ID-val aláírás (App Store nélküli terjesztéshez)
3. **Auto-updater** - electron-updater hozzáadása
4. **Notarization** - Apple notarization (macOS Catalina+)

---

## Hasznos Parancsok

```bash
# Csak az Angular-t buildeli
npm run build

# Csak az Electron TypeScript-et fordítja
npm run electron:compile

# Teljes Mac build
npm run electron:build

# Mac build DMG nélkül (gyorsabb teszteléshez)
npm run electron:build:dir
```
