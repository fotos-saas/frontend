import { contextBridge } from 'electron';
import { buildCoreApi } from './preload-core';
import { buildPhotoshopApi } from './preload-photoshop';
import { buildOverlayApi } from './preload-overlay';
import { buildProcessingApi } from './preload-processing';
import { buildSyncApi } from './preload-sync';

// Sentry DSN es app verzio atadasa a renderer process-nek (window objektumon keresztul)
// Ez a Sentry inicializalashoz szukseges
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';

// Expose Sentry DSN to window object for renderer initialization
contextBridge.exposeInMainWorld('SENTRY_DSN', SENTRY_DSN);

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  ...buildCoreApi(),
  ...buildPhotoshopApi(),
  ...buildOverlayApi(),
  ...buildProcessingApi(),
  ...buildSyncApi(),
});

// TypeScript type declaration is in electron.service.ts to avoid duplication
