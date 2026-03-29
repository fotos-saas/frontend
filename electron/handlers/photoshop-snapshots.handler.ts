/**
 * Photoshop snapshot CRUD IPC handlers
 *
 * Handlers:
 *   photoshop:backup-psd, load-snapshot, rename-snapshot, delete-snapshot
 */

import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';

export function registerSnapshotHandlers(): void {
  // Backup PSD file (meglévő PSD + layouts/ mappa másolása _backup_YYYYMMDD_HHmmss suffixszel)
  ipcMain.handle('photoshop:backup-psd', (_event, params: { psdPath: string }) => {
    try {
      if (typeof params.psdPath !== 'string' || params.psdPath.length > 500) {
        return { success: false, error: 'Érvénytelen paraméter' };
      }
      if (params.psdPath.includes('..')) {
        return { success: false, error: 'Path traversal nem megengedett' };
      }
      if (!fs.existsSync(params.psdPath)) {
        return { success: false, error: 'A PSD fájl nem létezik' };
      }

      const psdDir = path.dirname(params.psdPath);
      const psdBase = path.basename(params.psdPath, '.psd');
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const backupName = `${psdBase}_backup_${timestamp}.psd`;
      const backupPath = path.join(psdDir, backupName);

      // PSD fájl másolása
      fs.copyFileSync(params.psdPath, backupPath);
      log.info(`PSD backup keszult: ${backupPath}`);

      // layouts/ mappa másolása ha létezik
      const layoutsDir = path.join(psdDir, 'layouts');
      if (fs.existsSync(layoutsDir)) {
        const backupLayoutsDir = path.join(psdDir, `layouts_backup_${timestamp}`);
        fs.mkdirSync(backupLayoutsDir, { recursive: true });
        const files = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          fs.copyFileSync(path.join(layoutsDir, file), path.join(backupLayoutsDir, file));
        }
        log.info(`Layouts backup keszult: ${backupLayoutsDir} (${files.length} fajl)`);
      }

      return { success: true, backupPath };
    } catch (error) {
      log.error('PSD backup hiba:', error);
      return { success: false, error: 'Backup készítés sikertelen' };
    }
  });

  // Load snapshot JSON content
  ipcMain.handle('photoshop:load-snapshot', (_event, params: { snapshotPath: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok olvashatoak' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat olvasunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok olvashatoak' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      const content = fs.readFileSync(params.snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      log.info(`Snapshot betoltve: ${params.snapshotPath}`);

      return { success: true, data };
    } catch (error) {
      log.error('Snapshot betoltesi hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a snapshot-ot' };
    }
  });

  // Rename snapshot (snapshotName mezo frissitese a JSON-ben)
  ipcMain.handle('photoshop:rename-snapshot', (_event, params: { snapshotPath: string; newName: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (typeof params.newName !== 'string' || params.newName.trim().length === 0 || params.newName.length > 200) {
        return { success: false, error: 'Ervenytelen nev' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok modosithatoak' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat modositunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok modosithatoak' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      const content = fs.readFileSync(params.snapshotPath, 'utf-8');
      const data = JSON.parse(content);
      data.snapshotName = params.newName.trim();

      fs.writeFileSync(params.snapshotPath, JSON.stringify(data, null, 2), 'utf-8');
      log.info(`Snapshot atnevezve: ${params.snapshotPath} → "${params.newName.trim()}"`);

      return { success: true };
    } catch (error) {
      log.error('Snapshot atnevezesi hiba:', error);
      return { success: false, error: 'Nem sikerult atnevezni a snapshot-ot' };
    }
  });

  // Delete snapshot from layouts/ folder
  ipcMain.handle('photoshop:delete-snapshot', (_event, params: { snapshotPath: string }) => {
    try {
      if (typeof params.snapshotPath !== 'string' || params.snapshotPath.length > 500) {
        return { success: false, error: 'Ervenytelen snapshot eleresi ut' };
      }
      if (params.snapshotPath.includes('..')) {
        return { success: false, error: 'Ervenytelen utvonal' };
      }
      if (!params.snapshotPath.endsWith('.json')) {
        return { success: false, error: 'Csak JSON fajlok torolhetok' };
      }

      // Biztonsag: csak layouts/ mappaban levo fajlokat torlunk
      const dirName = path.basename(path.dirname(params.snapshotPath));
      if (dirName !== 'layouts') {
        return { success: false, error: 'Csak a layouts/ mappaban levo fajlok torolhetok' };
      }

      if (!fs.existsSync(params.snapshotPath)) {
        return { success: false, error: 'A snapshot fajl nem talalhato' };
      }

      fs.unlinkSync(params.snapshotPath);
      log.info(`Snapshot torolve: ${params.snapshotPath}`);

      return { success: true };
    } catch (error) {
      log.error('Snapshot torlesi hiba:', error);
      return { success: false, error: 'Nem sikerult torolni a snapshot-ot' };
    }
  });
}
