import { Injectable, inject, signal } from '@angular/core';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { PartnerProjectDetails } from '../../services/partner.service';

export interface DebugLogEntry {
  time: string;
  step: string;
  detail: string;
  status: 'ok' | 'warn' | 'error' | 'info';
}

/**
 * Debug logika a tablószerkesztőhöz.
 * Kiemelt service a komponens méretcsökkentéséhez (max 300 sor).
 */
@Injectable()
export class TabloEditorDebugService {
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);

  readonly debugLogs = signal<DebugLogEntry[]>([]);

  addLog(step: string, detail: string, status: DebugLogEntry['status'] = 'info'): void {
    const time = new Date().toLocaleTimeString('hu-HU', { hour12: false });
    this.debugLogs.update(logs => [...logs, { time, step, detail, status }]);
  }

  clearLogs(): void {
    this.debugLogs.set([]);
  }

  /**
   * PSD generálás debug módban — streaming logokkal.
   * MEGJEGYZÉS: Név/Kép/Grid kikommentezve — subtitle tesztelés.
   */
  async runDebugGeneration(params: {
    size: TabloSize;
    project: PartnerProjectDetails | null;
    persons: TabloPersonItem[];
  }): Promise<void> {
    this.clearLogs();
    const { size, project: p, persons: allPersons } = params;

    // 1. Méret
    const dims = this.ps.parseSizeValue(size.value);
    if (dims) {
      this.addLog('Méret', `${size.label} (${size.value}) → ${dims.widthCm}×${dims.heightCm} cm`, 'ok');
    } else {
      this.addLog('Méret', `Érvénytelen: ${size.value}`, 'error');
      return;
    }

    // 2. Projekt
    if (p) {
      this.addLog('Projekt', `${p.name} / ${p.className || '–'}  (id: ${p.id})`, 'ok');
    } else {
      this.addLog('Projekt', 'Nincs projekt betöltve!', 'error');
    }

    // 3. WorkDir
    const workDir = this.ps.workDir();
    if (workDir) {
      this.addLog('WorkDir', workDir, 'ok');
    } else {
      this.addLog('WorkDir', 'Nincs beállítva — Downloads mappába generál', 'warn');
    }

    // 4. Személyek
    const students = allPersons.filter(pe => pe.type === 'student');
    const teachers = allPersons.filter(pe => pe.type === 'teacher');
    if (allPersons.length > 0) {
      const names = allPersons.slice(0, 3).map(pe => pe.name).join(', ');
      const suffix = allPersons.length > 3 ? ` …+${allPersons.length - 3}` : '';
      this.addLog('Személyek betöltve', `${allPersons.length} fő (${students.length} diák, ${teachers.length} tanár) — ${names}${suffix}`, 'ok');
    } else {
      this.addLog('Személyek betöltve', '0 fő — ÜRES!', 'warn');
    }

    // 5. Persons tömb (photoUrl-lel a fotó letöltéshez)
    const personsData = allPersons.map(person => ({
      id: person.id,
      name: person.name,
      type: person.type,
      photoUrl: person.photoUrl,
    }));
    const withPhoto = allPersons.filter(p => p.photoUrl).length;
    this.addLog('Persons tömb', `length=${personsData.length}, fotóval: ${withPhoto} | ${JSON.stringify(personsData.slice(0, 2))}${personsData.length > 2 ? '…' : ''}`, 'info');

    // 6. Output path kiszámítása
    const brandName = this.branding.brandName();
    const partnerDir = brandName ? this.ps.sanitizeName(brandName) : 'photostack';
    const year = new Date().getFullYear().toString();
    let outputPath: string;
    const api = (window as any).electronAPI?.photoshop;
    if (!api) {
      this.addLog('Electron API', 'Nem elérhető! (böngészőben futunk?)', 'error');
      return;
    }
    this.addLog('Electron API', 'Elérhető', 'ok');

    if (p && workDir) {
      const folderName = this.ps.sanitizeName(
        p.className ? `${p.name}-${p.className}` : p.name,
      );
      outputPath = `${workDir}/${partnerDir}/${year}/${folderName}/${folderName}.psd`;
    } else {
      const dl = await api.getDownloadsPath();
      outputPath = `${dl}/PhotoStack/${size.value}.psd`;
    }
    this.addLog('Output path', outputPath, 'info');

    // 7. IPC params
    const ipcParams: any = {
      widthCm: dims.widthCm,
      heightCm: dims.heightCm,
      dpi: 200,
      mode: 'RGB',
      outputPath,
      persons: personsData.length > 0 ? personsData : undefined,
    };
    this.addLog('IPC params', `widthCm=${ipcParams.widthCm}, heightCm=${ipcParams.heightCm}, dpi=${ipcParams.dpi}, persons=${personsData.length}`, 'info');

    // 8. PSD streaming debug
    const unsubscribe = api.onPsdDebugLog?.((data: { line: string; stream: 'stdout' | 'stderr' }) => {
      if (data.stream === 'stderr') {
        this.addLog('Python stderr', data.line, 'error');
      } else if (data.line.startsWith('[DEBUG]')) {
        const msg = data.line.replace('[DEBUG] ', '');
        this.addLog('Python', msg, msg.startsWith('HIBA') ? 'error' : 'info');
      } else {
        this.addLog('Python', data.line, 'info');
      }
    });

    // 9. PSD generálás
    this.addLog('IPC generatePsd', 'Hívás indítva...', 'info');
    let genResult: any;
    try {
      genResult = await api.generatePsdDebug(ipcParams);
    } catch (ipcErr) {
      this.addLog('IPC generatePsd', `EXCEPTION: ${String(ipcErr)}`, 'error');
      unsubscribe?.();
      return;
    }
    unsubscribe?.();

    this.addLog('IPC generatePsd', genResult.success ? 'Sikeres' : `HIBA: ${genResult.error}`, genResult.success ? 'ok' : 'error');

    // 10. PSD megnyitás + HARDCODE Subtitle teszt
    if (genResult.success) {
      await this.runJsxDebugPhase(api, outputPath, personsData, size);
    }

    // Végeredmény
    if (genResult.success) {
      this.addLog('Végeredmény', `PSD sikeresen generálva: ${outputPath}`, 'ok');
    } else {
      this.addLog('Végeredmény', 'PSD generálás sikertelen — lásd fenti hibákat', 'error');
    }
  }

  /** JSX text layerek hozzáadása debug logokkal */
  private async runJsxDebugPhase(
    api: any,
    outputPath: string,
    personsData: Array<{ id: number; name: string; type: string; photoUrl?: string | null }>,
    size?: TabloSize,
  ): Promise<void> {
    this.addLog('PSD megnyitás', 'Fájl megnyitása Photoshopban...', 'info');
    try {
      const openResult = await api.openFile(outputPath);
      this.addLog('PSD megnyitás', openResult.success ? 'Sikeres' : `HIBA: ${openResult.error}`, openResult.success ? 'ok' : 'error');

      if (!openResult.success) return;

      this.addLog('JSX', 'Várakozás Photoshop-ra (2s)...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PSD fajlnev a cel dokumentum aktivalasahoz
      const psdFileName = outputPath.split('/').pop() || undefined;

      // Margó guide-ok hozzáadása
      const marginCm = this.ps.marginCm();
      if (marginCm > 0) {
        this.addLog('Guide-ok', `Margó guide-ok hozzáadása (${marginCm} cm)...`, 'info');
        try {
          const guideResult = await api.runJsxDebug({
            scriptName: 'actions/add-guides.jsx',
            jsonData: { marginCm },
            targetDocName: psdFileName,
          });
          this.addLog('Guide-ok', guideResult.success ? '4 guide hozzáadva' : `HIBA: ${guideResult.error}`, guideResult.success ? 'ok' : 'error');
        } catch (guideErr) {
          this.addLog('Guide-ok', `EXCEPTION: ${String(guideErr)}`, 'error');
        }
      }

      // HARDCODE Felirat layerek — teszt szöveggel
      this.addLog('Feliratok', '3 hardcode felirat hozzáadása...', 'info');
      try {
        const subResult = await api.runJsxDebug({
          scriptName: 'actions/add-subtitle-layers.jsx',
          jsonData: {
            subtitles: [
              { layerName: 'iskola-neve', displayText: 'Teszt Iskola Neve' },
              { layerName: 'osztaly', displayText: '12.D' },
              { layerName: 'evfolyam', displayText: '2022 – 2026' },
            ],
          },
          targetDocName: psdFileName,
        });
        this.addLog('Feliratok', subResult.success ? 'Felirat layerek hozzáadva' : `HIBA: ${subResult.error}`, subResult.success ? 'ok' : 'error');
      } catch (subErr) {
        this.addLog('Feliratok', `EXCEPTION: ${String(subErr)}`, 'error');
      }

      // // NÉV LAYEREK — KIKOMMENTEZVE
      // const jsxUnsubscribe = api.onJsxDebugLog?.(...);
      // this.addLog('JSX', `Név layerek hozzáadása (${personsData.length} fő)...`, 'info');
      // ...

      // // IMAGE LAYEREK — KIKOMMENTEZVE
      // ...

      // // GRID — KIKOMMENTEZVE
      // ...

    } catch (openErr) {
      this.addLog('PSD megnyitás', `EXCEPTION: ${String(openErr)}`, 'error');
    }
  }
}
