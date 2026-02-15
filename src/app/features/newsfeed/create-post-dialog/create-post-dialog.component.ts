import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
  DestroyRef,
  input,
  output,
  computed,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { NewsfeedPost, CreatePostRequest, UpdatePostRequest } from '../../../core/services/newsfeed.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor';
import { PostFormValidatorService, PostFormErrors } from '../services/post-form-validator.service';
import { DialogWrapperComponent } from '../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { CreatePostDialogActionsService } from './create-post-dialog-actions.service';
import { PsInputComponent, PsDatepickerComponent, PsTimepickerComponent } from '@shared/components/form';

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
 * DialogWrapperComponent kezeli a shell-t (backdrop, scroll lock, ESC, focus).
 */
@Component({
  selector: 'app-create-post-dialog',
  imports: [FormsModule, LucideAngularModule, RichTextEditorComponent, MediaEditorComponent, DialogWrapperComponent, PsInputComponent, PsDatepickerComponent, PsTimepickerComponent],
  templateUrl: './create-post-dialog.component.html',
  styleUrls: ['./create-post-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostDialogComponent {
  readonly ICONS = ICONS;

  readonly editPost = input<NewsfeedPost | undefined>(undefined);
  readonly resultEvent = output<CreatePostResult>();

  readonly isEditMode = computed(() => !!this.editPost());
  readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Bejegyzés szerkesztése' : 'Új bejegyzés'
  );
  readonly dialogDescription = computed(() =>
    this.isEditMode()
      ? 'Szerkeszd a bejegyzés tartalmát. A típus és a média nem módosítható.'
      : 'Oszd meg a híreidet az osztállyal. Bejelentést vagy eseményt is hozhatsz létre.'
  );
  readonly dialogIcon = computed(() =>
    this.isEditMode() ? ICONS.EDIT : ICONS.FILE_TEXT
  );
  readonly submitButtonText = computed(() => {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Mentés...' : 'Közzététel...';
    }
    return this.isEditMode() ? 'Mentés' : 'Közzététel';
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

  /** Állapotok */
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  private readonly destroyRef = inject(DestroyRef);
  private readonly submitActions = inject(CreatePostDialogActionsService);
  readonly validator = inject(PostFormValidatorService);

  private initialized = false;

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngAfterViewInit(): void {
    if (!this.initialized) {
      this.initialized = true;
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
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  onInputChange(): void { this.errors = {}; this.errorMessage.set(null); }
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

  readonly minDate = computed(() => this.validator.getMinDate());

  readonly isFormValid = computed(() =>
    this.validator.isFormValid(this.title, this.postType, this.eventDate)
  );

  readonly titleCharCount = computed(() => `${this.title.length}/255`);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  submit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.errors = this.validator.validate({
      postType: this.postType,
      title: this.title,
      contentTextLength: this.contentTextLength,
      eventDate: this.eventDate
    });

    if (this.validator.hasErrors(this.errors)) {
      this.isSubmitting.set(false);
      return;
    }

    const callbacks = {
      onSuccess: (postId: number, action: 'created' | 'updated') => {
        this.isSubmitting.set(false);
        this.resultEvent.emit({ action, postId });
      },
      onError: (message: string) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(message);
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
