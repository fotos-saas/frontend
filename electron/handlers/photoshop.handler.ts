/**
 * Photoshop IPC handler — orchestrator
 *
 * Thin entry point that creates shared instances (psStore, jsxRunner)
 * and delegates to sub-handlers. Each sub-handler registers its own
 * ipcMain.handle calls.
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log/main';
import { JsxRunnerService, PhotoshopSchema } from '../services/jsx-runner.service';
import { registerConfigHandlers } from './photoshop-config.handler';
import { registerProjectHandlers } from './photoshop-project.handler';
import { registerSnapshotHandlers } from './photoshop-snapshots.handler';
import { registerTemplateHandlers } from './photoshop-templates.handler';
import { registerPhotoHandlers } from './photoshop-photos.handler';
import { registerGenerationHandlers } from './photoshop-generation.handler';

export const psStore = new Store<PhotoshopSchema>({
  name: 'photostack-photoshop',
  defaults: {
    photoshopPath: null,
    workDirectory: null,
    tabloMarginCm: 2,
    tabloStudentSizeCm: 6,
    tabloTeacherSizeCm: 6,
    tabloGapHCm: 2,
    tabloGapVCm: 3,
    tabloNameGapCm: 0.5,
    tabloNameBreakAfter: 1,
    tabloTextAlign: 'center',
    tabloGridAlign: 'center',
    tabloPositionGapCm: 0.15,
    tabloPositionFontSize: 18,
  },
});

// JsxRunnerService instance — exportálva a background mód számára is
export const jsxRunner = new JsxRunnerService(psStore);

export function registerPhotoshopHandlers(mainWindow: BrowserWindow): void {
  registerConfigHandlers(psStore, jsxRunner);
  registerProjectHandlers(psStore);
  registerSnapshotHandlers();
  registerTemplateHandlers(psStore, jsxRunner);
  registerPhotoHandlers(psStore, jsxRunner);
  registerGenerationHandlers(mainWindow, jsxRunner);

  log.info('Photoshop IPC handlerek regisztralva');
}
