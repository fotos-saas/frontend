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
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import {
  PartnerService,
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment,
  AlbumsSummary,
  AlbumType
} from '../../../services/partner.service';
import { StepUploadComponent } from '../step-upload/step-upload.component';
import { StepChoiceComponent } from '../step-choice/step-choice.component';
import { StepReviewComponent } from '../step-review/step-review.component';
import { StepAlbumPickerComponent } from '../step-album-picker/step-album-picker.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  WizardStep,
  MatchingMode,
  WizardHeaderComponent,
  WizardStepperComponent,
  WizardFooterComponent
} from '../wizard/index';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';

/**
 * Photo Upload Wizard - Album-alapú verzió.
 * Refaktorált verzió alkomponensekkel.
 */
@Component({
  selector: 'app-photo-upload-wizard',
  standalone: true,
  imports: [
    LucideAngularModule,
    StepUploadComponent,
    StepChoiceComponent,
    StepReviewComponent,
    StepAlbumPickerComponent,
    ConfirmDialogComponent,
    WizardHeaderComponent,
    WizardStepperComponent,
    WizardFooterComponent,
  ],
  templateUrl: './photo-upload-wizard.component.html',
  styleUrl: './photo-upload-wizard.component.scss',
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
