# Hiányzó és Fejlesztendő Funkciók

> Kutatás dátuma: 2025-01-19

## Kritikus Hiányosságok

### 1. 📱 Push Értesítések - NINCS
**Jelenlegi állapot:**
- Nincs értesítés új szavazásról
- Nincs értesítés új hozzászólásról
- Nincs értesítés @mention-ről
- Nincs értesítés válaszról

**Hatás:**
- Diákok nem tudják, mikor kell szavazni
- Lemaradnak fontos információkról
- Kapcsolattartónak manuálisan kell emlékeztetni

---

### 2. 🔔 Real-time Frissítés - NINCS
**Jelenlegi állapot:**
- Polling van egyes helyeken (guest session: 30mp)
- WebSocket nincs implementálva
- Szavazás eredmények nem frissülnek automatikusan
- Fórum hozzászólások sem

**Hatás:**
- Manuális oldal frissítés szükséges
- Nem "élő" élmény

---

### 3. 📣 Hirdetmények/Bejelentések - NINCS
**Jelenlegi állapot:**
- Kapcsolattartó nem tud kiemelt üzenetet küldeni
- Nincs "fontos" jelzés
- Nincs banner rendszer

**Hatás:**
- Fontos infók elvesznek a fórumban
- Nem lehet sürgős értesítést küldeni

---

### 4. 📊 Aktivitás Dashboard - NINCS
**Jelenlegi állapot:**
- Nincs összesített aktivitás nézet
- Nincs timeline/napló
- Nincs statisztika a részvételről

**Hatás:**
- Kapcsolattartó nem látja, ki aktív
- Nem látszik, ki nem szavazott még

---

### 5. 🎨 Sablon Összehasonlító - RÉSZLEGES
**Jelenlegi állapot:**
- Thumbnail van a szavazásban
- Nagyítás/lightbox nincs
- Összehasonlító nézet hiányzik

**Hatás:**
- Nehéz dönteni a sablonok között
- Ki kell nyitni külön ablakban

---

### 6. 📅 Központi Naptár/Események - NINCS
**Jelenlegi állapot:**
- Fotózás dátum csak statikusan jelenik meg
- Nincs emlékeztető rendszer
- Nincs határidő nyomkövetés

**Hatás:**
- Diákok elfelejthetik a fontos dátumokat
- Manuális emlékeztetés szükséges

---

### 7. 💬 Közvetlen Üzenetküldés (DM) - NINCS
**Jelenlegi állapot:**
- Minden kommunikáció publikus
- Nincs privát üzenet funkció
- Nincs kapcsolattartó-diák privát csatorna

**Hatás:**
- Személyes kérdéseket mindenki látja
- Nincs diszkrét kommunikációs lehetőség

---

### 8. 📎 Fájlmegosztás - KORLÁTOZOTT
**Jelenlegi állapot:**
- Fórum média korlátozott
- Nincs Google Drive/OneDrive integráció
- Nincs dokumentum megosztás

**Hatás:**
- Nem lehet könnyen megosztani fájlokat
- Külső linket kell használni

---

### 9. 🌐 Offline Támogatás - NINCS
**Jelenlegi állapot:**
- Nincs PWA
- Nincs offline cache
- Nincs Service Worker

**Hatás:**
- Internet nélkül nem működik
- Lassú hálózaton rossz élmény

---

### 10. 🔍 Keresés - KORLÁTOZOTT
**Jelenlegi állapot:**
- Fórumban van alapszintű keresés
- Szavazásokban nincs keresés
- Globális keresés nincs

**Hatás:**
- Régi információ nehezen található

---

## Közepes Prioritású Hiányosságok

### Email Integráció
- Nincs napi/heti digest
- Nincs email értesítés fontos eseményekről
- Nincs meghívó email funkció

### Emoji Reakciók
- Csak like van, emoji nincs
- Nem lehet gyorsan reagálni

### Olvasottsági Jelzés
- Nem látszik, ki olvasta a hozzászólást
- Nem látszik, ki nézte meg a szavazást

### Export Funkciók
- Szavazás eredmények nem exportálhatók
- Fórum beszélgetések nem menthetők

### Többnyelvűség
- Csak magyar
- Nincs nyelv váltás

---

## Alacsony Prioritású Hiányosságok

### Dark Mode
- Van alapja, de nem teljes
- Nem minden komponens támogatja

### Accessibility (A11Y)
- Alapszintű van
- WCAG teljes megfelelés nincs

### Analytics
- Nincs felhasználói viselkedés tracking
- Nincs hőtérkép

### Social Login
- Nincs Google/Facebook bejelentkezés
- Csak kód/token alapú

---

## Összefoglaló Táblázat

| Funkció | Állapot | Prioritás | Komplexitás |
|---------|---------|-----------|-------------|
| Push értesítések | ❌ Nincs | 🔴 Magas | Közepes |
| Real-time (WebSocket) | ❌ Nincs | 🔴 Magas | Magas |
| Hirdetmények | ❌ Nincs | 🔴 Magas | Alacsony |
| Aktivitás dashboard | ❌ Nincs | 🟡 Közepes | Közepes |
| Sablon összehasonlító | 🟡 Részleges | 🟡 Közepes | Alacsony |
| Központi naptár | ❌ Nincs | 🟡 Közepes | Közepes |
| DM / Privát üzenet | ❌ Nincs | 🟡 Közepes | Magas |
| Fájlmegosztás | 🟡 Korlátozott | 🟢 Alacsony | Közepes |
| PWA / Offline | ❌ Nincs | 🟢 Alacsony | Magas |
| Globális keresés | ❌ Nincs | 🟢 Alacsony | Közepes |
