# macOS Code Signing es Notarization

Ez a dokumentacio leirja, hogyan kell beallitani a macOS code signing-ot es notarization-t a PhotoStack Electron apphoz.

## Elofeltetel: Apple Developer Program

A code signing es notarization-hoz szukseges egy **Apple Developer Program** tagsag ($99/ev).

Regisztracio: https://developer.apple.com/programs/

## 1. Certificate Letrehozas

### 1.1 Developer ID Certificate igenylese

1. Jelentkezz be az Apple Developer portalon: https://developer.apple.com/account
2. Navigalj: **Certificates, Identifiers & Profiles** > **Certificates**
3. Kattints a **+** gombra uj certificate letrehozasahoz
4. Valaszd ki: **Developer ID Application**
5. Kovetd az utasitasokat a CSR (Certificate Signing Request) letrehozasahoz:
   - Nyisd meg a **Keychain Access** appot
   - Menu: **Keychain Access** > **Certificate Assistant** > **Request a Certificate From a Certificate Authority**
   - Add meg az email cimed es nevet
   - Valaszd: "Saved to disk"
   - Mentsd el a `.certSigningRequest` fajlt
6. Toltsd fel a CSR fajlt az Apple Developer portalon
7. Toltsd le a generalalt certificate-et (`.cer` fajl)
8. Dupla kattintas a `.cer` fajlra - ez importalja a Keychain-be

### 1.2 Certificate ellenorzese

```bash
# Listazd a rendelkezesre allo signing identitasokat
security find-identity -v -p codesigning

# Ellenorizd, hogy latod-e a Developer ID Application certificate-et
# Pelda output:
# 1) ABCDEF123456... "Developer ID Application: Your Name (TEAM_ID)"
```

## 2. Environment Valtozok Beallitasa

### Szukseges valtozok

| Valtozo | Leiras |
|---------|--------|
| `APPLE_ID` | Apple ID email cimed |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific jelszo (lasd lent) |
| `APPLE_TEAM_ID` | 10 karakteres Team ID |

### App-Specific Password letrehozasa

1. Latogass el: https://appleid.apple.com/account/manage
2. **Sign-In and Security** > **App-Specific Passwords**
3. Kattints a **+** gombra
4. Adj nevet (pl. "PhotoStack Notarization")
5. Masold ki a generalalt jelszot

### Team ID megtalalasa

1. Apple Developer portal: https://developer.apple.com/account
2. **Membership** vagy **Membership Details**
3. A **Team ID** itt talalhato (10 karakteres alfanumerikus kod)

### Lokalis beallitas (.zshrc vagy .bashrc)

```bash
# Adjuk hozza a shell konfighoz
export APPLE_ID="your-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

### .env fajl (FONTOS: NE COMMITOLD!)

```bash
# .env (gitignore-ban kell lennie!)
APPLE_ID=your-email@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

## 3. Build es Notarization

### Lokalis build (signed + notarized)

```bash
# Ellenorizd, hogy be vannak-e allitva a valtozok
echo $APPLE_ID
echo $APPLE_TEAM_ID

# Build inditasa
npm run electron:build
```

Az electron-builder automatikusan:
1. Code sign-olja az appot a Developer ID certificate-tel
2. Elkuldi az appot az Apple notary service-nek
3. Megvarja a notarization jovahagyasat
4. Staple-eli a notarization ticket-et az apphoz

### Notarization statusz ellenorzese

```bash
# Ha a notarization fuggoben van vagy hibas
xcrun notarytool history --apple-id $APPLE_ID --password $APPLE_APP_SPECIFIC_PASSWORD --team-id $APPLE_TEAM_ID

# Reszletes log egy adott submission-rol
xcrun notarytool log <submission-id> --apple-id $APPLE_ID --password $APPLE_APP_SPECIFIC_PASSWORD --team-id $APPLE_TEAM_ID
```

## 4. GitHub Actions CI/CD

### Repository Secrets beallitasa

1. GitHub repo > **Settings** > **Secrets and variables** > **Actions**
2. Add hozza ezeket a secrets-eket:
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`
   - `MACOS_CERTIFICATE` (Base64 encoded .p12 fajl)
   - `MACOS_CERTIFICATE_PASSWORD` (.p12 export jelszo)

### Certificate exportalasa Base64 formatumba

```bash
# Exportald a certificate-et .p12 formatumba (Keychain Access-bol)
# Majd konvertald Base64-re:
base64 -i Certificates.p12 -o certificate-base64.txt

# A certificate-base64.txt tartalmat masold be a MACOS_CERTIFICATE secret-be
```

### GitHub Actions Workflow (.github/workflows/build-electron.yml)

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Import certificate
        env:
          MACOS_CERTIFICATE: ${{ secrets.MACOS_CERTIFICATE }}
          MACOS_CERTIFICATE_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PASSWORD }}
        run: |
          # Create temporary keychain
          KEYCHAIN_PATH=$RUNNER_TEMP/build.keychain
          KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

          # Create keychain
          security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
          security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

          # Import certificate
          echo "$MACOS_CERTIFICATE" | base64 --decode > $RUNNER_TEMP/certificate.p12
          security import $RUNNER_TEMP/certificate.p12 -k $KEYCHAIN_PATH -P "$MACOS_CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security
          security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

          # Add to search list
          security list-keychains -d user -s $KEYCHAIN_PATH login.keychain

      - name: Build Electron app
        working-directory: frontend
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run electron:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: macos-build
          path: |
            frontend/release/*.dmg
            frontend/release/*.zip
```

## 5. Hibaelharitas

### Gyakori hibak

#### "The signature of the binary is invalid"
- Ellenorizd, hogy a certificate lejart-e
- Ujra importald a certificate-et

#### "The notarization service reported issues"
- Futtasd: `xcrun notarytool log <submission-id> ...`
- Ellenorizd az entitlements fajlt
- Gyozodj meg rola, hogy minden binary hardened runtime-mal van buildelve

#### "Unable to find identity"
- Ellenorizd: `security find-identity -v -p codesigning`
- Importald ujra a certificate-et

#### Keytar/Native module hibak
- Az entitlements fajlban kell lennie:
  - `com.apple.security.cs.disable-library-validation`
  - `com.apple.security.cs.allow-dyld-environment-variables`

### Debug logging

```bash
# Reszletes electron-builder log
DEBUG=electron-builder npm run electron:build
```

## 6. Ellenorzes

### App signing ellenorzese

```bash
# Ellenorizd a code signing-ot
codesign --verify --deep --strict --verbose=2 "release/mac-universal/PhotoStack.app"

# Ellenorizd a notarization-t
spctl --assess --type execute --verbose "release/mac-universal/PhotoStack.app"
```

### Sikeres output

```
release/mac-universal/PhotoStack.app: valid on disk
release/mac-universal/PhotoStack.app: satisfies its Designated Requirement

release/mac-universal/PhotoStack.app: accepted
source=Notarized Developer ID
```

## Osszefoglalas

| Lepes | Parancs/Muvelet |
|-------|-----------------|
| Certificate igenyles | Apple Developer Portal |
| Certificate import | Dupla kattintas .cer fajlra |
| Environment beallitas | `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| Build | `npm run electron:build` |
| Ellenorzes | `codesign --verify` es `spctl --assess` |
