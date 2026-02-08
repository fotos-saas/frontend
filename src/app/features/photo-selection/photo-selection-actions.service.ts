import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';

import { TabloWorkflowService } from './services/tablo-workflow.service';
import { SelectionQueueService } from './services/selection-queue.service';
import { WorkflowNavigationService } from './services/workflow-navigation.service';
import { PhotoSelectionState } from './photo-selection.state';
import { ProjectContextHelper } from './helpers/project-context.helper';
import { WorkflowStep, StepData } from './models/workflow.models';
import { ScheduleReminderResult } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';

/**
 * PhotoSelectionActionsService - Uzleti logika a photo-selection komponenshez.
 *
 * Kezeli: workflow betoltes, navigacio, veglegesites, schedule dialog, pagination.
 * Nem providedIn: 'root' - komponens szintu scope kell (SelectionQueueService, WorkflowNavigationService).
 */
@Injectable()
export class PhotoSelectionActionsService {
  private readonly workflowService = inject(TabloWorkflowService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(TabloStorageService);
  private readonly authService = inject(AuthService);

  private queueService!: SelectionQueueService;
  private navigationService!: WorkflowNavigationService;
  private destroyRef!: DestroyRef;
  private state!: PhotoSelectionState;
  private projectContext!: ProjectContextHelper;

  init(deps: {
    queueService: SelectionQueueService;
    navigationService: WorkflowNavigationService;
    destroyRef: DestroyRef;
    state: PhotoSelectionState;
    projectContext: ProjectContextHelper;
  }): void {
    this.queueService = deps.queueService;
    this.navigationService = deps.navigationService;
    this.destroyRef = deps.destroyRef;
    this.state = deps.state;
    this.projectContext = deps.projectContext;
  }

  // === CORE WORKFLOW ===

  loadWorkflow(galleryId: number): void {
    this.state.startLoading();
    this.workflowService.loadStepData(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.state.updateFromStepData(data);
        this.state.finishLoading();
        this.checkInfoDialog();
      },
      error: (err) => {
        this.logger.error('Galeria workflow betoltesi hiba', err);
        this.state.loadingError(err.message || 'Hiba a betoltes soran');
      }
    });
  }

  checkInfoDialog(): void {
    const step = this.state.currentStep();
    const projectId = this.projectContext.projectId();

    if (step !== 'completed' && projectId) {
      if (!this.storage.isStepInfoShown(projectId, step)) {
        this.state.infoDialog.open();
      }
    }
  }

  // === SELECTION ===

  onSelectionChange(photoIds: number[]): void {
    this.state.updateSelection(photoIds);

    const gId = this.projectContext.galleryId();
    if (!gId) return;

    this.queueService.enqueue(gId, photoIds, this.state.currentStep());
  }

  // === NAVIGATION ===

  navigate(type: 'next' | 'previous' | 'move' | 'return', step?: WorkflowStep): void {
    const gId = this.projectContext.galleryId();
    if (!gId) return;

    const callbacks = {
      onStart: () => this.state.startLoading(),
      onSuccess: (data: StepData) => {
        this.state.updateFromStepData(data);
        this.state.finishLoading();
        this.checkInfoDialog();
      },
      onError: (message: string) => this.state.loadingError(message),
    };

    switch (type) {
      case 'next': this.navigationService.nextStep(gId, callbacks); break;
      case 'previous': this.navigationService.previousStep(gId, callbacks); break;
      case 'move': this.navigationService.moveToStep(gId, step!, callbacks); break;
      case 'return': this.navigationService.returnToCompleted(gId, callbacks); break;
    }
  }

  viewStepReadonly(galleryId: number, step: WorkflowStep): void {
    if (step === 'completed' || step === this.state.currentStep()) {
      this.state.returnToCompleted();
      return;
    }

    this.navigationService.viewStepReadonly(galleryId, step, {
      onStart: () => this.state.startLoading(),
      onSuccess: (data) => {
        this.state.pagination.setAllPhotos(data.visible_photos, data.visible_photos.length);
        this.state.selectedPhotoIds.set(data.selected_photos);
        this.state.allowMultiple.set(data.step_metadata.allow_multiple);
        this.state.maxSelection.set(data.step_metadata.max_selection);
        this.state.viewStep(step);
        this.state.finishLoading();
      },
      onError: (message) => this.state.loadingError(message),
    });
  }

  // === FINALIZATION ===

  finalizeTabloSelection(galleryId: number, photoIds: number[]): void {
    if (photoIds.length !== 1) {
      this.state.confirmDialog.submitError('Pontosan egy kepet kell kivalasztani');
      return;
    }

    this.state.confirmDialog.startSubmit();

    this.workflowService.finalizeTabloSelection(galleryId, photoIds[0]).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.workflowService.loadStepData(galleryId))
    ).subscribe({
      next: (data: StepData) => {
        this.state.confirmDialog.submitSuccess();
        this.state.updateFromStepData(data);
        this.toast.success('Siker!', 'Kepvalasztas sikeresen veglegesitve!');
      },
      error: (err) => {
        this.logger.error('Veglegesites hiba', err);
        this.state.confirmDialog.submitError(err.message);
        this.toast.error('Veglegesites hiba', err.message || 'Hiba a veglegesites soran');
      }
    });
  }

  // === MODIFICATION ===

  requestModification(galleryId: number): void {
    this.state.dialogs.modifyConfirmDialog.startSubmit();

    this.workflowService.requestModification(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.workflowService.loadStepData(galleryId))
    ).subscribe({
      next: (data) => {
        this.state.dialogs.modifyConfirmDialog.submitSuccess();
        this.state.dialogs.modifyPaymentDialog.close();
        this.state.modificationInfo.set(null);
        this.state.updateFromStepData(data);
        this.state.finishLoading();
        this.toast.success('Siker!', 'A kepvalasztas ujra szerkesztheto.');
      },
      error: (err) => {
        this.logger.error('Modositas kerelem hiba', err);
        this.state.dialogs.modifyConfirmDialog.submitError(err.message);
        this.state.dialogs.modifyPaymentDialog.submitError(err.message);
        this.toast.error('Hiba', err.message || 'Nem sikerult a modositas kerelem.');
      }
    });
  }

  // === REVIEW ===

  loadReviewGroups(galleryId: number, onLoadingChange: (loading: boolean) => void): void {
    onLoadingChange(true);
    this.workflowService.loadStepData(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        if (data.review_groups) {
          this.state.reviewGroups.set(data.review_groups);
        }
        onLoadingChange(false);
      },
      error: (err) => {
        this.logger.error('Review groups betoltes hiba', err);
        this.toast.error('Hiba', 'Nem sikerult betolteni a kepeket.');
        onLoadingChange(false);
      }
    });
  }

  // === PAGINATION ===

  onLoadMore(): void {
    const gId = this.projectContext.galleryId();
    if (!gId || this.state.isLoadingMore()) return;

    this.state.startLoadingMore();

    const currentCount = this.state.visiblePhotos().length;
    const allPhotos = this.state.allPhotos();
    const pageSize = this.state.paginationConfig().pageSize;
    const nextPagePhotos = allPhotos.slice(currentCount, currentCount + pageSize);

    setTimeout(() => {
      this.state.loadMorePhotos(nextPagePhotos);
    }, 300);
  }

  // === SCHEDULE DIALOG ===

  onScheduleDialogResult(result: ScheduleReminderResult): void {
    if (result.action === 'save' && result.date) {
      this.authService.updatePhotoDate(result.date).subscribe({
        next: () => {
          this.toast.success('Mentve!', 'A fotozas idopontja sikeresen beallitva.');
        },
        error: (err) => {
          this.logger.error('Failed to save photo date', err);
          this.toast.error('Hiba', 'Nem sikerult menteni az idopontot.');
        }
      });
    }
  }
}
