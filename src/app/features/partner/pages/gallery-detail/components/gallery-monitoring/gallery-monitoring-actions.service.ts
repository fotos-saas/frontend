import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PartnerGalleryService } from '../../../../services/partner-gallery.service';
import { PartnerService } from '../../../../services/partner.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { GalleryMonitoringState } from './gallery-monitoring.state';
import { DownloadOptions } from '../download-dialog/download-dialog.component';

/**
 * GalleryMonitoringActionsService
 *
 * HTTP-hívás logika a monitoring tabhoz.
 * Component-scoped (providers tömbben regisztrált).
 */
@Injectable()
export class GalleryMonitoringActionsService {
  private readonly galleryService = inject(PartnerGalleryService);
  private readonly partnerService = inject(PartnerService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  loadMonitoring(state: GalleryMonitoringState, projectId: number): void {
    state.setLoading();

    this.galleryService.getMonitoring(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          state.setData(response.persons, response.summary);
        },
        error: () => {
          state.setError();
          this.toast.error('Hiba', 'A monitoring adatok nem tölthetők be');
        },
      });

    // Export settings betöltése párhuzamosan
    this.partnerService.getProjectSettings(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data.effective_export) {
            state.exportSettings.set(res.data.effective_export);
          }
        },
      });
  }

  loadPersonSelections(state: GalleryMonitoringState, projectId: number, personId: number): void {
    this.galleryService.getPersonSelections(projectId, personId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selections) => {
          state.setSelections(selections);
        },
        error: () => {
          state.setSelectionsError();
          this.toast.error('Hiba', 'A kiválasztások nem tölthetők be');
        },
      });
  }

  exportExcel(state: GalleryMonitoringState, projectId: number, galleryName: string): void {
    state.exportingExcel.set(true);

    const filter = state.filterStatus();
    const prefix = this.buildFilePrefix(galleryName, projectId);

    this.galleryService.exportMonitoringExcel(projectId, filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.saveFile(blob, `${prefix}-${this.todayStr()}.xlsx`);
          state.exportingExcel.set(false);
          this.toast.success('Siker', 'Excel exportálva');
        },
        error: () => {
          state.exportingExcel.set(false);
          this.toast.error('Hiba', 'Az Excel export nem sikerült');
        },
      });
  }

  /**
   * ZIP letöltés indítása.
   * Ha always_ask = true → dialog-on keresztül hívódik.
   * Ha always_ask = false → közvetlen letöltés a mentett beállításokkal.
   */
  downloadZip(state: GalleryMonitoringState, projectId: number, galleryName: string, options: DownloadOptions): void {
    state.exportingZip.set(true);
    state.showDownloadDialog.set(false);

    const prefix = this.buildFilePrefix(galleryName, projectId);

    this.galleryService.downloadMonitoringZip(projectId, {
      zipContent: options.zipContent,
      fileNaming: options.fileNaming,
      includeExcel: options.includeExcel,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.saveFile(blob, `${prefix}-${this.todayStr()}.zip`);
          state.exportingZip.set(false);
          this.toast.success('Siker', 'ZIP letöltve');
        },
        error: () => {
          state.exportingZip.set(false);
          this.toast.error('Hiba', 'A ZIP letöltés nem sikerült');
        },
      });
  }

  /** Blob mentése fájlként */
  private saveFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Fájlnév prefix: osztálynév rövidítve + ID, pl. "Makoi-Szt-Istvan-12C-171" */
  private buildFilePrefix(galleryName: string, projectId: number): string {
    if (!galleryName) {
      return `monitoring-${projectId}`;
    }
    const slug = galleryName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // ékezetek eltávolítása
      .replace(/[^a-zA-Z0-9\s-]/g, '')                   // speciális karakterek törlése
      .trim()
      .replace(/\s+/g, '-')                               // szóközök → kötőjel
      .replace(/-+/g, '-');                                // dupla kötőjelek
    return `${slug}-${projectId}`;
  }
}
