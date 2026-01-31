import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  inject,
  DestroyRef,
  signal,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import DOMPurify from 'dompurify';
import { ForumService, CreateDiscussionRequest, PostMedia } from '../../../core/services/forum.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor/media-editor.component';

/**
 * Sablon interface (minimális)
 */
export interface TemplateOption {
  id: number;
  name: string;
}

/**
 * Dialog eredmény típus
 */
export type CreateDiscussionResult =
  | { action: 'created'; slug: string }
  | { action: 'updated'; title: string; content: string; newMedia?: File[]; deleteMediaIds?: number[] }
  | { action: 'close' };

/**
 * Szerkesztés módhoz szükséges adat
 */
export interface EditDiscussionData {
  discussionId: number;
  postId: number;
  title: string;
  content: string;
  media?: PostMedia[];
}

/**
 * Create Discussion Dialog
 *
 * Új beszélgetés létrehozása dialógus.
 * Csak kapcsolattartó használhatja.
 *
 * Funkciók:
 * - Cím mező (kötelező, min 3, max 255 karakter)
 * - Tartalom mező (kötelező, min 10 karakter)
 * - Sablon választó (opcionális)
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezelés (HostListener)
 */
@Component({
  selector: 'app-create-discussion-dialog',
  imports: [CommonModule, FormsModule, RichTextEditorComponent, MediaEditorComponent],
  templateUrl: './create-discussion-dialog.component.html',
  styleUrls: ['./create-discussion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateDiscussionDialogComponent extends BaseDialogComponent {
  /** Signal-based inputs */
  readonly templates = input<TemplateOption[]>([]);
  readonly preselectedTemplateId = input<number | undefined>(undefined);
  readonly mode = input<'create' | 'edit'>('create');
  readonly editData = input<EditDiscussionData | undefined>(undefined);
  readonly useRichEditor = input<boolean>(true);

  /** Signal-based outputs */
  readonly resultEvent = output<CreateDiscussionResult>();

  /** Form adatok */
  title = '';
  content = '';
  templateId: number | null = null;

  /** Plain text hossz (rich editor esetén) */
  contentTextLength = 0;

  /** Validációs hibák */
  errors: { title?: string; content?: string } = {};

  /** Média editor adatok (edit módban) */
  readonly existingMediaItems = signal<MediaEditorItem[]>([]);
  newMediaFiles: File[] = [];
  mediaToDeleteIds: number[] = [];

  /** ViewChild referenciák */
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  /** Services */
  private readonly forumService = inject(ForumService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // LIFECYCLE - Override
  // ============================================================================

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    // Előre kiválasztott sablon beállítása
    const preselectedId = this.preselectedTemplateId();
    if (preselectedId) {
      this.templateId = preselectedId;
    }

    // Edit módban: betöltjük az eredeti adatokat
    const editDataVal = this.editData();
    if (this.mode() === 'edit' && editDataVal) {
      this.title = editDataVal.title;
      // Rich editor esetén megtartjuk a HTML-t, egyébként stripeljük
      this.content = this.useRichEditor() ? editDataVal.content : this.stripHtml(editDataVal.content);

      // Meglévő média betöltése
      if (editDataVal.media && editDataVal.media.length > 0) {
        this.existingMediaItems.set(editDataVal.media.map(m => ({
          id: m.id,
          url: m.url,
          fileName: m.fileName,
          isImage: m.isImage
        })));
      }
    }
  }

  /**
   * HTML tag-ek eltávolítása (plain text-hez szerkesztésnél)
   * DOMPurify-t használ XSS védelem érdekében
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  }

  // ============================================================================
  // FOCUS - Override
  // ============================================================================

  protected override focusFirstInput(): void {
    setTimeout(() => {
      this.titleInput?.nativeElement.focus();
    }, 100);
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  /**
   * Input change - töröljük a hibát
   */
  onInputChange(): void {
    this.errors = {};
    this.clearError();
  }

  /**
   * Rich editor text length változás
   */
  onContentTextLengthChange(length: number): void {
    this.contentTextLength = length;
  }

  // ============================================================================
  // MEDIA EDITOR HANDLERS
  // ============================================================================

  /**
   * Új média fájlok változásakor
   */
  onNewFilesChange(files: File[]): void {
    this.newMediaFiles = files;
  }

  /**
   * Törlésre jelölt média ID-k változásakor
   */
  onMediaToDeleteChange(mediaIds: number[]): void {
    this.mediaToDeleteIds = mediaIds;
  }

  /**
   * Média hiba kezelése
   */
  onMediaError(errorMsg: string): void {
    this._errorMessage.set(errorMsg);
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validáció
   */
  private validate(): boolean {
    this.errors = {};

    const trimmedTitle = this.title.trim();

    // Cím validáció
    if (!trimmedTitle) {
      this.errors.title = 'A cím megadása kötelező.';
      return false;
    }

    if (trimmedTitle.length < 3) {
      this.errors.title = 'A cím legalább 3 karakter legyen.';
      return false;
    }

    if (trimmedTitle.length > 255) {
      this.errors.title = 'A cím maximum 255 karakter lehet.';
      return false;
    }

    // Tartalom validáció - Rich editor esetén textLength-et használjuk
    if (this.useRichEditor()) {
      if (this.contentTextLength === 0) {
        this.errors.content = 'A tartalom megadása kötelező.';
        return false;
      }

      if (this.contentTextLength < 10) {
        this.errors.content = 'A tartalom legalább 10 karakter legyen.';
        return false;
      }

      if (this.contentTextLength > 10000) {
        this.errors.content = 'A tartalom maximum 10000 karakter lehet.';
        return false;
      }
    } else {
      // Sima textarea esetén
      const trimmedContent = this.content.trim();

      if (!trimmedContent) {
        this.errors.content = 'A tartalom megadása kötelező.';
        return false;
      }

      if (trimmedContent.length < 10) {
        this.errors.content = 'A tartalom legalább 10 karakter legyen.';
        return false;
      }

      if (trimmedContent.length > 10000) {
        this.errors.content = 'A tartalom maximum 10000 karakter lehet.';
        return false;
      }
    }

    return true;
  }

  /**
   * Form érvényes-e
   */
  get isFormValid(): boolean {
    const titleValid = this.title.trim().length >= 3;
    if (this.useRichEditor()) {
      return titleValid && this.contentTextLength >= 10;
    }
    return titleValid && this.content.trim().length >= 10;
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  /**
   * Submit implementáció
   */
  protected override onSubmit(): void {
    if (!this.validate()) {
      this._isSubmitting.set(false);
      return;
    }

    if (this.mode() === 'edit') {
      // Edit mód: az adatokat + média változtatásokat emittáljuk, a parent kezeli az API-t
      this.submitSuccess();
      this.resultEvent.emit({
        action: 'updated',
        title: this.title.trim(),
        content: this.content.trim(),
        newMedia: this.newMediaFiles.length > 0 ? this.newMediaFiles : undefined,
        deleteMediaIds: this.mediaToDeleteIds.length > 0 ? this.mediaToDeleteIds : undefined
      });
      return;
    }

    // Create mód: API hívás
    const request: CreateDiscussionRequest = {
      title: this.title.trim(),
      content: this.content.trim(),
      templateId: this.templateId ?? undefined
    };

    this.forumService.createDiscussion(request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (discussion) => {
        this.submitSuccess();
        this.resultEvent.emit({ action: 'created', slug: discussion.slug });
      },
      error: (err) => {
        this.submitError(err.message || 'Hiba történt a mentés során.');
      }
    });
  }

  /**
   * Close implementáció
   */
  protected override onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Karakterszámláló - cím
   */
  get titleCharCount(): string {
    return `${this.title.length}/255`;
  }

  /**
   * Karakterszámláló - tartalom
   */
  get contentCharCount(): string {
    return `${this.content.length}/10000`;
  }
}
