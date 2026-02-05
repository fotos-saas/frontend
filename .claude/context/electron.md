# 🖥️ Electron Context

> Töltsd be ezt ha Electron-specifikus feladaton dolgozol.

## Fő Fájlok

| Fájl | Leírás |
|------|--------|
| `electron/main.ts` | Main process, IPC handlerek |
| `electron/preload.ts` | Context bridge, API exposure |
| `src/app/core/services/electron.service.ts` | Angular service az Electron API-hoz |

## IPC Handler Sablon

```typescript
ipcMain.handle('handler-name', async (_event, params: ParamsType) => {
  // 1. Típus validáció
  if (typeof params.key !== 'string') {
    return { success: false, error: 'Invalid params' };
  }

  // 2. Méret/hossz limit
  if (params.key.length > 100) {
    return { success: false, error: 'Key too long' };
  }

  // 3. try/catch + logging
  try {
    const result = await doSomething(params);
    return { success: true, data: result };
  } catch (error) {
    log.error('Handler failed:', error);
    captureMainException(error);
    return { success: false, error: 'Operation failed' };
  }
});
```

## Preload Sablon

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  newFunction: (params: ParamsType) => ipcRenderer.invoke('handler-name', params),
});
```

## Angular Service Használat

```typescript
// Platform check
if (this.electronService.isElectron) {
  // Desktop-only kód
}

// Cleanup pattern
this.electronService.someObservable$
  .pipe(takeUntil(this.destroy$))
  .subscribe(value => this.handleValue(value));
```

## Security Checklist

- [ ] `nodeIntegration: false`
- [ ] `contextIsolation: true`
- [ ] `sandbox: true`
- [ ] Input validation minden IPC handler-ben
- [ ] Error message nem leak-el belső infót
- [ ] `ALLOWED_ORIGINS` whitelist navigation-höz

## Gyakori IPC Handlerek

| Handler | Leírás |
|---------|--------|
| `get-dark-mode` | System dark mode lekérése |
| `show-notification` | Native notification |
| `set-badge` | Dock badge (macOS) |
| `store-get/set/delete` | Secure storage (keytar) |
| `check-for-updates` | Auto-updater |

