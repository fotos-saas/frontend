import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  effect,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Poll, PollMedia } from '../../../core/services/voting.service';
import { DEADLINE_OPTIONS } from '../voting-create-dialog/voting-create-dialog.component';
import { MediaUploaderComponent } from '../../../shared/components/media-uploader/media-uploader.component';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

export interface VotingEditResult {
  action: 'save' | 'cancel';
  data?: {
    title: string;
    description?: string;
    isMultipleChoice: boolean;
    maxVotesPerGuest: number;
    showResultsBeforeVote: boolean;
    closeAt?: string | null;
    deleteMediaIds?: number[];
    mediaFiles?: File[];
  };
}

/**
 * Szavazás szerkesztő dialógus
 *
 * Meglévő szavazás szerkesztése.
 * Az opciók NEM szerkeszthetők, mert már lehetnek szavazatok.
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezelés (HostListener)
 */
@Component({
  selector: 'app-voting-edit-dialog',
  standalone: true,
  imports: [FormsModule, MediaUploaderComponent, RichTextEditorComponent],
  templateUrl: './voting-edit-dialog.component.html',
  styleUrls: ['./voting-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingEditDialogComponent extends BaseDialogComponent {
  /** Signal-based inputs */
  readonly poll = input.required<Poll>();
  readonly externalErrorMessage = input<string | null>(null);
  readonly externalIsSubmitting = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<VotingEditResult>();

  constructor() {
    super();
    // Sync external inputs to internal signals
    effect(() => {
      const errorMsg = this.externalErrorMessage();
      if (errorMsg !== null) {
        this._errorMessage.set(errorMsg);
      }
    });
    effect(() => {
      const submitting = this.externalIsSubmitting();
      if (submitting) {
        this._isSubmitting.set(submitting);
      }
    });
  }

  /** Form adatok */
  title = '';
  description = '';
  isMultipleChoice = false;
  maxVotesPerGuest = 1;
  showResultsBeforeVote = false;
  selectedDeadline: number | null = null;

  /** Határidő opciók */
  readonly deadlineOptions = DEADLINE_OPTIONS;

  /** Meglévő média fájlok (törlésre jelöltek kiszűrve) */
  existingMedia = signal<PollMedia[]>([]);
  /** Törlésre jelölt média ID-k */
  deleteMediaIds = signal<number[]>([]);
  /** Új média fájlok */
  newMediaFiles = signal<File[]>([]);
  /** Média feltöltési hiba */
  mediaUploadError = signal<string | null>(null);

  // ============================================================================
  // LIFECYCLE - Override
  // ============================================================================

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.loadPollData();
  }

  /**
   * Poll adatok betöltése
   */
  private loadPollData(): void {
    const pollData = this.poll();
    this.title = pollData.title;
    this.description = pollData.description || '';
    this.isMultipleChoice = pollData.isMultipleChoice;
    // Explicit ellenőrzés: ha 0, null vagy undefined → 1
    this.maxVotesPerGuest = pollData.maxVotesPerGuest > 0 ? pollData.maxVotesPerGuest : 1;
    this.showResultsBeforeVote = pollData.showResultsBeforeVote;
    // Határidő: null = nincs, egyébként számoljuk ki a hátralévő napokat
    this.selectedDeadline = this.calculateDeadlineDays();
    // Meglévő média betöltése
    this.existingMedia.set(pollData.media || []);
  }

  /**
   * Számított határidő napok a meglévő closeAt-ből
   */
  private calculateDeadlineDays(): number | null {
    const pollData = this.poll();
    if (!pollData.closeAt) {
      return null;
    }
    const closeDate = new Date(pollData.closeAt);
    const now = new Date();
    const diffMs = closeDate.getTime() - now.getTime();
    if (diffMs <= 0) {
      return null; // Lejárt
    }
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    // Legközelebbi opció keresése
    const options = [1, 5, 7, 14];
    const closest = options.reduce((prev, curr) =>
      Math.abs(curr - diffDays) < Math.abs(prev - diffDays) ? curr : prev
    );
    return closest;
  }

  /**
   * Számított határidő dátum
   */
  private getCloseAtDate(): string | null {
    if (this.selectedDeadline === null) {
      return null;
    }
    const date = new Date();
    date.setDate(date.getDate() + this.selectedDeadline);
    return date.toISOString();
  }

  // ============================================================================
  // TRACKBY FUNCTIONS
  // ============================================================================

  trackByOptionId(index: number, option: { id: number }): number {
    return option.id;
  }

  trackByDeadline(index: number, option: { days: number | null }): number | null {
    return option.days;
  }

  trackByMediaId(_index: number, media: PollMedia): number {
    return media.id;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  readonly isValid = computed(() => this.title.trim().length >= 3);

  readonly hasChanges = computed(() => {
    const pollData = this.poll();
    const originalDeadline = this.calculateDeadlineDays();
    return (
      this.title.trim() !== pollData.title ||
      (this.description.trim() || undefined) !== (pollData.description || undefined) ||
      this.isMultipleChoice !== pollData.isMultipleChoice ||
      this.maxVotesPerGuest !== (pollData.maxVotesPerGuest || 1) ||
      this.showResultsBeforeVote !== pollData.showResultsBeforeVote ||
      this.selectedDeadline !== originalDeadline ||
      this.deleteMediaIds().length > 0 ||
      this.newMediaFiles().length > 0
    );
  });

  /**
   * Maximális feltölthető új képek száma
   * (5 - meglévő képek száma + törlésre jelöltek)
   */
  readonly maxNewFiles = computed(() => {
    const currentCount = this.existingMedia().length;
    return Math.max(0, 5 - currentCount);
  });

  // ============================================================================
  // MEDIA HANDLERS
  // ============================================================================

  removeExistingMedia(media: PollMedia): void {
    this.deleteMediaIds.update(ids => [...ids, media.id]);
    this.existingMedia.update(items => items.filter(m => m.id !== media.id));
  }

  onNewMediaFilesChange(files: File[]): void {
    this.newMediaFiles.set(files);
  }

  onMediaUploadError(error: string): void {
    this.mediaUploadError.set(error);
    setTimeout(() => this.mediaUploadError.set(null), 5000);
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  /**
   * Cancel handler
   */
  onCancel(): void {
    this.close();
  }

  /**
   * Close implementáció
   */
  protected override onClose(): void {
    this.resultEvent.emit({ action: 'cancel' });
  }

  /**
   * Submit implementáció
   */
  protected override onSubmit(): void {
    if (!this.isValid()) {
      this._isSubmitting.set(false);
      return;
    }

    // A submit eredményt a parent fogja kezelni
    this.submitSuccess();
    this.resultEvent.emit({
      action: 'save',
      data: {
        title: this.title.trim(),
        description: this.description.trim() || undefined,
        isMultipleChoice: this.isMultipleChoice,
        maxVotesPerGuest: this.isMultipleChoice ? this.maxVotesPerGuest : 1,
        showResultsBeforeVote: this.showResultsBeforeVote,
        closeAt: this.getCloseAtDate(),
        deleteMediaIds: this.deleteMediaIds().length > 0 ? this.deleteMediaIds() : undefined,
        mediaFiles: this.newMediaFiles().length > 0 ? this.newMediaFiles() : undefined
      }
    });
  }
}
