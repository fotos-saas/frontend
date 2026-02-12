import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
  DestroyRef,
  signal,
  input,
  output,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import DOMPurify from 'dompurify';
import { ForumService, CreateDiscussionRequest, PostMedia } from '../../../core/services/forum.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor/media-editor.component';
import { DialogWrapperComponent } from '../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { DiscussionFormValidatorService, DiscussionFormErrors } from './discussion-form-validator.service';
import { ICONS } from '@shared/constants/icons.constants';

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
 * Uj beszelgetes letrehozasa / szerkesztese dialogus.
 * DialogWrapperComponent-et használja a shell-hez.
 */
@Component({
  selector: 'app-create-discussion-dialog',
  imports: [
    FormsModule,
    LucideAngularModule,
    RichTextEditorComponent,
    MediaEditorComponent,
    DialogWrapperComponent,
  ],
  templateUrl: './create-discussion-dialog.component.html',
  styleUrls: ['./create-discussion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateDiscussionDialogComponent {
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

  /** Állapotok */
  readonly _isSubmitting = signal<boolean>(false);
  readonly _errorMessage = signal<string | null>(null);

  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  readonly ICONS = ICONS;

  private readonly forumService = inject(ForumService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly validator = inject(DiscussionFormValidatorService);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngAfterViewInit(): void {
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
  // FORM HANDLERS
  // ============================================================================

  onInputChange(): void {
    this.errors = {};
    this._errorMessage.set(null);
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

  readonly isFormValid = computed(() =>
    this.validator.isFormValid(this.title, this.contentTextLength, this.content, this.useRichEditor())
  );

  readonly titleCharCount = computed(() => `${this.title.length}/255`);
  readonly contentCharCount = computed(() => `${this.content.length}/10000`);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  submit(): void {
    if (this._isSubmitting()) return;

    this._isSubmitting.set(true);
    this._errorMessage.set(null);

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
      this._isSubmitting.set(false);
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
        this._isSubmitting.set(false);
        this.resultEvent.emit({ action: 'created', slug: discussion.slug });
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._errorMessage.set(err.message || 'Hiba tortent a mentes soran.');
      }
    });
  }

  close(): void {
    if (!this._isSubmitting()) {
      this.resultEvent.emit({ action: 'close' });
    }
  }
}
