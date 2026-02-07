import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
  DestroyRef,
  input,
  output,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewsfeedPost, CreatePostRequest, UpdatePostRequest } from '../../../core/services/newsfeed.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor';
import { PostFormValidatorService, PostFormErrors } from '../services/post-form-validator.service';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { CreatePostDialogActionsService } from './create-post-dialog-actions.service';

/**
 * Dialog eredmeny tipus
 */
export type CreatePostResult =
  | { action: 'created'; postId: number }
  | { action: 'updated'; postId: number }
  | { action: 'close' };

/**
 * Create Post Dialog
 *
 * Uj hirfolyam bejegyzes letrehozasa dialogus.
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezeles (HostListener)
 */
@Component({
  selector: 'app-create-post-dialog',
  imports: [FormsModule, RichTextEditorComponent, MediaEditorComponent],
  templateUrl: './create-post-dialog.component.html',
  styleUrls: ['./create-post-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostDialogComponent extends BaseDialogComponent {
  readonly editPost = input<NewsfeedPost | undefined>(undefined);
  readonly resultEvent = output<CreatePostResult>();

  readonly isEditMode = computed(() => !!this.editPost());
  readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Bejegyzes szerkesztese' : 'Uj bejegyzes'
  );
  readonly submitButtonText = computed(() => {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Mentes...' : 'Kozzetetetel...';
    }
    return this.isEditMode() ? 'Mentes' : 'Kozzetetetel';
  });

  /** Form adatok */
  postType: 'announcement' | 'event' = 'announcement';
  title = '';
  content = '';
  eventDate = '';
  eventTime = '';
  eventLocation = '';
  mediaFiles: File[] = [];
  mediaToDelete: number[] = [];
  contentTextLength = 0;
  errors: PostFormErrors = {};

  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  private readonly destroyRef = inject(DestroyRef);
  private readonly submitActions = inject(CreatePostDialogActionsService);
  readonly validator = inject(PostFormValidatorService);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const editPostVal = this.editPost();
    if (this.isEditMode() && editPostVal) {
      this.postType = editPostVal.postType;
      this.title = editPostVal.title;
      this.content = editPostVal.content || '';
      this.eventDate = editPostVal.eventDate || '';
      this.eventTime = editPostVal.eventTime || '';
      this.eventLocation = editPostVal.eventLocation || '';
    }
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

  onInputChange(): void { this.errors = {}; this.clearError(); }
  onTypeChange(type: 'announcement' | 'event'): void { this.postType = type; this.onInputChange(); }
  onContentTextLengthChange(length: number): void { this.contentTextLength = length; }

  // ============================================================================
  // MEDIA EDITOR HANDLERS
  // ============================================================================

  readonly existingMediaItems = computed<MediaEditorItem[]>(() => {
    const editPostVal = this.editPost();
    return editPostVal?.media?.map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName,
      isImage: m.isImage
    })) ?? [];
  });

  onNewFilesChange(files: File[]): void { this.mediaFiles = files; this.errors.media = undefined; }
  onMediaToDeleteChange(ids: number[]): void { this.mediaToDelete = ids; }
  onMediaError(error: string): void { this.errors.media = error; }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  get minDate(): string { return this.validator.getMinDate(); }

  get isFormValid(): boolean {
    return this.validator.isFormValid(this.title, this.postType, this.eventDate);
  }

  get titleCharCount(): string { return `${this.title.length}/255`; }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  protected override onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  protected override onSubmit(): void {
    this.errors = this.validator.validate({
      postType: this.postType,
      title: this.title,
      contentTextLength: this.contentTextLength,
      eventDate: this.eventDate
    });

    if (this.validator.hasErrors(this.errors)) {
      this._isSubmitting.set(false);
      return;
    }

    const callbacks = {
      onSuccess: (postId: number, action: 'created' | 'updated') => {
        this.submitSuccess();
        this.resultEvent.emit({ action, postId });
      },
      onError: (message: string) => {
        this.submitError(message);
      }
    };

    const eventFields = {
      eventDate: this.postType === 'event' ? this.eventDate : undefined,
      eventTime: this.postType === 'event' && this.eventTime ? this.eventTime : undefined,
      eventLocation: this.postType === 'event' && this.eventLocation.trim() ? this.eventLocation.trim() : undefined
    };

    if (this.isEditMode()) {
      const editPostVal = this.editPost();
      if (!editPostVal) return;

      const request: UpdatePostRequest = {
        title: this.title.trim(),
        content: this.content.trim() || undefined,
        ...eventFields
      };
      this.submitActions.submitEdit(editPostVal, request, this.mediaFiles, this.mediaToDelete, this.destroyRef, callbacks);
    } else {
      const request: CreatePostRequest = {
        postType: this.postType,
        title: this.title.trim(),
        content: this.content.trim() || undefined,
        ...eventFields
      };
      this.submitActions.submitCreate(request, this.mediaFiles, this.destroyRef, callbacks);
    }
  }
}
