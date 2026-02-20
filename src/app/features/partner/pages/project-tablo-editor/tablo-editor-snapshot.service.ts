import { Injectable, inject, signal } from '@angular/core';
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

  /** Snapshot lista */
  readonly snapshots = signal<SnapshotListItem[]>([]);

  /** Loading allapotok */
  readonly loadingSnapshots = signal(false);
  readonly savingSnapshot = signal(false);
  readonly restoringSnapshot = signal(false);

  /** Mentes dialog */
  readonly showSaveDialog = signal(false);
  readonly snapshotName = signal('');

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

  /** Uj pillanatkep mentese */
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

  /** Datum formázás a listaban */
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
