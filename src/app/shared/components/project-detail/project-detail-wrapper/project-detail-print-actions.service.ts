import { Injectable, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerFinalizationService } from '../../../../features/partner/services/partner-finalization.service';
import { PartnerAlbumService } from '../../../../features/partner/services/partner-album.service';
import { saveFile } from '../../../utils/file.util';
import { projectShortName } from '../../../utils/string.util';
import { ProjectDetailData } from '../project-detail.types';
import { PrintFileUploadEvent, PrintFileDownloadEvent, PrintFileDeleteEvent } from '../project-print-tab/project-print-tab.component';
import { ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

/**
 * Print tab muveletek es pending ZIP letoltes kezelese.
 *
 * Nem providedIn: 'root' - komponens szintu scope.
 */
@Injectable()
export class ProjectDetailPrintActionsService {
  private destroyRef!: DestroyRef;
  private toast!: ToastService;
  private finalizationService: PartnerFinalizationService | null = null;
  private albumService: PartnerAlbumService | null = null;
  private getProjectData!: () => ProjectDetailData | null;
  private reloadProject!: () => void;

  // Print file torlesi confirm
  readonly showDeletePrintFileConfirm = signal(false);
  readonly deletingPrintFileType = signal<'small_tablo' | 'flat' | null>(null);

  // Task allapotok
  readonly showTaskDialog = signal(false);
  readonly editingTaskData = signal<ProjectTask | null>(null);
  readonly showTaskDeleteConfirm = signal(false);
  readonly deletingTask = signal<ProjectTask | null>(null);

  init(deps: {
    destroyRef: DestroyRef;
    toast: ToastService;
    finalizationService: PartnerFinalizationService | null;
    albumService: PartnerAlbumService | null;
    getProjectData: () => ProjectDetailData | null;
    reloadProject: () => void;
  }): void {
    this.destroyRef = deps.destroyRef;
    this.toast = deps.toast;
    this.finalizationService = deps.finalizationService;
    this.albumService = deps.albumService;
    this.getProjectData = deps.getProjectData;
    this.reloadProject = deps.reloadProject;
  }

  // === PRINT FILE MUVELETEK ===

  downloadPrintFile(event: PrintFileDownloadEvent): void {
    const project = this.getProjectData();
    if (!project || !this.finalizationService) return;

    const file = event.type === 'small_tablo' ? project.printSmallTablo : project.printFlat;
    if (!file) return;

    this.finalizationService.downloadPrintReady(project.id, event.type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => saveFile(blob, file.fileName),
        error: () => this.toast.error('Hiba', 'Nem sikerult letolteni a fajlt.'),
      });
  }

  uploadPrintFile(event: PrintFileUploadEvent, tabState?: {
    uploading: { set: (v: boolean) => void };
    uploadError: { set: (v: string | null) => void };
  }): void {
    const project = this.getProjectData();
    if (!project || !this.finalizationService) return;

    tabState?.uploading.set(true);
    tabState?.uploadError.set(null);

    this.finalizationService.uploadPrintReady(project.id, event.file, event.type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          tabState?.uploading.set(false);
          this.toast.success('Siker', 'Nyomdakesz fajl feltoltve.');
          this.reloadProject();
        },
        error: () => {
          tabState?.uploading.set(false);
          tabState?.uploadError.set('Hiba tortent a feltoltes soran.');
          this.toast.error('Hiba', 'Nem sikerult feltolteni a fajlt.');
        },
      });
  }

  confirmDeletePrintFile(event: PrintFileDeleteEvent): void {
    this.deletingPrintFileType.set(event.type);
    this.showDeletePrintFileConfirm.set(true);
  }

  onDeletePrintFileResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const project = this.getProjectData();
      const type = this.deletingPrintFileType();
      if (!project || !type || !this.finalizationService) return;

      this.finalizationService.deletePrintReady(project.id, type)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Siker', 'Fajl sikeresen torolve.');
            this.reloadProject();
          },
          error: () => this.toast.error('Hiba', 'Nem sikerult torolni a fajlt.'),
        });
    }
    this.showDeletePrintFileConfirm.set(false);
    this.deletingPrintFileType.set(null);
  }

  // === PENDING ZIP LETOLTES ===

  downloadPendingPhotosZip(): void {
    const projectData = this.getProjectData();
    if (!projectData?.id || !this.albumService) return;

    this.albumService.downloadPendingZip(projectData.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const name = projectShortName(projectData.name ?? '', projectData.id);
          saveFile(blob, `${name}_elozetes.zip`);
          this.toast.success('Siker', 'ZIP letoltve');
        },
        error: () => this.toast.error('Hiba', 'A letoltes nem sikerult'),
      });
  }

  // === TASK MUVELETEK ===

  openTaskDialog(task: ProjectTask | null): void {
    this.editingTaskData.set(task);
    this.showTaskDialog.set(true);
  }

  closeTaskDialog(): void {
    this.showTaskDialog.set(false);
    this.editingTaskData.set(null);
  }

  onTaskSaved(task: ProjectTask, onSaved: (task: ProjectTask, wasEdit: boolean) => void): void {
    const wasEdit = !!this.editingTaskData();
    this.closeTaskDialog();
    onSaved(task, wasEdit);
  }

  confirmDeleteTask(task: ProjectTask): void {
    this.deletingTask.set(task);
    this.showTaskDeleteConfirm.set(true);
  }

  onTaskDeleteResult(result: ConfirmDialogResult, executeDeleteFn: (task: ProjectTask) => void): void {
    if (result.action === 'confirm') {
      const task = this.deletingTask();
      if (task) executeDeleteFn(task);
    }
    this.showTaskDeleteConfirm.set(false);
    this.deletingTask.set(null);
  }
}
