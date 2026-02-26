import { Injectable, inject, signal, computed } from '@angular/core';
import { SnapshotListItem, SnapshotLayer } from '@core/services/electron.types';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopService } from '../../services/photoshop.service';

/**
 * TabloEditorSnapshotService — Pillanatkep rendszer UI state + logika
 *
 * Komponens-szintu service (providers: [...] a komponensben).
 * Kezeli a snapshot CRUD muveleteket es az UI allapotot.
 */
@Injectable()
export class TabloEditorSnapshotService {
  private readonly ps = inject(PhotoshopService);
  private readonly logger = inject(LoggerService);

  /** Snapshot lista (legujabb elol) */
  readonly snapshots = signal<SnapshotListItem[]>([]);

  /** Loading allapotok */
  readonly loadingSnapshots = signal(false);
  readonly savingSnapshot = signal(false);
  readonly updatingSnapshot = signal(false);
  readonly restoringSnapshotPath = signal<string | null>(null);

  /** Mentes dialog (uj pillanatkep nevvel) */
  readonly showSaveDialog = signal(false);
  readonly snapshotName = signal('');

  /** Frissites valaszto dialog (ha tobb snapshot van) */
  readonly showUpdatePicker = signal(false);

  /** Visszaállítás dialógus (csoport-választó) */
  readonly showRestoreDialog = signal(false);
  readonly restoreDialogSnapshot = signal<SnapshotListItem | null>(null);
  readonly restoreDialogLayers = signal<SnapshotLayer[]>([]);

  /** Inline atnevezes allapot (melyik snapshot szerkesztes alatt) */
  readonly editingSnapshotPath = signal<string | null>(null);
  readonly editingName = signal('');
  private originalEditingName = '';

  /** Legutolso snapshot (lista elso eleme — legujabb) */
  readonly latestSnapshot = computed(() => this.snapshots()[0] ?? null);

  /** Összecsukott snapshot csoportok (eredeti nevek set-je) */
  readonly collapsedGroups = signal<Set<string>>(new Set());

  /** Csoportosított snapshot lista: eredeti snapshotok + alattuk a szerkesztett verziók */
  readonly groupedSnapshots = computed(() => {
    const all = this.snapshots();
    const originals: SnapshotListItem[] = [], editedMap = new Map<string, SnapshotListItem[]>();
    for (const s of all) {
      if (s.snapshotName.endsWith('(szerkesztett)')) {
        const base = s.snapshotName.replace(/ \(szerkesztett\)$/, '');
        (editedMap.get(base) ?? (editedMap.set(base, []), editedMap.get(base)!)).push(s);
      } else { originals.push(s); }
    }
    const groups: Array<{ original: SnapshotListItem; edited: SnapshotListItem[] }> = [];
    const used = new Set<string>();
    for (const o of originals) { const e = editedMap.get(o.snapshotName) ?? []; groups.push({ original: o, edited: e }); if (e.length) used.add(o.snapshotName); }
    for (const [k, v] of editedMap) { if (!used.has(k)) for (const s of v) groups.push({ original: s, edited: [] }); }
    return groups;
  });

  toggleGroupCollapse(name: string): void {
    const n = new Set(this.collapsedGroups());
    n.has(name) ? n.delete(name) : n.add(name);
    this.collapsedGroups.set(n);
  }

  isGroupCollapsed(name: string): boolean { return this.collapsedGroups().has(name); }

  /** Snapshot lista betoltese a layouts/ mappabol */
  async loadSnapshots(psdPath: string): Promise<void> {
    this.loadingSnapshots.set(true);
    try {
      const list = await this.ps.listSnapshots(psdPath);
      this.snapshots.set(list);
    } finally {
      this.loadingSnapshots.set(false);
    }
  }

  /** Uj pillanatkep mentese (uj fajl, uj nev) */
  async saveSnapshot(
    name: string,
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!name.trim()) {
      return { success: false, error: 'Add meg a pillanatkép nevét!' };
    }

    this.savingSnapshot.set(true);
    try {
      const result = await this.ps.saveSnapshot(name.trim(), boardConfig, psdPath, targetDocName);
      if (result.success) {
        this.closeSaveDialog();
        await this.loadSnapshots(psdPath);
      }
      return result;
    } finally {
      this.savingSnapshot.set(false);
    }
  }

  /**
   * Meglevo snapshot frissitese (torles + ujra mentes azonos nevvel).
   * Ha nincs snapshot → letrehoz egyet "Automatikus mentés" nevvel.
   */
  async updateSnapshot(
    snapshot: SnapshotListItem | null,
    boardConfig: { widthCm: number; heightCm: number },
    psdPath: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.updatingSnapshot.set(true);
    try {
      const name = snapshot?.snapshotName || 'Automatikus mentés';

      // Ha van meglevo snapshot, toroljuk elobb
      if (snapshot) {
        await this.ps.deleteSnapshot(snapshot.filePath);
      }

      // Uj snapshot mentese az eredeti nevvel
      const result = await this.ps.saveSnapshot(name, boardConfig, psdPath, targetDocName);
      if (result.success) {
        this.showUpdatePicker.set(false);
        await this.loadSnapshots(psdPath);
      }
      return result;
    } finally {
      this.updatingSnapshot.set(false);
    }
  }

  /** Pillanatkep visszaallitasa (teljes vagy szelektiv) */
  async restoreSnapshot(
    snapshotPath: string,
    psdPath: string,
    targetDocName?: string,
    restoreGroups?: string[][],
  ): Promise<{ success: boolean; error?: string }> {
    this.restoringSnapshotPath.set(snapshotPath);
    try {
      const result = await this.ps.restoreSnapshot(snapshotPath, targetDocName, restoreGroups);
      if (result.success) {
        await this.loadSnapshots(psdPath);
      }
      return result;
    } finally {
      this.restoringSnapshotPath.set(null);
    }
  }

  /** Visszaállítás dialógus megnyitása — snapshot betöltése és layers kinyerése */
  async openRestoreDialog(snapshot: SnapshotListItem): Promise<void> {
    try {
      const loadResult = await this.ps.loadSnapshot(snapshot.filePath);
      if (!loadResult.success || !loadResult.data) {
        this.logger.error('Snapshot betöltés sikertelen a restore dialógushoz');
        return;
      }

      const data = loadResult.data as Record<string, unknown>;
      let layers: SnapshotLayer[] = [];

      if (Array.isArray(data['layers'])) {
        layers = data['layers'] as SnapshotLayer[];
      } else if (Array.isArray(data['persons'])) {
        // v2 compat: persons → szintetikus layers
        const persons = data['persons'] as Array<Record<string, unknown>>;
        for (const p of persons) {
          const personType = (p['type'] as string) || 'student';
          const imgGroup = personType === 'teacher' ? 'Teachers' : 'Students';
          if (p['image']) {
            const img = p['image'] as Record<string, number>;
            layers.push({
              layerId: 0,
              layerName: p['layerName'] as string,
              groupPath: ['Images', imgGroup],
              x: img['x'], y: img['y'], width: img['width'], height: img['height'],
              kind: 'normal',
            });
          }
          if (p['nameLayer']) {
            const nl = p['nameLayer'] as Record<string, unknown>;
            layers.push({
              layerId: 0,
              layerName: p['layerName'] as string,
              groupPath: ['Names', imgGroup],
              x: nl['x'] as number, y: nl['y'] as number,
              width: (nl['width'] as number) || 0, height: (nl['height'] as number) || 0,
              kind: 'text',
              text: nl['text'] as string,
              justification: nl['justification'] as 'left' | 'center' | 'right',
            });
          }
        }
      }

      this.restoreDialogSnapshot.set(snapshot);
      this.restoreDialogLayers.set(layers);
      this.showRestoreDialog.set(true);
    } catch (err) {
      this.logger.error('Restore dialógus megnyitás hiba', err);
    }
  }

  /** Visszaállítás dialógus bezárása */
  closeRestoreDialog(): void {
    this.showRestoreDialog.set(false);
    this.restoreDialogSnapshot.set(null);
    this.restoreDialogLayers.set([]);
  }

  /** Pillanatkep torlese */
  async deleteSnapshot(
    snapshotPath: string,
    psdPath: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.ps.deleteSnapshot(snapshotPath);
      if (result.success) {
        await this.loadSnapshots(psdPath);
      }
      return result;
    } catch (err) {
      this.logger.error('Snapshot torles hiba', err);
      return { success: false, error: 'Váratlan hiba a törlés során' };
    }
  }

  /** Mentes dialog megnyitasa */
  openSaveDialog(): void {
    this.snapshotName.set('');
    this.showSaveDialog.set(true);
  }

  /** Mentes dialog bezarasa */
  closeSaveDialog(): void {
    this.showSaveDialog.set(false);
    this.snapshotName.set('');
  }

  /** Inline szerkesztes inditasa */
  startEditing(snapshot: SnapshotListItem): void {
    this.editingSnapshotPath.set(snapshot.filePath);
    this.editingName.set(snapshot.snapshotName);
    this.originalEditingName = snapshot.snapshotName;
  }

  /** Inline szerkesztes mentese */
  async commitEditing(psdPath: string): Promise<{ success: boolean; error?: string }> {
    const snapshotPath = this.editingSnapshotPath();
    const newName = this.editingName().trim();

    // Nincs aktív szerkesztés
    if (!snapshotPath) {
      return { success: true };
    }

    // Üres név vagy nem változott → cancel
    if (!newName || newName === this.originalEditingName) {
      this.cancelEditing();
      return { success: true };
    }

    try {
      const result = await this.ps.renameSnapshot(snapshotPath, newName);
      if (result.success) {
        await this.loadSnapshots(psdPath);
      }
      return result;
    } finally {
      this.cancelEditing();
    }
  }

  /** Inline szerkesztes megszakitasa */
  cancelEditing(): void {
    this.editingSnapshotPath.set(null);
    this.editingName.set('');
    this.originalEditingName = '';
  }

  /** Frissites valaszto megnyitasa */
  openUpdatePicker(): void {
    this.showUpdatePicker.set(true);
  }

  /** Frissites valaszto bezarasa */
  closeUpdatePicker(): void {
    this.showUpdatePicker.set(false);
  }

  /** Datum formazas a listaban */
  formatDate(isoDate: string | null): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
