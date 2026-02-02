# Claude Code Prompt Példák - Electron Fejlesztés

## Hogyan Használd

1. Másold be a megfelelő promptot Claude Code-nak
2. Claude beolvassa a SKILL.md-t és tudni fogja a kontextust
3. Módosítsd a promptot az igényeid szerint

---

## 🚀 Alapok

### Electron Dev Mód Indítása
```
Indítsd el az Electron appot dev módban. Ha hiba van, javítsd ki.
```

### Első Build Tesztelése
```
Buildeld le a Mac appot (electron:build:dir - DMG nélkül a gyorsabb teszthez).
Ha hiba van, javítsd ki.
```

---

## 🔧 Natív Funkciók

### System Tray Ikon
```
Adj hozzá system tray ikont az Electron apphoz:
- Ikon: használj egy egyszerű placeholder ikont egyelőre
- Menü: "Open PhotoStack", separator, "Quit"
- Kattintásra nyíljon meg az ablak
```

### Native File Dialog
```
Adj hozzá file megnyitó dialog funkciót:
- IPC handler a main.ts-ben (open-file-dialog)
- Preload bridge
- Angular service metódus: openFileDialog(): Promise<string[]>
- Szűrő: képek (jpg, png, gif, webp)
```

### Drag & Drop Fájlok
```
Implementálj natív drag & drop támogatást:
- Fájlok behúzása az appba
- Validáció: csak képek
- Event továbbítása Angular-nak
```

### Keyboard Shortcut-ok
```
Adj hozzá globális keyboard shortcut-okat:
- Cmd+N: Új projekt (navigáljon /projects/new-re)
- Cmd+O: File megnyitás dialog
- Cmd+,: Beállítások
Használj globalShortcut-ot és menu accelerator-okat.
```

---

## 🔔 Értesítések

### Natív Notification WebSocket Üzenetekhez
```
Módosítsd a meglévő notification.service.ts-t:
- Ha Electron-ban vagyunk, használj natív notification-t
- Ha böngészőben, maradjon a toast
- Hangjelzés bekapcsolható legyen
```

### Badge az App Ikonon (Mac)
```
Adj hozzá badge számot a Dock ikonra (Mac):
- Olvasatlan értesítések száma
- IPC: set-badge-count
- 0-nál tűnjön el a badge
```

---

## 📁 Fájlkezelés

### Fájl Mentése
```
Implementálj "Save As" funkciót:
- Dialog a mentési hely kiválasztásához
- Alapértelmezett: Documents mappa
- Fájlnév javaslat: projekt neve + dátum
```

### Recent Files Lista
```
Tárold és jelenítsd meg a legutóbbi fájlokat:
- Electron app.addRecentDocument()
- Mac: megjelenik a Dock menüben
- Max 10 elem
```

### Export Funkció
```
Adj hozzá exportálási funkciót:
- Kiválasztott fotók exportálása egy mappába
- Progress dialog mutatása
- Natív folder picker
```

---

## 🔄 Auto-Updater

### Alapvető Auto-Update
```
Implementálj auto-updater-t electron-updater-rel:
- Induláskor ellenőrizze a frissítéseket
- "Frissítés elérhető" banner az Angular UI-ban
- "Letöltés és telepítés" gomb
- GitHub Releases-ről töltse le
```

### Update Progress
```
Adj hozzá letöltési progress-t az auto-updater-hez:
- Progress bar az Angular UI-ban
- Százalék és letöltött/összes méret
- Megszakítás lehetőség
```

---

## 🎨 UI/UX

### Dark Mode Szinkron
```
Szinkronizáld az app témáját a rendszer dark mode-jával:
- Figyelj a nativeTheme változásokra
- Frissítsd az Angular app témáját
- Használd a meglévő ElectronService.darkModeChanges-t
```

### Frameless Window Drag
```
Tedd draggable-é az egyedi title bar-t:
- CSS: -webkit-app-region: drag
- Gombok: -webkit-app-region: no-drag
- Működjön Mac és Windows-on is
```

### Splash Screen
```
Adj hozzá splash screen-t induláskor:
- Egyszerű ablak a logóval
- Töltse be az Angular appot a háttérben
- Ha kész, jelenjen meg a fő ablak, splash tűnjön el
```

---

## 🔒 Biztonság

### Deep Link Kezelés
```
Implementálj deep linking-et (photostack:// protocol):
- Regisztráld a protocol-t
- Kezeld a bejövő URL-eket
- Navigálj a megfelelő Angular route-ra
- Működjön ha az app már fut és ha még nem
```

### Secure Storage
```
Adj hozzá biztonságos tárolást érzékeny adatokhoz:
- Használj keytar vagy safeStorage-ot
- API token tárolása
- Jelszó mentése (ha van)
```

---

## 📦 Build & Distribution

### Windows Build Mac-ről
```
Állítsd be a Windows build-et is:
- package.json build.win konfiguráció
- NSIS installer
- Teszteld: npm run electron:build -- --win
```

### GitHub Actions CI/CD
```
Készíts GitHub Actions workflow-t:
- Minden push-ra: lint + test
- Tag-re: Mac és Windows build
- Artifact: feltöltés GitHub Releases-re
- Secrets: APPLE_ID, APPLE_PASSWORD (notarization)
```

### Code Signing (Mac)
```
Állítsd be a Mac code signing-ot:
- Entitlements ellenőrzése
- Hardened runtime
- Apple Developer ID certificate konfig
- Notarization script
```

---

## 🐛 Hibakeresés

### Debug Mód
```
Az app nem indul el / fehér képernyő. Debug-old:
- Ellenőrizd a console.log-okat
- Nézd meg a main process hibákat
- DevTools automatikus megnyitása
```

### Build Hiba
```
A build sikertelen. Nézd meg mi a hiba és javítsd ki.
Futtasd: npm run electron:build:dir
```

---

## 💡 Tippek

### Gyors Iteráció
```
Csak az Electron részt szeretném módosítani, az Angular kódot nem.
Fordítsd újra csak az Electron fájlokat és indítsd újra.
```

### Meglévő Service Integrálása
```
A notification.service.ts-ben van toast notification.
Egészítsd ki, hogy Electron-ban natív notification-t használjon,
de a meglévő API ne változzon (backward compatible).
```
