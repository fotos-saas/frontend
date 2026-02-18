import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import {
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
import { PhotoUploadWizardActionsService } from './photo-upload-wizard-actions.service';

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
  providers: [PhotoUploadWizardActionsService],
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
  readonly initialAlbum = input<AlbumType | undefined>(undefined);
  readonly close = output<void>();
  readonly completed = output<{ assignedCount: number }>();

  private actions = inject(PhotoUploadWizardActionsService);

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
    this.actions.loadAlbums(this.projectId(), this.albumsSummary, this.loadingAlbums);
    const initial = this.initialAlbum();
    if (initial) {
      this.onAlbumSelected(initial);
    }
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
    const photoIds = this.uploadedPhotos().map(p => p.mediaId);
    this.actions.startAiMatching(
      this.projectId(),
      photoIds,
      this.persons(),
      this.matchResult,
      this.assignments,
      this.matching,
      () => this.currentStep.set('review')
    );
  }

  onChoiceManual(): void {
    this.matchingMode.set('manual');
    this.assignments.set([]);
    this.currentStep.set('review');
  }

  // === ALBUM HANDLERS ===
  onAlbumSelected(album: AlbumType): void {
    this.uploadedPhotos.set([]);
    this.persons.set([]);
    this.assignments.set([]);
    this.selectedAlbum.set(album);
    this.actions.loadPersons(this.projectId(), this.persons);
    this.actions.loadAlbumDetails(this.projectId(), album, this.uploadedPhotos);
    this.currentStep.set('upload');
  }

  // === UPLOAD HANDLERS ===
  onFilesSelected(files: File[]): void {
    const album = this.selectedAlbum();
    if (!album) return;
    this.actions.uploadFiles(
      this.projectId(), album, files,
      this.uploadedPhotos, this.uploading, this.uploadProgress
    );
  }

  onRemovePhoto(mediaId: number): void {
    this.actions.removePhoto(this.projectId(), mediaId, this.uploadedPhotos);
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
    this.actions.finalize(
      this.projectId(),
      this.assignments(),
      this.saving,
      (assignedCount) => this.completed.emit({ assignedCount })
    );
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
      const data = this.deleteConfirmData();
      if (!data) return;
      this.actions.confirmDelete(
        this.projectId(), data.mediaIds,
        this.uploadedPhotos, this.assignments, this.saving,
        this.deleteConfirmData, this.showDeleteConfirm
      );
    } else {
      this.showDeleteConfirm.set(false);
      this.deleteConfirmData.set(null);
    }
  }

  // === DIALOG ===
  onClose(): void {
    if (this.processing()) return;
    this.close.emit();
  }
}
