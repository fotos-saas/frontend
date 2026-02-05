# PhotoStack Development Workflows

## Konkrét Workflow Példák

---

## 🆕 Workflow #1: Új Electron Feature

**Példa:** "Adj hozzá offline queue szinkronizálást"

### Prompt
```markdown
# Új Feature: Offline Queue Sync

## Leírás
Amikor az app visszakerül online-ba, automatikusan szinkronizálja
a queue-ban lévő request-eket a szerverrel.

## Érintett területek
- electron/main.ts (network monitoring)
- electron/preload.ts (IPC bridge)
- src/app/core/services/electron.service.ts
- src/app/core/services/sync.service.ts (ÚJ)

## Workflow
1. **ARCHITECT**: Olvasd be a fájlokat, tervezd meg a sync logikát
2. **IMPLEMENT**:
   - Hozd létre a SyncService-t
   - Add hozzá a network status change handler-t
   - Implementáld a queue feldolgozást
3. **REVIEW** (subagent):
   "Review-zd a sync implementációt:
    - Race condition lehetőség?
    - Error handling minden request-nél?
    - Retry logika?"
4. **SECURITY** (subagent):
   "Security check:
    - Queue tartalma titkosítva?
    - Request authentikáció megvan?"

## Elfogadási kritériumok
- [ ] Online-ra váltáskor indul a sync
- [ ] Failed request-ek retry-olva
- [ ] User notification sync státuszról
- [ ] Cleanup ha az app bezárul sync közben
```

---

## 🐛 Workflow #2: Bug Fix

**Példa:** "Memory leak a GalleryComponent-ben"

### Prompt
```markdown
# Bug Fix: Memory Leak

## Hiba leírás
A GalleryComponent-ben memory leak van,
az app memóriahasználata folyamatosan nő galéria váltáskor.

## Workflow
1. **INVESTIGATE**:
   Olvasd be a GalleryComponent-et és kapcsolódó service-eket.
   Keresd meg:
   - Subscription-öket takeUntil nélkül
   - Event listener-eket cleanup nélkül
   - setInterval/setTimeout clear nélkül

2. **IMPLEMENT**:
   Javítsd a talált problémákat a cleanup pattern szerint:
   ```typescript
   private destroy$ = new Subject<void>();

   ngOnDestroy() {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

3. **REVIEW** (subagent):
   "Ellenőrizd hogy minden subscription cleanup-olva van:
    - takeUntil pattern használva?
    - Subject-ek complete()-elve?
    - Listener-ek eltávolítva?"

## Tesztelés
- DevTools Memory tab: heap snapshot összehasonlítás
- Galéria váltás 10x → memória ne nőjön
```

---

## ♻️ Workflow #3: Refactor

**Példa:** "PhotoService túl nagy (450 sor)"

### Prompt
```markdown
# Refactor: PhotoService Szétbontás

## Probléma
A photo.service.ts 450 soros, túl sok felelősséget kezel:
- Fotó CRUD
- Thumbnail generálás
- Selection kezelés
- Export

## Workflow
1. **ANALYZE** (subagent):
   "Elemezd a photo.service.ts-t:
    - Milyen felelősségi körök vannak?
    - Mi tartozik össze?
    - Mi bontható külön?"

2. **ARCHITECT**:
   A subagent elemzése alapján tervezd meg az új struktúrát:
   - PhotoCrudService (CRUD műveletek)
   - ThumbnailService (thumbnail generálás)
   - PhotoSelectionService (selection state)
   - PhotoExportService (export funkciók)

3. **IMPLEMENT**:
   Bontsd szét lépésről lépésre:
   1. Hozd létre az új service-eket
   2. Mozgasd át a logikát
   3. Frissítsd az importokat a komponensekben
   4. Töröld a felesleges kódot az eredetiből

4. **REVIEW** (subagent):
   "Ellenőrizd:
    - Minden funkcionalitás megmaradt?
    - Nincs duplikált kód?
    - Circular dependency?"

5. **PERFORMANCE** (subagent):
   "Ellenőrizd:
    - Bundle size nem nőtt?
    - Lazy loading működik?"

## Elfogadási kritériumok
- [ ] Minden service < 200 sor
- [ ] Nincs functionality loss
- [ ] Tesztek továbbra is zöldek
- [ ] Nincs circular dependency
```

---

## 🔒 Workflow #4: Security Hardening

**Példa:** "IPC handler-ek security audit"

### Prompt
```markdown
# Security Audit: IPC Handlers

## Cél
Minden IPC handler átfogó security review-ja és javítása.

## Workflow
1. **INVENTORY**:
   Listázd az összes IPC handler-t az electron/main.ts-ben

2. **SECURITY AUDIT** (subagent):
   "Minden handler-re ellenőrizd:
    - Input típus validáció
    - Input méret limit
    - Whitelist vs blacklist approach
    - Error message nem leak-el infót
    - Rate limiting szükséges?"

3. **IMPLEMENT**:
   Javítsd a talált problémákat.
   Minta:
   ```typescript
   ipcMain.handle('action', async (_event, params) => {
     // 1. Típus validáció
     if (!isValidParams(params)) {
       return { success: false, error: 'Invalid input' };
     }

     // 2. Méret limit
     if (JSON.stringify(params).length > 10000) {
       return { success: false, error: 'Payload too large' };
     }

     // 3. Implementáció try/catch
     try {
       // ...
     } catch (error) {
       log.error('Action failed:', error);
       // NE küldd ki a teljes error-t!
       return { success: false, error: 'Operation failed' };
     }
   });
   ```

4. **VERIFY** (subagent):
   "Újra review-zd: minden handler megfelelő-e most?"
```

---

## ⚡ Workflow #5: Performance Optimization

**Példa:** "Dashboard lassú (3s+ load)"

### Prompt
```markdown
# Performance: Dashboard Optimization

## Probléma
Dashboard 3+ másodpercig tölt, különösen sok projekttel.

## Workflow
1. **MEASURE**:
   - Chrome DevTools Performance tab
   - Lighthouse audit
   - Bundle analyzer

2. **ANALYZE** (subagent):
   "Elemezd a DashboardComponent-et:
    - Hány API hívás van?
    - Van nagy lista virtualizálás nélkül?
    - Change detection stratégia?
    - Felesleges import-ok?"

3. **ARCHITECT**:
   Tervezd meg az optimalizálást:
   - Lazy loading
   - Virtual scrolling
   - Caching stratégia
   - Code splitting

4. **IMPLEMENT**:
   Prioritás szerint:
   1. OnPush change detection
   2. trackBy ngFor-oknál
   3. Virtual scrolling projektlistához
   4. API response caching
   5. Skeleton loading

5. **VERIFY** (subagent):
   "Mérd újra:
    - Initial load time
    - Time to interactive
    - Bundle size változás"

## Cél metrikák
- Initial load: < 1.5s
- Time to interactive: < 2s
- Bundle size: < 2MB
```

---

## 📱 Workflow #6: Cross-Platform Feature

**Példa:** "Push notification minden platformon"

### Prompt
```markdown
# Cross-Platform: Push Notifications

## Cél
Push notification támogatás: Web, Electron, iOS, Android

## Workflow
1. **ARCHITECT**:
   Tervezd meg a platform-agnosztikus megoldást:
   ```
   NotificationService (abstract)
   ├── WebNotificationService
   ├── ElectronNotificationService
   ├── IOSNotificationService
   └── AndroidNotificationService
   ```

2. **IMPLEMENT** - Platform specifikus:

   **Web:**
   - Service Worker registration
   - Web Push API

   **Electron:**
   - Electron Notification API (már megvan)
   - Badge count (macOS)

   **iOS (Capacitor):**
   - @capacitor/push-notifications
   - APNs konfiguráció

   **Android (Capacitor):**
   - Firebase Cloud Messaging

3. **IMPLEMENT** - Unified Service:
   ```typescript
   @Injectable()
   export class NotificationService {
     constructor(
       private electronService: ElectronService,
       private platform: Platform
     ) {}

     async show(title: string, body: string) {
       if (this.electronService.isElectron) {
         return this.electronService.showNotification(title, body);
       }
       if (Capacitor.isNativePlatform()) {
         return this.showNativeNotification(title, body);
       }
       return this.showWebNotification(title, body);
     }
   }
   ```

4. **REVIEW** (subagent):
   "Ellenőrizd:
    - Minden platform kezelve?
    - Graceful fallback?
    - Permission handling?"
```

---

## 🔄 Workflow Template: Copy & Customize

```markdown
# [Workflow Típus]: [Feladat Neve]

## Leírás
[Mi a feladat/probléma?]

## Érintett fájlok
- [file1.ts]
- [file2.ts]

## Workflow
1. **[FÁZIS 1]**: [Leírás]
2. **[FÁZIS 2]**: [Leírás]
3. **REVIEW** (subagent): "[Review instrukciók]"
4. **[SECURITY/PERFORMANCE]** (subagent, ha kell): "[Instrukciók]"

## Elfogadási kritériumok
- [ ] [Kritérium 1]
- [ ] [Kritérium 2]

## Tesztelés
[Hogyan teszteljük?]
```

---

## ⏱️ Időbecslés Sablon

| Fázis | AI idő | Review |
|-------|--------|--------|
| Architect | 5-10 min | - |
| Implement | 15-30 min | - |
| Review subagent | 5 min | - |
| Fix review issues | 10-15 min | - |
| Security/Perf (ha kell) | 5-10 min | - |
| **Összesen** | **40-70 min** | **Beírható: 2-3 óra** |
