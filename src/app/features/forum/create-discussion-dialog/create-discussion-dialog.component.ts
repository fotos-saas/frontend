import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
  DestroyRef,
  signal,
  input,
  output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import DOMPurify from 'dompurify';
import { ForumService, CreateDiscussionRequest, PostMedia } from '../../../core/services/forum.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor/media-editor.component';
import { DiscussionFormValidatorService, DiscussionFormErrors } from './discussion-form-validator.service';

/**
 * Sablon interface (minimalis)
 */
export interface TemplateOption {
  id: number;
  name: string;
}

/**
 * Dialog eredmeny tipus
 */
export type CreateDiscussionResult =
  | { action: 'created'; slug: string }
  | { action: 'updated'; title: string; content: string; newMedia?: File[]; deleteMediaIds?: number[] }
  | { action: 'close' };

/**
 * Szerkesztes modhoz szukseges adat
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
 * Uj beszelgetes letrehozasa dialogus.
 * Csak kapcsolattarto hasznalja.
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezeles (HostListener)
 */
@Component({
  selector: 'app-create-discussion-dialog',
  imports: [FormsModule, RichTextEditorComponent, MediaEditorComponent],
  templateUrl: './create-discussion-dialog.component.html',
  styleUrls: ['./create-discussion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateDiscussionDialogComponent extends BaseDialogComponent {
  readonly templates = input<TemplateOption[]>([]);
  readonly preselectedTemplateId = input<number | undefined>(undefined);
  readonly mode = input<'create' | 'edit'>('create');
  readonly editData = input<EditDiscussionData | undefined>(undefined);
  readonly useRichEditor = input<boolean>(true);

  readonly resultEvent = output<CreateDiscussionResult>();

  /** Form adatok */
  title = '';
  content = '';
  templateId: number | null = null;
  contentTextLength = 0;

  /** Validacios hibak */
  errors: DiscussionFormErrors = {};

  /** Media editor adatok */
  readonly existingMediaItems = signal<MediaEditorItem[]>([]);
  newMediaFiles: File[] = [];
  mediaToDeleteIds: number[] = [];

  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  private readonly forumService = inject(ForumService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly validator = inject(DiscussionFormValidatorService);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const preselectedId = this.preselectedTemplateId();
    if (preselectedId) {
      this.templateId = preselectedId;
    }

    const editDataVal = this.editData();
    if (this.mode() === 'edit' && editDataVal) {
      this.title = editDataVal.title;
      this.content = this.useRichEditor() ? editDataVal.content : this.stripHtml(editDataVal.content);

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

  private stripHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  }

  // ============================================================================
  // FOCUS
  // ============================================================================

  protected override focusFirstInput(): void {
    setTimeout(() => {
      this.titleInput()?.nativeElement.focus();
    }, 100);
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  onInputChange(): void {
    this.errors = {};
    this.clearError();
  }

  onContentTextLengthChange(length: number): void {
    this.contentTextLength = length;
  }

  // ============================================================================
  // MEDIA EDITOR HANDLERS
  // ============================================================================

  onNewFilesChange(files: File[]): void { this.newMediaFiles = files; }
  onMediaToDeleteChange(mediaIds: number[]): void { this.mediaToDeleteIds = mediaIds; }
  onMediaError(errorMsg: string): void { this._errorMessage.set(errorMsg); }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  get isFormValid(): boolean {
    return this.validator.isFormValid(this.title, this.contentTextLength, this.content, this.useRichEditor());
  }

  get titleCharCount(): string { return `${this.title.length}/255`; }
  get contentCharCount(): string { return `${this.content.length}/10000`; }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  protected override onSubmit(): void {
    this.errors = this.validator.validate({
      title: this.title,
      content: this.content,
      contentTextLength: this.contentTextLength,
      useRichEditor: this.useRichEditor()
    });

    if (this.validator.hasErrors(this.errors)) {
      this._isSubmitting.set(false);
      return;
    }

    if (this.mode() === 'edit') {
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
        this.submitError(err.message || 'Hiba tortent a mentes soran.');
      }
    });
  }

  protected override onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }
}
