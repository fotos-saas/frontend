import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  signal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

import { SelectionQueueService } from './services/selection-queue.service';
import { WorkflowNavigationService } from './services/workflow-navigation.service';
import { PhotoSelectionState } from './photo-selection.state';
import { ProjectContextHelper } from './helpers/project-context.helper';
import { PhotoSelectionActionsService } from './photo-selection-actions.service';
import { WorkflowStep, WorkflowPhoto, ReviewGroup, getStepInfo } from './models/workflow.models';
import { WebshopInfo } from './components/completed-summary/completed-summary.component';

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
import { DeadlineCountdownComponent } from './components/deadline-countdown/deadline-countdown.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MediaLightboxComponent } from '../../shared/components/media-lightbox/media-lightbox.component';
import { ScheduleReminderDialogComponent, ScheduleReminderResult } from '../../shared/components/schedule-reminder-dialog/schedule-reminder-dialog.component';

/**
 * Photo Selection Component - Tablo fotovalasztasi workflow
 * Lepesek: claiming -> retouch -> tablo -> completed
 *
 * Az uzleti logika a PhotoSelectionActionsService-ben van.
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
    DeadlineCountdownComponent,
    ConfirmDialogComponent,
    MediaLightboxComponent,
    ScheduleReminderDialogComponent,
  ],
  templateUrl: './photo-selection.component.html',
  styleUrl: './photo-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SelectionQueueService, WorkflowNavigationService, PhotoSelectionActionsService],
  host: {
    class: 'flex flex-col flex-1',
  },
})
export class PhotoSelectionComponent {
  private readonly authService = inject(AuthService);
  private readonly queueService = inject(SelectionQueueService);
  private readonly navigationService = inject(WorkflowNavigationService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actions = inject(PhotoSelectionActionsService);

  readonly state = new PhotoSelectionState(this.destroyRef);
  readonly projectContext = new ProjectContextHelper(this.authService);
  readonly showScheduleDialog = signal<boolean>(false);
  readonly reviewLoading = signal<boolean>(false);
  readonly webshopInfo = signal<WebshopInfo | null>(null);

  private readonly project = toSignal(
    this.authService.project$.pipe(
      filter(project => !!project && !!(project.hasGallery || project.tabloGalleryId))
    )
  );

  get stepInfo() {
    return getStepInfo(this.state.currentStep());
  }

  constructor() {
    this.actions.init({
      queueService: this.queueService,
      navigationService: this.navigationService,
      destroyRef: this.destroyRef,
      state: this.state,
      projectContext: this.projectContext,
    });

    this.destroyRef.onDestroy(() => {
      this.state.reset();
      this.queueService.reset();
    });

    effect(() => {
      const project = this.project();
      if (project?.tabloGalleryId) {
        this.actions.loadWorkflow(project.tabloGalleryId);
      }
      if (project?.webshop) {
        this.webshopInfo.set({
          enabled: project.webshop.enabled,
          shopUrl: project.webshop.shop_url,
        });
      }
    });

    // Auto-load review groups when completed
    effect(() => {
      if (this.state.isCompleted() && !this.state.reviewGroups()) {
        const gId = this.projectContext.galleryId();
        if (gId) {
          this.actions.loadReviewGroups(gId, (loading) => this.reviewLoading.set(loading));
        }
      }
    });
  }

  // === SELECTION ===

  onSelectionChange(photoIds: number[]): void {
    this.actions.onSelectionChange(photoIds);
  }

  // === NAVIGATION ===

  onNextStep(): void {
    if (!this.state.canProceed() || !this.projectContext.galleryId()) return;

    if (this.state.currentStep() === 'tablo') {
      this.state.confirmDialog.open();
      return;
    }

    this.actions.navigate('next');
  }

  onPreviousStep(): void {
    if (!this.state.canGoBack() || !this.projectContext.galleryId()) return;
    this.actions.navigate('previous');
  }

  onStepClick(step: WorkflowStep): void {
    const gId = this.projectContext.galleryId();
    if (!gId) return;

    if (this.state.isFinalized()) {
      this.actions.viewStepReadonly(gId, step);
      return;
    }

    this.actions.navigate('move', step);
  }

  onReturnToCompleted(): void {
    if (!this.projectContext.galleryId()) return;
    this.actions.navigate('return');
  }

  // === DIALOGS ===

  onInfoDialogClose(): void { this.state.infoDialog.close(); }

  onInfoIconClick(step: WorkflowStep): void { this.state.infoDialog.open(); }

  onConfirmDialogResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'cancel') {
      this.state.confirmDialog.close();
      return;
    }

    const gId = this.projectContext.galleryId();
    if (!gId) return;

    this.actions.finalizeTabloSelection(gId, this.state.selectedPhotoIds());
  }

  // === MAX SELECTION ===

  onMaxReachedClick(maxCount: number): void {
    this.toast.info(
      'Maximum elerve',
      `Legfeljebb ${maxCount} kepet valaszthatsz ki. Vegy ki egyet, ha masikat szeretnel.`
    );
  }

  // === DESELECT ALL ===

  onDeselectAllClick(): void { this.state.deselectConfirmDialog.open(); }

  onDeselectConfirmResult(result: { action: 'confirm' | 'cancel' }): void {
    this.state.deselectConfirmDialog.close();
    if (result.action === 'confirm') {
      this.actions.onSelectionChange([]);
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

  onReviewPhotoClick(event: { photos: ReviewGroup[]; index: number }): void {
    // Temporary lightbox media from review groups
    const media = event.photos.map(p => ({
      id: p.id,
      url: p.url,
      fileName: p.filename,
    }));
    this.state.lightbox.setTempMedia(media);
    this.state.lightbox.open(event.index);
  }

  // === PAGINATION ===

  onLoadMore(): void { this.actions.onLoadMore(); }

  // === MODIFICATION ===

  onModifyClick(): void {
    const info = this.state.modificationInfo();
    if (!info) return;

    if (info.is_within_free_window) {
      this.state.dialogs.modifyConfirmDialog.open();
    } else {
      this.state.dialogs.modifyPaymentDialog.open();
    }
  }

  onModifyConfirmResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'cancel') {
      this.state.dialogs.modifyConfirmDialog.close();
      return;
    }

    const gId = this.projectContext.galleryId();
    if (!gId) return;
    this.actions.requestModification(gId);
  }

  onPaymentDialogResult(result: { action: 'confirm' | 'cancel' }): void {
    if (result.action === 'cancel') {
      this.state.dialogs.modifyPaymentDialog.close();
      return;
    }

    const gId = this.projectContext.galleryId();
    if (!gId) return;
    this.actions.requestModification(gId);
  }

  // === SCHEDULE DIALOG ===

  onSetPhotoDate(): void { this.showScheduleDialog.set(true); }

  onScheduleDialogResult(result: ScheduleReminderResult): void {
    this.showScheduleDialog.set(false);
    this.actions.onScheduleDialogResult(result);
  }
}
