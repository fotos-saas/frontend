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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NewsfeedService, CreatePostRequest, UpdatePostRequest, NewsfeedPost, NewsfeedMedia } from '../../../core/services/newsfeed.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaEditorComponent, MediaEditorItem } from '../../../shared/components/media-editor';
import { PostFormValidatorService, PostFormErrors } from '../services/post-form-validator.service';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

/**
 * Dialog eredmény típus
 */
export type CreatePostResult =
  | { action: 'created'; postId: number }
  | { action: 'updated'; postId: number }
  | { action: 'close' };

/**
 * Create Post Dialog
 *
 * Új hírfolyam bejegyzés létrehozása dialógus.
 * Mindenki használhatja (kapcsolattartó és vendég).
 *
 * Funkciók:
 * - Típus választó (bejelentés/esemény)
 * - Cím mező (kötelező)
 * - Tartalom mező (opcionális)
 * - Esemény részletek (dátum, idő, helyszín)
 * - Média feltöltés (max 5 fájl)
 *
 * Extends BaseDialogComponent:
 * - Body scroll lock
 * - Focus management
 * - ESC kezelés (HostListener)
 */
@Component({
  selector: 'app-create-post-dialog',
  imports: [FormsModule, RichTextEditorComponent, MediaEditorComponent],
  templateUrl: './create-post-dialog.component.html',
  styleUrls: ['./create-post-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostDialogComponent extends BaseDialogComponent {
  /** Signal-based inputs */
  readonly editPost = input<NewsfeedPost | undefined>(undefined);

  /** Signal-based outputs */
  readonly resultEvent = output<CreatePostResult>();

  /** Edit mód-e - computed signal */
  readonly isEditMode = computed(() => !!this.editPost());

  /** Dialog címe (edit vs create) - computed signal */
  readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Bejegyzés szerkesztése' : 'Új bejegyzés'
  );

  /** Submit gomb szövege - computed signal */
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

  /** Média fájlok (új fájlok feltöltéshez - MediaEditor-tól jön) */
  mediaFiles: File[] = [];

  /** Edit módban: törlésre jelölt média ID-k (MediaEditor-tól jön) */
  mediaToDelete: number[] = [];

  /** Plain text hossz (rich editor esetén) */
  contentTextLength = 0;

  /** Validációs hibák */
  errors: PostFormErrors = {};

  /** ViewChild referenciák */
  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  /** Services */
  private readonly newsfeedService = inject(NewsfeedService);
  private readonly destroyRef = inject(DestroyRef);
  readonly validator = inject(PostFormValidatorService);

  // ============================================================================
  // LIFECYCLE - Override
  // ============================================================================

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    // Edit módban előtöltjük az adatokat
    const editPostVal = this.editPost();
    if (this.isEditMode() && editPostVal) {
      this.loadPostData(editPostVal);
    }
  }

  // ============================================================================
  // FOCUS - Override
  // ============================================================================

  protected override focusFirstInput(): void {
    setTimeout(() => {
      this.titleInput()?.nativeElement.focus();
    }, 100);
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Poszt adatok előtöltése (edit mód)
   */
  private loadPostData(post: NewsfeedPost): void {
    this.postType = post.postType;
    this.title = post.title;
    this.content = post.content || '';
    this.eventDate = post.eventDate || '';
    this.eventTime = post.eventTime || '';
    this.eventLocation = post.eventLocation || '';
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
   * Típus váltás
   */
  onTypeChange(type: 'announcement' | 'event'): void {
    this.postType = type;
    this.onInputChange();
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
   * Meglévő média átalakítása MediaEditorItem formátumra - computed signal
   */
  readonly existingMediaItems = computed<MediaEditorItem[]>(() => {
    const editPostVal = this.editPost();
    return editPostVal?.media?.map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName,
      isImage: m.isImage
    })) ?? [];
  });

  /**
   * MediaEditor: új fájlok változása
   */
  onNewFilesChange(files: File[]): void {
    this.mediaFiles = files;
    this.errors.media = undefined;
  }

  /**
   * MediaEditor: törlésre jelölt médiák változása
   */
  onMediaToDeleteChange(ids: number[]): void {
    this.mediaToDelete = ids;
  }

  /**
   * MediaEditor: validációs hiba
   */
  onMediaError(error: string): void {
    this.errors.media = error;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  get minDate(): string {
    return this.validator.getMinDate();
  }

  private validate(): boolean {
    this.errors = this.validator.validate({
      postType: this.postType,
      title: this.title,
      contentTextLength: this.contentTextLength,
      eventDate: this.eventDate
    });

    return !this.validator.hasErrors(this.errors);
  }

  get isFormValid(): boolean {
    return this.validator.isFormValid(this.title, this.postType, this.eventDate);
  }

  get titleCharCount(): string {
    return `${this.title.length}/255`;
  }

  // ============================================================================
  // ABSTRACT IMPLEMENTATIONS
  // ============================================================================

  /**
   * Close implementáció
   */
  protected override onClose(): void {
    this.resultEvent.emit({ action: 'close' });
  }

  /**
   * Submit implementáció
   */
  protected override onSubmit(): void {
    if (!this.validate()) {
      this._isSubmitting.set(false);
      return;
    }

    // Edit vs Create mód
    if (this.isEditMode()) {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  /**
   * Új poszt létrehozása
   */
  private submitCreate(): void {
    const request: CreatePostRequest = {
      postType: this.postType,
      title: this.title.trim(),
      content: this.content.trim() || undefined,
      eventDate: this.postType === 'event' ? this.eventDate : undefined,
      eventTime: this.postType === 'event' && this.eventTime ? this.eventTime : undefined,
      eventLocation: this.postType === 'event' && this.eventLocation.trim() ? this.eventLocation.trim() : undefined
    };

    const mediaToUpload = this.mediaFiles.length > 0 ? this.mediaFiles : undefined;

    this.newsfeedService.createPost(request, mediaToUpload).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (post) => {
        this.submitSuccess();
        this.resultEvent.emit({ action: 'created', postId: post.id });
      },
      error: (err) => {
        this.submitError(err.message || 'Hiba történt a mentés során.');
      }
    });
  }

  /**
   * Poszt szerkesztése
   */
  private submitEdit(): void {
    const editPostVal = this.editPost();
    if (!editPostVal) return;

    const request: UpdatePostRequest = {
      title: this.title.trim(),
      content: this.content.trim() || undefined,
      eventDate: this.postType === 'event' ? this.eventDate : undefined,
      eventTime: this.postType === 'event' && this.eventTime ? this.eventTime : undefined,
      eventLocation: this.postType === 'event' && this.eventLocation.trim() ? this.eventLocation.trim() : undefined
    };

    // Először töröljük a megjelölt médiákat
    const deleteOperations = this.mediaToDelete.map(mediaId =>
      this.newsfeedService.deleteMedia(mediaId)
    );

    const deleteStream$ = deleteOperations.length > 0
      ? forkJoin(deleteOperations)
      : of([]);

    const newMediaFiles = this.mediaFiles.length > 0 ? this.mediaFiles : undefined;

    // Törlések után frissítjük a posztot
    deleteStream$.pipe(
      switchMap(() => this.newsfeedService.updatePost(editPostVal.id, request, newMediaFiles)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (post) => {
        this.submitSuccess();
        this.resultEvent.emit({ action: 'updated', postId: post.id });
      },
      error: (err) => {
        this.submitError(err.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
