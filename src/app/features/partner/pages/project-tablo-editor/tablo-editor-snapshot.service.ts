import { Injectable, inject, signal, computed } from '@angular/core';
import { SnapshotListItem } from '@core/services/electron.types';
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
  readonly restoringSnapshot = signal(false);

  /** Mentes dialog (uj pillanatkep nevvel) */
  readonly showSaveDialog = signal(false);
  readonly snapshotName = signal('');

  /** Frissites valaszto dialog (ha tobb snapshot van) */
  readonly showUpdatePicker = signal(false);

  /** Inline atnevezes allapot (melyik snapshot szerkesztes alatt) */
  readonly editingSnapshotPath = signal<string | null>(null);
  readonly editingName = signal('');

  /** Legutolso snapshot (lista elso eleme — legujabb) */
  readonly latestSnapshot = computed(() => this.snapshots()[0] ?? null);

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

  /** Pillanatkep visszaallitasa */
  async restoreSnapshot(
    snapshotPath: string,
    psdPath: string,
    targetDocName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.restoringSnapshot.set(true);
    try {
      const result = await this.ps.restoreSnapshot(snapshotPath, targetDocName);
      if (result.success) {
        await this.loadSnapshots(psdPath);
      }
      return result;
    } finally {
      this.restoringSnapshot.set(false);
    }
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
  }

  /** Inline szerkesztes mentese */
  async commitEditing(psdPath: string): Promise<{ success: boolean; error?: string }> {
    const snapshotPath = this.editingSnapshotPath();
    const newName = this.editingName().trim();

    if (!snapshotPath || !newName) {
      this.cancelEditing();
      return { success: false, error: 'Hiányzó adatok' };
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
