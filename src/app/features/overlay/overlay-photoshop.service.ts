import { Injectable, inject, NgZone, signal } from '@angular/core';

/**
 * Photoshop JSX futtatás és busy state kezelés.
 * Az electronAPI.photoshop hívásokat egységesíti.
 */
@Injectable()
export class OverlayPhotoshopService {
  private readonly ngZone = inject(NgZone);

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
      console.log(`[JSX:${commandId}] result:`, result);
      pollCallback?.();
      return result;
    } catch (err) {
      console.error(`[JSX:${commandId}] error:`, err);
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
    if (!window.electronAPI) return [];
    try {
      const result = await window.electronAPI.photoshop.runJsx({
        scriptName: 'actions/get-image-names.jsx',
      });
      if (!result.success || !result.output) return [];
      const cleaned = result.output.trim();
      if (!cleaned.startsWith('{')) return [];
      const data = JSON.parse(cleaned);
      return data.names || [];
    } catch { return []; }
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
      console.log('[FRESH-SELECTED] selectedLayerNames:', data.selectedLayerNames, 'count:', data.selectedLayers);
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
