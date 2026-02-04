import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../../shared/constants/icons.constants';
import {
  PartnerService,
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment,
  AlbumsSummary,
  AlbumType
} from '../../services/partner.service';
import { StepUploadComponent } from './step-upload.component';
import { StepChoiceComponent } from './step-choice.component';
import { StepReviewComponent } from './step-review.component';
import { StepAlbumPickerComponent } from './step-album-picker.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  WizardStep,
  MatchingMode,
  WizardHeaderComponent,
  WizardStepperComponent,
  WizardFooterComponent
} from './wizard/index';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Photo Upload Wizard - Album-alapú verzió.
 * Refaktorált verzió alkomponensekkel.
 */
@Component({
  selector: 'app-photo-upload-wizard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    StepUploadComponent,
    StepChoiceComponent,
    StepReviewComponent,
    StepAlbumPickerComponent,
    ConfirmDialogComponent,
    WizardHeaderComponent,
    WizardStepperComponent,
    WizardFooterComponent
  ],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="wizard-panel" (click)="$event.stopPropagation()">
        <!-- Header -->
        <app-wizard-header
          title="Képek feltöltése"
          [subtitle]="projectName()"
          (close)="onClose()"
        />

        <!-- Album badge -->
        @if (currentStep() !== 'albums' && selectedAlbum()) {
          <div class="album-badge">
            <lucide-icon [name]="selectedAlbum() === 'students' ? ICONS.GRADUATION_CAP : ICONS.BRIEFCASE" [size]="16" />
            <span>{{ selectedAlbum() === 'students' ? 'Diákok' : 'Tanárok' }}</span>
          </div>
        }

        <!-- Stepper -->
        @if (currentStep() !== 'albums') {
          <app-wizard-stepper
            [currentStep]="currentStep()"
            [completedSteps]="completedSteps()"
            (stepClick)="goToStep($event)"
          />
        }

        <!-- Content -->
        <div class="wizard-content">
          @switch (currentStep()) {
            @case ('albums') {
              @if (loadingAlbums()) {
                <div class="loading-state">
                  <div class="spinner spinner--lg"></div>
                  <p>Albumok betöltése...</p>
                </div>
              } @else if (albumsSummary()) {
                <app-step-album-picker
                  [albums]="albumsSummary()!"
                  (albumSelected)="onAlbumSelected($event)"
                />
              }
            }
            @case ('upload') {
              <app-step-upload
                [uploadedPhotos]="uploadedPhotos()"
                [uploading]="uploading()"
                [uploadProgress]="uploadProgress()"
                (filesSelected)="onFilesSelected($event)"
                (removePhoto)="onRemovePhoto($event)"
                (removeAllPhotos)="onRemoveAllPhotos()"
                (continueToMatching)="goToChoice()"
              />
            }
            @case ('choice') {
              <app-step-choice
                [photoCount]="uploadedPhotos().length"
                [loading]="matching()"
                (aiSelected)="onChoiceAi()"
                (manualSelected)="onChoiceManual()"
              />
            }
            @case ('review') {
              <app-step-review
                [projectId]="projectId()"
                [persons]="persons()"
                [matchResult]="matchResult()"
                [uploadedPhotos]="uploadedPhotos()"
                [assignments]="assignments()"
                [unassignedPhotos]="unassignedPhotos()"
                [saving]="saving()"
                (assignmentsChange)="onAssignmentsChange($event)"
                (finalize)="onFinalize()"
                (deleteAllUnassigned)="onDeleteAllUnassigned()"
              />
            }
          }
        </div>

        <!-- Delete confirmation dialog -->
        @if (showDeleteConfirm()) {
          <app-confirm-dialog
            title="Törlés megerősítése"
            [message]="deleteConfirmMessage()"
            confirmText="Törlés"
            confirmType="danger"
            (resultEvent)="onDeleteConfirmResult($event)"
          />
        }

        <!-- Footer -->
        @if (currentStep() !== 'albums') {
          <app-wizard-footer
            [backLabel]="currentStep() === 'upload' ? 'Albumok' : 'Vissza'"
            [continueLabel]="continueButtonLabel()"
            [showContinue]="currentStep() !== 'choice'"
            [showArrow]="currentStep() !== 'review'"
            [canContinue]="canContinue()"
            [processing]="processing()"
            (back)="goBack()"
            (continue)="onContinue()"
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .wizard-panel {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .album-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 20px;
      margin: 0 auto;
      width: fit-content;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #166534;
    }

    .wizard-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      min-height: 400px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      color: #64748b;
    }

    .loading-state p {
      margin: 0;
      font-size: 0.9375rem;
    }

    .spinner--lg {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--color-primary, #1e3a5f);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .wizard-content {
        padding: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoUploadWizardComponent implements OnInit {
  readonly ICONS = ICONS;

  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.onClose());

  readonly projectId = input.required<number>();
  readonly projectName = input<string>('');
  readonly close = output<void>();
  readonly completed = output<{ assignedCount: number }>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  // === STATE ===
  currentStep = signal<WizardStep>('albums');
  uploadedPhotos = signal<UploadedPhoto[]>([]);
  persons = signal<TabloPersonItem[]>([]);
  matchResult = signal<MatchResult | null>(null);
  assignments = signal<PhotoAssignment[]>([]);
  matchingMode = signal<MatchingMode>(null);

  albumsSummary = signal<AlbumsSummary | null>(null);
  selectedAlbum = signal<AlbumType | null>(null);
  loadingAlbums = signal(true);

  showDeleteConfirm = signal(false);
  deleteConfirmData = signal<{ mediaIds: number[]; count: number } | null>(null);

  uploading = signal(false);
  uploadProgress = signal(0);
  matching = signal(false);
  saving = signal(false);

  // === COMPUTED ===
  readonly unassignedPhotos = computed(() => {
    const assignedMediaIds = new Set(this.assignments().map(a => a.mediaId));
    return this.uploadedPhotos().filter(p => !assignedMediaIds.has(p.mediaId));
  });

  readonly processing = computed(() =>
    this.uploading() || this.matching() || this.saving()
  );

  readonly canContinue = computed(() => {
    switch (this.currentStep()) {
      case 'upload':
        return this.uploadedPhotos().length > 0;
      case 'review':
        return this.assignments().length > 0 || this.unassignedPhotos().length > 0;
      default:
        return false;
    }
  });

  readonly continueButtonLabel = computed(() => {
    switch (this.currentStep()) {
      case 'upload':
        return 'Tovább a párosításhoz';
      case 'review':
        return this.saving() ? 'Mentés...' : 'Mentés és befejezés';
      default:
        return 'Tovább';
    }
  });

  readonly completedSteps = computed<WizardStep[]>(() => {
    const steps: WizardStep[] = [];
    if (this.uploadedPhotos().length > 0 && this.currentStep() !== 'upload') {
      steps.push('upload');
    }
    if (this.matchingMode() !== null && this.currentStep() === 'review') {
      steps.push('choice');
    }
    return steps;
  });

  readonly deleteConfirmMessage = computed(() => {
    const data = this.deleteConfirmData();
    if (!data) return '';
    return `Biztosan törlöd a ${data.count} képet? Ez a művelet nem vonható vissza.`;
  });

  // === LIFECYCLE ===
  ngOnInit(): void {
    this.loadAlbums();
  }

  // === DATA LOADING ===
  private loadAlbums(): void {
    this.loadingAlbums.set(true);
    this.partnerService.getAlbums(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.albumsSummary.set(response.albums);
          this.loadingAlbums.set(false);
        },
        error: () => this.loadingAlbums.set(false)
      });
  }

  private loadPersons(): void {
    this.partnerService.getProjectPersons(this.projectId(), false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.persons.set(response.data)
      });
  }

  private loadAlbumDetails(album: AlbumType): void {
    this.partnerService.getAlbum(this.projectId(), album)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.uploadedPhotos.set(response.album.photos)
      });
  }

  // === NAVIGATION ===
  goToStep(stepId: WizardStep): void {
    this.currentStep.set(stepId);
  }

  goBack(): void {
    const step = this.currentStep();
    if (step === 'review') this.currentStep.set('choice');
    else if (step === 'choice') this.currentStep.set('upload');
    else if (step === 'upload') this.currentStep.set('albums');
  }

  goToChoice(): void {
    this.currentStep.set('choice');
  }

  onContinue(): void {
    if (this.currentStep() === 'upload') this.goToChoice();
    else if (this.currentStep() === 'review') this.onFinalize();
  }

  // === CHOICE HANDLERS ===
  onChoiceAi(): void {
    this.matchingMode.set('ai');
    this.matching.set(true);

    const photoIds = this.uploadedPhotos().map(p => p.mediaId);
    this.partnerService.matchPhotos(this.projectId(), photoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.matchResult.set(response);
          this.matching.set(false);
          this.buildInitialAssignments(response);
          setTimeout(() => this.currentStep.set('review'), 300);
        },
        error: () => this.matching.set(false)
      });
  }

  onChoiceManual(): void {
    this.matchingMode.set('manual');
    this.assignments.set([]);
    this.currentStep.set('review');
  }

  private buildInitialAssignments(result: MatchResult): void {
    const newAssignments: PhotoAssignment[] = [];
    for (const match of result.matches) {
      if (match.mediaId) {
        const person = this.persons().find(p => p.name === match.name);
        if (person) {
          newAssignments.push({ personId: person.id, mediaId: match.mediaId });
        }
      }
    }
    this.assignments.set(newAssignments);
  }

  // === ALBUM HANDLERS ===
  onAlbumSelected(album: AlbumType): void {
    this.uploadedPhotos.set([]);
    this.persons.set([]);
    this.assignments.set([]);
    this.selectedAlbum.set(album);
    this.loadPersons();
    this.loadAlbumDetails(album);
    this.currentStep.set('upload');
  }

  // === UPLOAD HANDLERS ===
  onFilesSelected(files: File[]): void {
    const album = this.selectedAlbum();
    if (!album) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);

    const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
    const upload$ = isZip
      ? this.partnerService.uploadZipToAlbum(this.projectId(), album, files[0])
      : this.partnerService.uploadToAlbum(this.projectId(), album, files);

    upload$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.uploadedPhotos.update(current => [...response.photos, ...current]);
          this.uploading.set(false);
          this.uploadProgress.set(100);
        },
        error: () => this.uploading.set(false)
      });
  }

  onRemovePhoto(mediaId: number): void {
    this.partnerService.deletePendingPhotos(this.projectId(), [mediaId])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.uploadedPhotos.update(photos => photos.filter(p => p.mediaId !== mediaId));
        }
      });
  }

  onRemoveAllPhotos(): void {
    const mediaIds = this.uploadedPhotos().map(p => p.mediaId);
    if (mediaIds.length === 0) return;
    this.deleteConfirmData.set({ mediaIds, count: mediaIds.length });
    this.showDeleteConfirm.set(true);
  }

  // === REVIEW HANDLERS ===
  onAssignmentsChange(newAssignments: PhotoAssignment[]): void {
    this.assignments.set(newAssignments);
  }

  onFinalize(): void {
    this.saving.set(true);
    this.partnerService.assignPhotos(this.projectId(), this.assignments())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.completed.emit({ assignedCount: response.assignedCount });
        },
        error: () => this.saving.set(false)
      });
  }

  onDeleteAllUnassigned(): void {
    const unassignedMediaIds = this.unassignedPhotos().map(p => p.mediaId);
    if (unassignedMediaIds.length === 0) return;
    this.deleteConfirmData.set({ mediaIds: unassignedMediaIds, count: unassignedMediaIds.length });
    this.showDeleteConfirm.set(true);
  }

  // === DELETE CONFIRM ===
  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.confirmDelete();
    } else {
      this.cancelDelete();
    }
  }

  private confirmDelete(): void {
    const data = this.deleteConfirmData();
    if (!data) return;

    this.showDeleteConfirm.set(false);
    this.saving.set(true);

    this.partnerService.deletePendingPhotos(this.projectId(), data.mediaIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const deletedSet = new Set(data.mediaIds);
          this.uploadedPhotos.update(photos => photos.filter(p => !deletedSet.has(p.mediaId)));
          this.assignments.update(a => a.filter(x => !deletedSet.has(x.mediaId)));
          this.saving.set(false);
          this.deleteConfirmData.set(null);
        },
        error: () => {
          this.saving.set(false);
          this.deleteConfirmData.set(null);
        }
      });
  }

  private cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteConfirmData.set(null);
  }

  // === DIALOG ===
  onClose(): void {
    if (this.processing()) return;
    this.close.emit();
  }
}
