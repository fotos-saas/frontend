import { Injectable, inject, NgZone, signal } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Photoshop JSX futtatás és busy state kezelés.
 * Az electronAPI.photoshop hívásokat egységesíti.
 */
@Injectable()
export class OverlayPhotoshopService {
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);

  /** Melyik parancs fut éppen — busy spinner megjelenítéshez */
  readonly busyCommand = signal<string | null>(null);

  /**
   * JSX script futtatása busy state kezeléssel.
   * 7× ismétlődő try/finally busyCommand pattern helyett.
   */
  async runJsx(
    commandId: string,
    scriptName: string,
    jsonData?: Record<string, unknown>,
    pollCallback?: () => void,
  ): Promise<any> {
    if (!window.electronAPI) return null;
    this.busyCommand.set(commandId);
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName, jsonData });
      this.logger.debug(`[JSX:${commandId}] result:`, result);
      pollCallback?.();
      return result;
    } catch (err) {
      this.logger.error(`[JSX:${commandId}] error:`, err);
      return null;
    } finally {
      this.ngZone.run(() => this.busyCommand.set(null));
    }
  }

  /**
   * Busy wrapper — tetszőleges async művelethez beállítja/reseteli a busyCommand-ot.
   */
  async withBusy<T>(commandId: string, op: () => Promise<T>): Promise<T> {
    this.ngZone.run(() => this.busyCommand.set(commandId));
    try {
      return await op();
    } finally {
      this.ngZone.run(() => this.busyCommand.set(null));
    }
  }

  /**
   * PS-ből kiszedi az összes Images layerek neveit.
   * 4× hívva a komponensben.
   */
  async getImageLayerNames(): Promise<string[]> {
    const data = await this.getImageLayerData();
    return data.names;
  }

  /**
   * PS-ből kiszedi az Images layerek neveit csoportonként.
   */
  async getImageLayerData(): Promise<{ names: string[]; students: string[]; teachers: string[] }> {
    const empty = { names: [], students: [], teachers: [] };
    if (!window.electronAPI) return empty;
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-image-names.jsx',
      });
      if (!result.success || !result.output) return empty;
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return empty;
      const data = JSON.parse(cleaned);
      return {
        names: data.names || [],
        students: data.students || [],
        teachers: data.teachers || [],
      };
    } catch { return empty; }
  }

  /**
   * Names csoport text layerek nevét és szöveges tartalmát olvassa ki.
   * 2× hívva a komponensben.
   */
  async getNamesTextContent(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!window.electronAPI) return map;
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-names-text-content.jsx',
      });
      if (!result.success || !result.output) return map;
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return map;
      const data = JSON.parse(cleaned);
      for (const item of data.items || []) {
        const text = (item.textContent || '').replace(/[\r\n]+/g, ' ').trim();
        if (text) map.set(item.layerName, text);
      }
      return map;
    } catch { return map; }
  }

  /**
   * Positions csoport text layerek nevét és szöveges tartalmát olvassa ki.
   * layerName slug → position/title szöveg (pl. "igazgató")
   */
  async getPositionsTextContent(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!window.electronAPI) return map;
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-positions-text-content.jsx',
      });
      if (!result.success || !result.output) return map;
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return map;
      const data = JSON.parse(cleaned);
      for (const item of data.items || []) {
        const text = (item.textContent || '').replace(/[\r\n]+/g, ' ').trim();
        if (text) map.set(item.layerName, text);
      }
      return map;
    } catch { return map; }
  }

  /**
   * PS-ből kiszedi az Images layerek pozícióit (x, y) csoportonként.
   * A drag order panel sor-szeparátor detektálásához használjuk.
   */
  async getImageLayerPositions(): Promise<{
    students: Array<{ name: string; x: number; y: number }>;
    teachers: Array<{ name: string; x: number; y: number }>;
  }> {
    const empty = { students: [], teachers: [] };
    if (!window.electronAPI) return empty;
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-image-positions.jsx',
      });
      if (!result.success || !result.output) return empty;
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return empty;
      const data = JSON.parse(cleaned);
      return {
        students: data.students || [],
        teachers: data.teachers || [],
      };
    } catch { return empty; }
  }

  /** Nevek + pozíciók egyetlen PS hívással. 2 JSX helyett 1. */
  async getImageDataCombined(): Promise<{
    names: string[];
    studentNames: string[];
    teacherNames: string[];
    students: Array<{ name: string; x: number; y: number }>;
    teachers: Array<{ name: string; x: number; y: number }>;
  }> {
    const empty = { names: [], studentNames: [], teacherNames: [], students: [], teachers: [] };
    if (!window.electronAPI) return empty;
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-image-data-combined.jsx',
      });
      if (!result.success || !result.output) return empty;
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return empty;
      const data = JSON.parse(cleaned);
      return {
        names: data.names || [],
        studentNames: data.studentNames || [],
        teacherNames: data.teacherNames || [],
        students: data.students || [],
        teachers: data.teachers || [],
      };
    } catch { return empty; }
  }

  /**
   * PS-ből frissen lekéri a kijelölt layerek neveit (get-active-doc.jsx).
   * Visszaadja a nyers parsed doc-ot is a caller-nek.
   */
  async getFreshSelectedLayerNames(): Promise<{ names: string[]; doc: any | null }> {
    if (!window.electronAPI) return { names: [], doc: null };
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-active-doc.jsx',
      });
      if (!result.success || !result.output) return { names: [], doc: null };
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return { names: [], doc: null };
      const data = JSON.parse(cleaned);
      this.logger.debug('[FRESH-SELECTED] selectedLayerNames:', data.selectedLayerNames, 'count:', data.selectedLayers);
      return { names: data.selectedLayerNames || [], doc: data };
    } catch { return { names: [], doc: null }; }
  }

  /**
   * Rendezéshez a nevek: FRISSEN lekéri a kijelölt layereket PS-ből, nem a stale polling adatot.
   */
  async getSortableNames(): Promise<string[]> {
    const { names } = await this.getFreshSelectedLayerNames();
    if (names.length >= 2) return names;
    return this.getImageLayerNames();
  }
}
