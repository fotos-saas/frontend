import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  signal,
  effect,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { TabloStorageService } from '../../core/services/tablo-storage.service';

import { TabloWorkflowService } from './services/tablo-workflow.service';
import { SelectionQueueService } from './services/selection-queue.service';
import { WorkflowNavigationService } from './services/workflow-navigation.service';
import { PhotoSelectionState } from './photo-selection.state';
import { ProjectContextHelper } from './helpers/project-context.helper';
import { WorkflowStep, WorkflowPhoto, StepData, getStepInfo } from './models/workflow.models';

// Components
import { StepIndicatorComponent } from './components/step-indicator/step-indicator.component';
import { SelectionGridComponent } from './components/selection-grid/selection-grid.component';
import { StepInfoDialogComponent } from './components/step-info-dialog/step-info-dialog.component';
import { CompletedSummaryComponent } from './components/completed-summary/completed-summary.component';
import { InactiveStateComponent } from './components/inactive-state/inactive-state.component';
import { NavigationFooterComponent } from './components/navigation-footer/navigation-footer.component';
import { LoadingSkeletonComponent } from './components/loading-skeleton/loading-skeleton.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { WorkflowHeaderComponent } from './components/workflow-header/workflow-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent } from '../../shared/components/media-lightbox/media-lightbox.component';
import { ScheduleReminderDialogComponent, ScheduleReminderResult } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';

/**
 * Photo Selection Component - Tabló fotóválasztási workflow
 * Lépések: claiming → retouch → tablo → completed
 */
@Component({
  selector: 'app-photo-selection',
  standalone: true,
  imports: [
    StepIndicatorComponent,
    SelectionGridComponent,
    StepInfoDialogComponent,
    CompletedSummaryComponent,
    InactiveStateComponent,
    NavigationFooterComponent,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
    WorkflowHeaderComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
    ScheduleReminderDialogComponent,
  ],
  templateUrl: './photo-selection.component.html',
  styleUrl: './photo-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SelectionQueueService, WorkflowNavigationService],
  host: {
    class: 'flex flex-col flex-1', // Flexbox child - kitölti a rendelkezésre álló helyet
  },
})
export class PhotoSelectionComponent {
  private readonly authService = inject(AuthService);
  private readonly workflowService = inject(TabloWorkflowService);
  private readonly queueService = inject(SelectionQueueService);
  private readonly navigationService = inject(WorkflowNavigationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(TabloStorageService);

  readonly state = new PhotoSelectionState(this.destroyRef);
  readonly projectContext = new ProjectContextHelper(this.authService);
  readonly showScheduleDialog = signal<boolean>(false);

  /** Projekt signal (reactive observable → signal) */
  private readonly project = toSignal(
    this.authService.project$.pipe(
      filter(project => !!project && !!(project.hasGallery || project.tabloGalleryId))
    )
  );

  get stepInfo() {
    return getStepInfo(this.state.currentStep());
  }

  constructor() {
    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.state.reset();
      this.queueService.reset();
    });

    // Effect: reagálás a projekt változásra
    effect(() => {
      const project = this.project();
      if (project?.tabloGalleryId) {
        this.loadWorkflow(project.tabloGalleryId);
      }
    });
  }

  // === CORE WORKFLOW ===

  private loadWorkflow(galleryId: number): void {
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
        this.logger.error('Galéria workflow betöltési hiba', err);
        this.state.loadingError(err.message || 'Hiba a betöltés során');
      }
    });
  }

  private checkInfoDialog(): void {
    const step = this.state.currentStep();
    const projectId = this.projectContext.projectId();

    if (step !== 'completed' && projectId) {
      // Projekt-specifikus ellenőrzés
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

    // Signal-alapú queue service kezeli a debounce-t és a retry-t
    this.queueService.enqueue(gId, photoIds, this.state.currentStep());
  }

  // === NAVIGATION ===

  onNextStep(): void {
    if (!this.state.canProceed() || !this.projectContext.galleryId()) return;

    if (this.state.currentStep() === 'tablo') {
      this.state.confirmDialog.open();
      return;
    }

    this.navigate('next');
  }

  onPreviousStep(): void {
    if (!this.state.canGoBack() || !this.projectContext.galleryId()) return;
    this.navigate('previous');
  }

  onStepClick(step: WorkflowStep): void {
    const gId = this.projectContext.galleryId();
    if (!gId) return;

    if (this.state.isFinalized()) {
      this.viewStepReadonly(gId, step);
      return;
    }

    this.navigate('move', step);
  }

  onReturnToCompleted(): void {
    const gId = this.projectContext.galleryId();
    if (!gId) return;
    this.navigate('return');
  }

  private navigate(type: 'next' | 'previous' | 'move' | 'return', step?: WorkflowStep): void {
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

  private viewStepReadonly(galleryId: number, step: WorkflowStep): void {
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

  // === DIALOGS ===

  onInfoDialogClose(): void {
    this.state.infoDialog.close();
  }

  onInfoIconClick(step: WorkflowStep): void {
    this.state.infoDialog.open();
  }

  onConfirmDialogResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'cancel') {
      this.state.confirmDialog.close();
      return;
    }

    const gId = this.projectContext.galleryId();
    if (!gId) return;

    const photoIds = this.state.selectedPhotoIds();
    if (photoIds.length !== 1) {
      this.state.confirmDialog.submitError('Pontosan egy képet kell kiválasztani');
      return;
    }

    this.state.confirmDialog.startSubmit();

    this.workflowService.finalizeTabloSelection(gId, photoIds[0]).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.workflowService.loadStepData(gId))
    ).subscribe({
      next: (data: StepData) => {
        this.state.confirmDialog.submitSuccess();
        this.state.updateFromStepData(data);
        this.toast.success('Siker!', 'Képválasztás sikeresen véglegesítve!');
      },
      error: (err) => {
        this.logger.error('Véglegesítés hiba', err);
        this.state.confirmDialog.submitError(err.message);
        this.toast.error('Véglegesítés hiba', err.message || 'Hiba a véglegesítés során');
      }
    });
  }

  // === MAX SELECTION ===

  onMaxReachedClick(maxCount: number): void {
    this.toast.info(
      'Maximum elérve',
      `Legfeljebb ${maxCount} képet választhatsz ki. Végy ki egyet, ha másikat szeretnél.`
    );
  }

  // === DESELECT ALL ===

  onDeselectAllClick(): void {
    this.state.deselectConfirmDialog.open();
  }

  onDeselectConfirmResult(result: { action: 'confirm' | 'cancel' }): void {
    this.state.deselectConfirmDialog.close();

    if (result.action === 'confirm') {
      // Töröljük az összes kijelölést
      this.onSelectionChange([]);
    }
  }

  // === LIGHTBOX ===

  onZoomClick(event: { photo: WorkflowPhoto; index: number }): void {
    this.state.openLightbox(event.index);
  }

  onTabloClick(photo: WorkflowPhoto): void {
    const index = this.state.visiblePhotos().findIndex(p => p.id === photo.id);
    this.state.openLightbox(index >= 0 ? index : 0);
  }

  // === US-008: PAGINATION ===

  onLoadMore(): void {
    const gId = this.projectContext.galleryId();
    if (!gId || this.state.isLoadingMore()) return;

    this.state.startLoadingMore();

    // Pagination: betöltjük a következő oldalt az allPhotos-ból
    const currentCount = this.state.visiblePhotos().length;
    const allPhotos = this.state.allPhotos();
    const pageSize = this.state.paginationConfig().pageSize;

    // Kiszámoljuk a következő oldal fotóit
    const nextPagePhotos = allPhotos.slice(currentCount, currentCount + pageSize);

    // Szimulált delay a jobb UX-ért (a backend már betöltötte az összes fotót)
    setTimeout(() => {
      this.state.loadMorePhotos(nextPagePhotos);
    }, 300);
  }

  // === SCHEDULE DIALOG ===

  onSetPhotoDate(): void {
    this.showScheduleDialog.set(true);
  }

  onScheduleDialogResult(result: ScheduleReminderResult): void {
    this.showScheduleDialog.set(false);

    if (result.action === 'save' && result.date) {
      this.authService.updatePhotoDate(result.date).subscribe({
        next: () => {
          this.toast.success('Mentve!', 'A fotózás időpontja sikeresen beállítva.');
        },
        error: (err) => {
          this.logger.error('Failed to save photo date', err);
          this.toast.error('Hiba', 'Nem sikerült menteni az időpontot.');
        }
      });
    }
  }
}
