/**
 * Photoshop template system IPC handlers
 *
 * Handlers:
 *   photoshop:save-template, list-templates, load-template,
 *   delete-template, rename-template, apply-template
 */

import { ipcMain, app } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';
import log from 'electron-log/main';
import { JsxRunnerService, PhotoshopSchema } from '../services/jsx-runner.service';
import { GlobalTemplate, TemplateStoreSchema } from './photoshop-utils';

export function registerTemplateHandlers(psStore: Store<PhotoshopSchema>, jsxRunner: JsxRunnerService): void {
  const templateStore = new Store<TemplateStoreSchema>({
    name: 'photostack-templates',
    defaults: {
      globalTemplates: [],
    },
  });

  // Save template
  ipcMain.handle('photoshop:save-template', (_event, params: { templateData: GlobalTemplate }) => {
    try {
      if (!params.templateData || !params.templateData.id) {
        return { success: false, error: 'Ervenytelen sablon adat' };
      }

      const templates = templateStore.get('globalTemplates', []);
      // Feluliras ha mar letezik azonos ID-val
      const idx = templates.findIndex(t => t.id === params.templateData.id);
      if (idx >= 0) {
        templates[idx] = params.templateData;
      } else {
        templates.push(params.templateData);
      }
      templateStore.set('globalTemplates', templates);
      log.info(`Sablon mentve: ${params.templateData.templateName} (${params.templateData.id})`);
      return { success: true };
    } catch (error) {
      log.error('Sablon mentes hiba:', error);
      return { success: false, error: 'Nem sikerult menteni a sablont' };
    }
  });

  // List templates (rovid osszefoglalo)
  ipcMain.handle('photoshop:list-templates', () => {
    try {
      const templates = templateStore.get('globalTemplates', []);
      const list = templates.map(t => ({
        id: t.id,
        templateName: t.templateName,
        createdAt: t.createdAt,
        studentSlotCount: t.studentSlots?.length || 0,
        teacherSlotCount: t.teacherSlots?.length || 0,
        boardWidthCm: t.board?.widthCm || 0,
        boardHeightCm: t.board?.heightCm || 0,
        sourceDocName: t.source?.documentName || '',
      }));
      // Legujabb elol
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { success: true, templates: list };
    } catch (error) {
      log.error('Sablon lista hiba:', error);
      return { success: false, error: 'Nem sikerult beolvasni a sablon listat', templates: [] };
    }
  });

  // Load template (teljes JSON)
  ipcMain.handle('photoshop:load-template', (_event, params: { templateId: string }) => {
    try {
      if (typeof params.templateId !== 'string' || params.templateId.length > 100) {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      return { success: true, data: tmpl };
    } catch (error) {
      log.error('Sablon betoltes hiba:', error);
      return { success: false, error: 'Nem sikerult betolteni a sablont' };
    }
  });

  // Delete template
  ipcMain.handle('photoshop:delete-template', (_event, params: { templateId: string }) => {
    try {
      if (typeof params.templateId !== 'string') {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const filtered = templates.filter(t => t.id !== params.templateId);
      if (filtered.length === templates.length) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      templateStore.set('globalTemplates', filtered);
      log.info(`Sablon torolve: ${params.templateId}`);
      return { success: true };
    } catch (error) {
      log.error('Sablon torles hiba:', error);
      return { success: false, error: 'Nem sikerult torolni a sablont' };
    }
  });

  // Rename template
  ipcMain.handle('photoshop:rename-template', (_event, params: { templateId: string; newName: string }) => {
    try {
      if (typeof params.templateId !== 'string' || typeof params.newName !== 'string') {
        return { success: false, error: 'Ervenytelen parameterek' };
      }
      if (params.newName.trim().length === 0 || params.newName.length > 200) {
        return { success: false, error: 'Ervenytelen nev' };
      }
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }
      tmpl.templateName = params.newName.trim();
      templateStore.set('globalTemplates', templates);
      log.info(`Sablon atnevezve: ${params.templateId} → "${params.newName.trim()}"`);
      return { success: true };
    } catch (error) {
      log.error('Sablon atnevezes hiba:', error);
      return { success: false, error: 'Nem sikerult atnevezni a sablont' };
    }
  });

  // Apply template — pozíciók kiszámítása + JSX futtatás
  ipcMain.handle('photoshop:apply-template', async (_event, params: { templateId: string; targetDocName?: string; psdFilePath?: string }) => {
    try {
      if (typeof params.templateId !== 'string') {
        return { success: false, error: 'Ervenytelen sablon azonosito' };
      }

      // 1. Sablon betoltese
      const templates = templateStore.get('globalTemplates', []);
      const tmpl = templates.find(t => t.id === params.templateId);
      if (!tmpl) {
        return { success: false, error: 'A sablon nem talalhato' };
      }

      // 2. Jelenlegi dokumentum layout kiolvasasa
      const readJsxPath = jsxRunner.resolveJsxPath('actions/read-layout.jsx');
      if (!fs.existsSync(readJsxPath)) {
        return { success: false, error: 'read-layout.jsx nem talalhato' };
      }

      const readJsxCode = jsxRunner.buildJsxScript('actions/read-layout.jsx', undefined, params.targetDocName, params.psdFilePath);

      if (process.platform !== 'darwin') {
        return { success: false, error: 'JSX futtatás csak macOS-en támogatott' };
      }

      // Temp JSX fajl
      const tempReadJsxPath = path.join(app.getPath('temp'), `jsx-read-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempReadJsxPath, readJsxCode, 'utf-8');

      const readAppleScript = jsxRunner.buildFocusPreservingAppleScript(tempReadJsxPath);

      const readOutput = await new Promise<string>((resolve, reject) => {
        execFile('osascript', ['-e', readAppleScript], { timeout: 30000 }, (error, stdout, stderr) => {
          try { fs.unlinkSync(tempReadJsxPath); } catch (_) { /* ignore */ }
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout || '');
        });
      });

      // Parse layout
      const jsonPrefix = '__LAYOUT_JSON__';
      const jsonStart = readOutput.indexOf(jsonPrefix);
      if (jsonStart === -1) {
        return { success: false, error: 'Nem sikerult kiolvasni a dokumentum layoutjat' };
      }

      const jsonStr = readOutput.substring(jsonStart + jsonPrefix.length).trim();
      let currentLayout: {
        document: { name: string; widthPx: number; heightPx: number; dpi: number };
        layers: Array<{ layerId: number; layerName: string; groupPath: string[]; x: number; y: number; width: number; height: number; kind: string; justification?: string }>;
      };

      try {
        currentLayout = JSON.parse(jsonStr);
      } catch {
        return { success: false, error: 'Layout JSON parse hiba' };
      }

      // 3. Jelenlegi layerek csoportositasa
      const currentStudentImages: typeof currentLayout.layers = [];
      const currentTeacherImages: typeof currentLayout.layers = [];
      const currentStudentNames: typeof currentLayout.layers = [];
      const currentTeacherNames: typeof currentLayout.layers = [];

      for (const l of currentLayout.layers) {
        const gp = l.groupPath;
        if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Students') {
          currentStudentImages.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Images' && gp[1] === 'Teachers') {
          currentTeacherImages.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Students') {
          currentStudentNames.push(l);
        } else if (gp.length >= 2 && gp[0] === 'Names' && gp[1] === 'Teachers') {
          currentTeacherNames.push(l);
        }
      }

      // 4. DPI skalazas faktor
      const docDpi = currentLayout.document.dpi || 200;
      const templateDpi = tmpl.source.dpi || 200;
      const dpiScale = docDpi / templateDpi;

      // 5. Mozgatasok osszeallitasa
      const moves: Array<{ layerName: string; groupPath: string[]; targetX: number; targetY: number; justification?: string }> = [];

      const templateRef = tmpl;
      const nameSettings = templateRef.nameSettings;

      // Slot parositas + mozgatas epitese
      function buildMoves(
        slots: GlobalTemplate['studentSlots'],
        images: typeof currentStudentImages,
        names: typeof currentStudentNames,
        imgGroupPath: string[],
        nameGroupPath: string[],
        boardConfig: GlobalTemplate['board'],
      ) {
        for (let i = 0; i < images.length; i++) {
          if (i < slots.length) {
            // Sablon slot-ra mozgatas
            const slot = slots[i];
            moves.push({
              layerName: images[i].layerName,
              groupPath: imgGroupPath,
              targetX: Math.round(slot.image.x * dpiScale),
              targetY: Math.round(slot.image.y * dpiScale),
            });

            // Nev layer mozgatasa (ha van)
            if (i < names.length && slot.name) {
              moves.push({
                layerName: names[i].layerName,
                groupPath: nameGroupPath,
                targetX: Math.round(slot.name.x * dpiScale),
                targetY: Math.round(slot.name.y * dpiScale),
                justification: slot.name.justification,
              });
            }
          } else {
            // Overflow — uj grid poziciok szamitasa
            const overflowIdx = i - slots.length;
            if (slots.length === 0) continue;

            const refSlot = slots[0];
            const photoW = Math.round(refSlot.image.width * dpiScale);
            const photoH = Math.round(refSlot.image.height * dpiScale);
            const marginPx = Math.round((boardConfig.marginCm / 2.54) * docDpi);
            const gapHPx = Math.round((boardConfig.gapHCm / 2.54) * docDpi);
            const gapVPx = Math.round((boardConfig.gapVCm / 2.54) * docDpi);
            const boardWidthPx = currentLayout.document.widthPx;

            const columns = Math.max(1, Math.floor((boardWidthPx - 2 * marginPx + gapHPx) / (photoW + gapHPx)));

            // Az utolso slot sor utani pozicio
            const lastSlot = slots[slots.length - 1];
            const lastRowY = Math.round(lastSlot.image.y * dpiScale);
            const nameGapPx = Math.round((nameSettings.nameGapCm / 2.54) * docDpi);
            const nameHeight = lastSlot.name ? Math.round(lastSlot.name.height * dpiScale) : 0;
            const startY = lastRowY + photoH + nameGapPx + nameHeight + gapVPx;

            const col = overflowIdx % columns;
            const row = Math.floor(overflowIdx / columns);
            const overflowX = marginPx + col * (photoW + gapHPx);
            const overflowY = startY + row * (photoH + nameGapPx + nameHeight + gapVPx);

            moves.push({
              layerName: images[i].layerName,
              groupPath: imgGroupPath,
              targetX: overflowX,
              targetY: overflowY,
            });

            // Nev layer overflow
            if (i < names.length) {
              moves.push({
                layerName: names[i].layerName,
                groupPath: nameGroupPath,
                targetX: overflowX,
                targetY: overflowY + photoH + nameGapPx,
                justification: nameSettings.textAlign || 'center',
              });
            }
          }
        }
      }

      buildMoves(templateRef.studentSlots, currentStudentImages, currentStudentNames, ['Images', 'Students'], ['Names', 'Students'], templateRef.board);
      buildMoves(templateRef.teacherSlots, currentTeacherImages, currentTeacherNames, ['Images', 'Teachers'], ['Names', 'Teachers'], templateRef.board);

      if (moves.length === 0) {
        return { success: true, output: 'Nincs mozgatando layer' };
      }

      log.info(`Sablon alkalmazas: ${moves.length} mozgatas (dpiScale: ${dpiScale.toFixed(2)})`);

      // 6. apply-template.jsx futtatasa
      const tempJsonPath = path.join(app.getPath('temp'), `jsx-tmpl-moves-${Date.now()}.json`);
      fs.writeFileSync(tempJsonPath, JSON.stringify({ moves }), 'utf-8');

      const applyJsxCode = jsxRunner.buildJsxScript('actions/apply-template.jsx', tempJsonPath, params.targetDocName, params.psdFilePath);
      const tempApplyJsxPath = path.join(app.getPath('temp'), `jsx-apply-tmpl-${Date.now()}.jsx`);
      fs.writeFileSync(tempApplyJsxPath, applyJsxCode, 'utf-8');

      const applyAppleScript = jsxRunner.buildFocusPreservingAppleScript(tempApplyJsxPath);

      const applyOutput = await new Promise<string>((resolve, reject) => {
        execFile('osascript', ['-e', applyAppleScript], { timeout: 300000 }, (error, stdout, stderr) => {
          try { fs.unlinkSync(tempApplyJsxPath); } catch (_) { /* ignore */ }
          try { fs.unlinkSync(tempJsonPath); } catch (_) { /* ignore */ }
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout || '');
        });
      });

      log.info('Sablon alkalmazas kesz');
      return { success: true, output: applyOutput };
    } catch (error) {
      log.error('Sablon alkalmazas hiba:', error);
      const errMsg = error instanceof Error ? error.message : 'Ismeretlen hiba';
      return { success: false, error: errMsg };
    }
  });
}
