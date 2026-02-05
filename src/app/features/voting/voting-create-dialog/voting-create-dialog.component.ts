import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaUploaderComponent } from '../../../shared/components/media-uploader/media-uploader.component';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

/** Határidő opciók */
export interface DeadlineOption {
  label: string;
  days: number | null;
}

export const DEADLINE_OPTIONS: DeadlineOption[] = [
  { label: 'Nincs határidő', days: null },
  { label: '1 nap', days: 1 },
  { label: '5 nap', days: 5 },
  { label: '1 hét', days: 7 },
  { label: '2 hét', days: 14 },
];

export interface VotingCreateResult {
  action: 'create' | 'cancel';
  data?: {
    title: string;
    description?: string;
    type: 'template' | 'custom';
    options: string[];
    isMultipleChoice: boolean;
    maxVotesPerGuest: number;
    showResultsBeforeVote: boolean;
    closeAt?: string;
    coverImage?: File;
    mediaFiles?: File[];
  };
}

/**
 * Szavazás létrehozó dialógus
 *
 * 2 oszlopos elrendezés:
 * - Bal oszlop: cím, leírás (rich text), borítókép, határidő, beállítások
 * - Jobb oszlop: választási lehetőségek
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezelés (HostListener)
 */
@Component({
  selector: 'app-voting-create-dialog',
  standalone: true,
  imports: [FormsModule, RichTextEditorComponent, MediaUploaderComponent],
  templateUrl: './voting-create-dialog.component.html',
  styleUrls: ['./voting-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingCreateDialogComponent extends BaseDialogComponent {
  /** Signal-based inputs (kompatibilitás) */
  readonly externalErrorMessage = input<string | null>(null);
  readonly externalIsSubmitting = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<VotingCreateResult>();

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
  type: 'template' | 'custom' = 'custom';
  options: string[] = ['', ''];
  isMultipleChoice = false;
  maxVotesPerGuest = 1;
  showResultsBeforeVote = false;
  selectedDeadline: number | null = 7; // Default: 1 hét

  /** Borítókép (legacy) */
  selectedCoverImage = signal<File | null>(null);
  coverImagePreview = signal<string | null>(null);

  /** Média fájlok (max 5, 10MB/kép) */
  selectedMediaFiles = signal<File[]>([]);
  mediaUploadError = signal<string | null>(null);

  /** Határidő opciók */
  readonly deadlineOptions = DEADLINE_OPTIONS;

  // ============================================================================
  // COVER IMAGE HANDLERS
  // ============================================================================

  onCoverImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Max 5MB ellenőrzés
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('A fájl túl nagy! Maximum 5MB megengedett.');
      return;
    }

    // Fájltípus ellenőrzés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Csak JPEG, PNG vagy WebP formátum engedélyezett.');
      return;
    }

    this.selectedCoverImage.set(file);

    // Preview generálás
    const reader = new FileReader();
    reader.onload = () => {
      this.coverImagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Input reset (ugyanaz a fájl újra kiválasztható legyen)
    input.value = '';
  }

  removeCoverImage(): void {
    this.selectedCoverImage.set(null);
    this.coverImagePreview.set(null);
  }

  // ============================================================================
  // MEDIA HANDLERS
  // ============================================================================

  onMediaFilesChange(files: File[]): void {
    this.selectedMediaFiles.set(files);
  }

  onMediaUploadError(error: string): void {
    this.mediaUploadError.set(error);
    setTimeout(() => this.mediaUploadError.set(null), 5000);
  }

  // ============================================================================
  // OPTIONS HANDLERS
  // ============================================================================

  addOption(): void {
    if (this.options.length < 10) {
      this.options = [...this.options, ''];
    }
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options = this.options.filter((_, i) => i !== index);
    }
  }

  updateOption(index: number, value: string): void {
    this.options = this.options.map((opt, i) => i === index ? value : opt);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByDeadline(index: number, option: DeadlineOption): number | null {
    return option.days;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  get isValid(): boolean {
    const hasTitle = this.title.trim().length >= 3;
    const validOptions = this.options.filter(o => o.trim().length > 0);
    const hasEnoughOptions = validOptions.length >= 2;
    return hasTitle && hasEnoughOptions;
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  /**
   * Cancel handler (template-ből hívható)
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
   * Számított határidő dátum
   */
  private getCloseAtDate(): string | undefined {
    if (this.selectedDeadline === null) {
      return undefined;
    }
    const date = new Date();
    date.setDate(date.getDate() + this.selectedDeadline);
    return date.toISOString();
  }

  /**
   * Submit implementáció
   */
  protected override onSubmit(): void {
    if (!this.isValid) {
      this._isSubmitting.set(false);
      return;
    }

    const validOptions = this.options.filter(o => o.trim().length > 0);

    // A submit eredményt a parent fogja kezelni
    this.submitSuccess();
    this.resultEvent.emit({
      action: 'create',
      data: {
        title: this.title.trim(),
        description: this.description.trim() || undefined,
        type: this.type,
        options: validOptions,
        isMultipleChoice: this.isMultipleChoice,
        maxVotesPerGuest: this.isMultipleChoice ? this.maxVotesPerGuest : 1,
        showResultsBeforeVote: this.showResultsBeforeVote,
        closeAt: this.getCloseAtDate(),
        coverImage: this.selectedCoverImage() ?? undefined,
        mediaFiles: this.selectedMediaFiles().length > 0 ? this.selectedMediaFiles() : undefined
      }
    });
  }
}
