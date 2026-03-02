/**
 * Crop IPC handler regisztráció — a tényleges handlerek szét vannak bontva:
 * - crop-detection.handler.ts: Python MediaPipe Face Mesh (check, detect, batch)
 * - crop-execution.handler.ts: Sharp vágás, letöltés, temp kezelés
 * - crop-utils.ts: Közös segédfunkciók
 */
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import log from 'electron-log/main';
import { TEMP_DIR_NAME, cleanupOldTempFiles } from './crop-utils';
import { registerCropDetectionHandlers } from './crop-detection.handler';
import { registerCropExecutionHandlers } from './crop-execution.handler';

export function registerCropHandlers(): void {
  // Induláskori régi temp fájlok törlése
  cleanupOldTempFiles();

  // Kilépéskori cleanup
  app.on('will-quit', () => {
    const cropTmpDir = path.join(os.tmpdir(), TEMP_DIR_NAME);
    try { fs.rmSync(cropTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  // Python detektálás handlerek
  registerCropDetectionHandlers();

  // Sharp vágás + fájl kezelés handlerek
  registerCropExecutionHandlers();

  log.info('Crop IPC handlerek regisztralva');
}
