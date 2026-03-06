import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { PartnerService, PartnerProjectListItem, SampleItem, ProjectLimits } from '../../services/partner.service';
import { PartnerPreliminaryService } from '../../services/partner-preliminary.service';
import { PartnerOrderSyncService } from '../../services/partner-order-sync.service';
import { PsdStatusService } from '../../services/psd-status.service';
import { BatchWorkspaceService } from '../../services/batch-workspace.service';
import { BatchWorkflowType } from '../../models/batch.types';
import { BatchActionChoice } from '../../components/batch-action-dialog/batch-action-dialog.component';
import { ElectronService } from '../../../../core/services/electron.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { SampleLightboxItem } from '../../../../shared/components/samples-lightbox';
import { ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Projekt lista akciók (modal kezelés, delete, sync, samples stb.)
 * Kiemelt logika a PartnerProjectListComponent-ből.
 */
@Injectable()
export class ProjectListActionsService {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly partnerService = inject(PartnerService);
  private readonly orderSyncService = inject(PartnerOrderSyncService);
  private readonly psdStatusService = inject(PsdStatusService);
  private readonly batchWorkspaceService = inject(BatchWorkspaceService);
  private readonly electronService = inject(ElectronService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Modals
  readonly showMissingModal = signal(false);
  readonly showCreateModal = signal(false);
  readonly showCreateWizard = signal(false);
  readonly showQrModal = signal(false);
  readonly showUploadWizard = signal(false);
  readonly uploadWizardAlbum = signal<'students' | 'teachers' | undefined>(undefined);
  readonly selectedProject = signal<PartnerProjectListItem | null>(null);

  // Delete Confirm
  readonly showDeleteConfirm = signal(false);
  readonly deletingProjectName = signal('');
  readonly isDeleting = signal(false);
  private readonly deletingProjectId = signal<number | null>(null);

  // Preliminary
  readonly showCreatePreliminaryModal = signal(false);
  readonly showLinkDialog = signal(false);
  readonly linkingProject = signal<PartnerProjectListItem | null>(null);

  // Samples Lightbox
  readonly samplesLightboxIndex = signal<number | null>(null);
  private readonly samplesData = signal<SampleItem[]>([]);
  readonly lightboxSamples = computed<SampleLightboxItem[]>(() =>
    this.samplesData().map(s => ({
      id: s.id,
      url: s.url,
      thumbUrl: s.thumbnailUrl,
      fileName: s.name,
      createdAt: s.createdAt || new Date().toISOString(),
      description: s.description
    }))
  );

  // Sync
  readonly syncing = signal(false);
  readonly pendingSyncCount = signal<number | null>(null);

  // Multi-select
  readonly selectedProjectIds = signal<Set<number>>(new Set());
  private lastSelectedIndex: number | null = null;

  // Batch action dialog
  readonly showBatchActionDialog = signal(false);

  /** Frissitendo callback (parent allitja be) */
  private reloadFn: (() => void) | null = null;
  /** Projektek signal referencia (parent allitja be) */
  private projectsRef: ReturnType<typeof signal<PartnerProjectListItem[]>> | null = null;
  private totalProjectsRef: ReturnType<typeof signal<number>> | null = null;

  init(
    projects: ReturnType<typeof signal<PartnerProjectListItem[]>>,
    totalProjects: ReturnType<typeof signal<number>>,
    reload: () => void,
  ): void {
    this.projectsRef = projects;
    this.totalProjectsRef = totalProjects;
    this.reloadFn = reload;
  }

  // --- Multi-select ---

  readonly selectedProjects = (projects: PartnerProjectListItem[]) =>
    projects.filter(p => this.selectedProjectIds().has(p.id));

  onCardSelect(project: PartnerProjectListItem, event: MouseEvent, index: number, projects: PartnerProjectListItem[]): void {
    if (event.metaKey || event.ctrlKey) {
      this.selectedProjectIds.update(ids => {
        const next = new Set(ids);
        if (next.has(project.id)) { next.delete(project.id); } else { next.add(project.id); }
        return next;
      });
      this.lastSelectedIndex = index;
    } else if (event.shiftKey && this.lastSelectedIndex !== null) {
      const start = Math.min(this.lastSelectedIndex, index);
      const end = Math.max(this.lastSelectedIndex, index);
      const rangeIds = projects.slice(start, end + 1).map(p => p.id);
      this.selectedProjectIds.update(ids => {
        const next = new Set(ids);
        rangeIds.forEach(id => next.add(id));
        return next;
      });
    } else {
      if (this.selectedProjectIds().size > 0) {
        this.clearSelection();
      } else {
        this.viewProject(project);
      }
    }
  }

  clearSelection(): void {
    this.selectedProjectIds.set(new Set());
    this.lastSelectedIndex = null;
  }

  addSelectedToBatch(workflowType: BatchWorkflowType, projects: PartnerProjectListItem[]): void {
    const selected = this.selectedProjects(projects);
    if (selected.length > 0) {
      this.batchWorkspaceService.addTasks(selected, workflowType);
      this.batchWorkspaceService.panelOpen.set(true);
    }
    this.clearSelection();
  }

  /** Elérhető batch műveletek a kijelölt projektek alapján */
  getAvailableBatchActions(projects: PartnerProjectListItem[]): BatchActionChoice[] {
    const selected = this.selectedProjects(projects);
    if (selected.length === 0) return [];

    const hasWithPsd = selected.some(p => this.psdStatusService.getStatus(p.id)?.exists);

    const actions: BatchActionChoice[] = [
      {
        type: 'generate-psd',
        label: 'PSD generálás',
        description: 'Tablókép PSD fájl létrehozása (vagy újragenerálása)',
        icon: ICONS.LAYERS,
        colorClass: 'purple',
      },
    ];

    if (hasWithPsd) {
      actions.push({
        type: 'generate-sample',
        label: 'Fényképek frissítése',
        description: 'Meglévő PSD-ben a fényképek cseréje és minta generálása',
        icon: ICONS.IMAGES,
        colorClass: 'blue',
      });
      actions.push({
        type: 'finalize',
        label: 'Véglegesítés',
        description: 'Nyomdakész fájl előkészítése a kijelölt projektekhez',
        icon: ICONS.SEND,
        colorClass: 'green',
      });
    }
    return actions;
  }

  openBatchActionDialog(): void {
    this.showBatchActionDialog.set(true);
  }

  closeBatchActionDialog(): void {
    this.showBatchActionDialog.set(false);
  }

  onBatchActionSelected(workflowType: BatchWorkflowType, projects: PartnerProjectListItem[]): void {
    this.showBatchActionDialog.set(false);
    this.addSelectedToBatch(workflowType, projects);
  }

  viewProject(project: PartnerProjectListItem): void {
    this.router.navigate(['/partner/projects', project.id]);
  }

  // --- Samples ---

  openSamplesModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.partnerService.getProjectSamples(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.data?.length) {
            this.samplesData.set(response.data);
            this.samplesLightboxIndex.set(0);
          }
        },
        error: (err) => this.logger.error('Failed to load samples', err)
      });
  }

  closeSamplesLightbox(): void {
    this.samplesLightboxIndex.set(null);
    this.samplesData.set([]);
    this.selectedProject.set(null);
  }

  // --- Modal handlers ---

  openMissingModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.showMissingModal.set(true);
  }

  closeMissingModal(): void {
    this.showMissingModal.set(false);
    this.selectedProject.set(null);
    this.reloadFn?.();
  }

  openCreateModal(mode: 'simple' | 'wizard'): void {
    if (mode === 'wizard') { this.showCreateWizard.set(true); } else { this.showCreateModal.set(true); }
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }
  closeCreateWizard(): void { this.showCreateWizard.set(false); }

  onProjectCreated(): void {
    this.closeCreateModal();
    this.closeCreateWizard();
    this.reloadFn?.();
  }

  openQrModal(project: PartnerProjectListItem): void {
    this.selectedProject.set(project);
    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
    this.selectedProject.set(null);
  }

  onQrCodeChanged(): void { this.reloadFn?.(); }

  openUploadWizardFromMissing(personType: 'student' | 'teacher'): void {
    this.showMissingModal.set(false);
    this.uploadWizardAlbum.set(personType === 'student' ? 'students' : 'teachers');
    this.showUploadWizard.set(true);
  }

  closeUploadWizard(): void {
    this.showUploadWizard.set(false);
    this.uploadWizardAlbum.set(undefined);
    this.selectedProject.set(null);
  }

  onUploadWizardCompleted(): void {
    this.closeUploadWizard();
    this.reloadFn?.();
  }

  // --- Status / Aware / Photos Uploaded ---

  onStatusChange(event: { projectId: number; status: string; label: string; color: string }): void {
    this.partnerService.updateProject(event.projectId, { status: event.status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projectsRef?.update(projects =>
            projects.map(p =>
              p.id === event.projectId
                ? { ...p, status: event.status, statusLabel: event.label, statusColor: event.color }
                : p
            )
          );
        },
        error: (err) => this.logger.error('Failed to update status', err)
      });
  }

  toggleAware(project: PartnerProjectListItem): void {
    this.partnerService.toggleProjectAware(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projectsRef?.update(projects =>
            projects.map(p => p.id === project.id ? { ...p, isAware: response.isAware } : p)
          );
        },
        error: (err) => this.logger.error('Failed to toggle aware', err)
      });
  }

  togglePhotosUploaded(project: PartnerProjectListItem): void {
    const prev = project.photosUploaded;
    this.projectsRef?.update(projects =>
      projects.map(p => p.id === project.id ? { ...p, photosUploaded: !prev } : p)
    );
    this.partnerService.togglePhotosUploaded(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.projectsRef?.update(projects =>
            projects.map(p => p.id === project.id ? { ...p, photosUploaded: prev } : p)
          );
        }
      });
  }

  // --- Delete ---

  confirmDeleteProject(project: PartnerProjectListItem): void {
    this.deletingProjectId.set(project.id);
    this.deletingProjectName.set(project.name || project.schoolName || 'Ismeretlen');
    this.showDeleteConfirm.set(true);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.executeDeleteProject();
    } else {
      this.showDeleteConfirm.set(false);
      this.deletingProjectId.set(null);
    }
  }

  private executeDeleteProject(): void {
    const projectId = this.deletingProjectId();
    if (!projectId) return;

    this.isDeleting.set(true);
    this.partnerService.deleteProject(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.showDeleteConfirm.set(false);
          this.projectsRef?.update(list => list.filter(p => p.id !== projectId));
          this.totalProjectsRef?.update(t => t - 1);
          this.deletingProjectId.set(null);
          this.toast.success('Törölve', 'A projekt sikeresen törölve.');
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.showDeleteConfirm.set(false);
          this.logger.error('Failed to delete project', err);
          this.toast.error('Hiba', 'Nem sikerült törölni a projektet.');
        }
      });
  }

  // --- Preliminary ---

  openCreatePreliminaryModal(): void { this.showCreatePreliminaryModal.set(true); }
  closeCreatePreliminaryModal(): void { this.showCreatePreliminaryModal.set(false); }

  onPreliminaryCreated(): void {
    this.closeCreatePreliminaryModal();
    this.reloadFn?.();
    this.toast.success('Létrehozva', 'Előzetes projekt sikeresen létrehozva.');
  }

  openLinkDialog(project: PartnerProjectListItem): void {
    this.linkingProject.set(project);
    this.showLinkDialog.set(true);
  }

  closeLinkDialog(): void {
    this.showLinkDialog.set(false);
    this.linkingProject.set(null);
  }

  onPreliminaryLinked(): void {
    this.closeLinkDialog();
    this.reloadFn?.();
    this.toast.success('Összekapcsolva', 'Az előzetes projekt sikeresen összekapcsolva.');
  }

  // --- Sync ---

  checkSyncInBackground(): void {
    this.orderSyncService.checkSync()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.pendingSyncCount.set(res.data?.pending_count ?? 0),
        error: () => this.pendingSyncCount.set(0),
      });
  }

  triggerSync(): void {
    if (this.syncing()) return;

    this.syncing.set(true);
    this.orderSyncService.triggerSync()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncing.set(false);
          this.pendingSyncCount.set(0);
          const d = res.data;
          if (d?.created > 0 || d?.moved > 0) {
            const total = (d.created ?? 0) + (d.moved ?? 0);
            this.toast.success('Szinkronizálva', `${total} új projekt szinkronizálva`);
            this.reloadFn?.();
          } else {
            this.toast.info('Naprakész', res.message || 'Nincs új megrendeléses projekt');
          }
        },
        error: (err) => {
          this.syncing.set(false);
          this.pendingSyncCount.set(null);
          this.toast.error('Hiba', err.error?.message || 'Szinkronizálás sikertelen');
          this.logger.error('Sync trigger error', err);
        },
      });
  }
}
