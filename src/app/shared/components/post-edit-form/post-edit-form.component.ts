import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import DOMPurify from 'dompurify';
import { MediaEditorComponent, MediaEditorItem } from '../media-editor/media-editor.component';

/**
 * Save event data including optional media changes
 */
export interface PostEditSaveData {
  content: string;
  newMedia?: File[];
  deleteMediaIds?: number[];
}

/**
 * PostEditFormComponent
 *
 * Újrafelhasználható komponens hozzászólás szerkesztéséhez.
 * Tartalmazza a textarea-t, media editor-t, timer-t és akció gombokat.
 *
 * @example
 * <app-post-edit-form
 *   [initialContent]="post.content"
 *   [existingMedia]="post.media"
 *   [remainingTime]="'5 perc'"
 *   [isSubmitting]="isEditSubmitting()"
 *   (save)="saveEdit($event)"
 *   (cancel)="cancelEdit()"
 * />
 */
@Component({
  selector: 'app-post-edit-form',
  standalone: true,
  imports: [FormsModule, MediaEditorComponent],
  template: `
    <div class="post-edit-form">
      <textarea
        class="post-edit-form__textarea"
        [(ngModel)]="content"
        [disabled]="isSubmitting()"
        [rows]="rows()"
        placeholder="Szerkeszd a hozzászólásodat..."
      ></textarea>

      <!-- Media Editor (ha van meglévő média VAGY engedélyezve van) -->
      @if (showMediaEditor()) {
        <div class="post-edit-form__media">
          <app-media-editor
            [existingMedia]="mediaItems()"
            [disabled]="isSubmitting()"
            [maxFiles]="3"
            [maxSizeMB]="2"
            [existingLabel]="'Meglévő képek'"
            [newLabel]="'Új képek hozzáadása (max 3 kép, 2MB/kép)'"
            (newFilesChange)="onNewFilesChange($event)"
            (mediaToDeleteChange)="onMediaToDeleteChange($event)"
            (error)="onMediaError($event)"
          />
        </div>
      }

      @if (mediaError()) {
        <div class="post-edit-form__media-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ mediaError() }}</span>
        </div>
      }

      @if (remainingTime()) {
        <div class="post-edit-form__info">
          <span class="post-edit-form__timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Még {{ remainingTime() }} van a szerkesztésre
          </span>
        </div>
      }

      <div class="post-edit-form__actions">
        <button
          type="button"
          class="post-edit-form__btn post-edit-form__btn--cancel"
          (click)="onCancel()"
          [disabled]="isSubmitting()"
        >
          Mégse
        </button>
        <button
          type="button"
          class="post-edit-form__btn post-edit-form__btn--save"
          (click)="onSave()"
          [disabled]="!content.trim() || isSubmitting()"
        >
          @if (isSubmitting()) {
            <svg class="post-edit-form__spinner" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          }
          {{ isSubmitting() ? 'Mentés...' : 'Mentés' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .post-edit-form {
      margin-top: 0.5rem;

      &__textarea {
        width: 100%;
        padding: 0.75rem;
        font-size: 0.9375rem;
        font-family: inherit;
        color: #374151;
        line-height: 1.6;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        resize: vertical;
        outline: none;
        transition: all 0.2s;

        &::placeholder {
          color: #9ca3af;
        }

        &:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &__media {
        margin-top: 1rem;
      }

      &__media-error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        margin-top: 0.5rem;
        font-size: 0.8125rem;
        color: #dc2626;
        background: #fef2f2;
        border-radius: 0.375rem;

        svg {
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
        }
      }

      &__info {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      &__timer {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: #f59e0b;

        svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
        font-weight: 600;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;

        &--cancel {
          color: #6b7280;
          background: #f3f4f6;

          &:hover:not(:disabled) {
            background: #e5e7eb;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        &--save {
          color: white;
          background: #3b82f6;

          &:hover:not(:disabled) {
            background: #2563eb;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }

      &__spinner {
        width: 0.875rem;
        height: 0.875rem;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-edit-form__textarea,
      .post-edit-form__btn {
        transition: none;
      }

      .post-edit-form__spinner {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostEditFormComponent {
  /** Kezdeti tartalom */
  readonly initialContent = input.required<string>();

  /** Meglévő média (szerkesztés módban) */
  readonly existingMedia = input<Array<{ id: number; url: string; fileName?: string; isImage?: boolean }>>([]);

  /** Média szerkesztés engedélyezése */
  readonly allowMedia = input<boolean>(true);

  /** Hátralévő szerkesztési idő */
  readonly remainingTime = input<string | undefined>(undefined);

  /** Küldés folyamatban */
  readonly isSubmitting = input<boolean>(false);

  /** Textarea sorok száma */
  readonly rows = input<number>(4);

  /** Mentés esemény (új tartalom + média változások) */
  readonly save = output<PostEditSaveData>();

  /** Mégse esemény */
  readonly cancel = output<void>();

  /** Aktuális tartalom */
  content = '';

  /** Új média fájlok */
  private newMediaFiles: File[] = [];

  /** Törlendő média ID-k */
  private mediaToDeleteIds: number[] = [];

  /** Média hiba */
  readonly mediaError = signal<string | null>(null);

  /** Computed: Media items a MediaEditor-hoz */
  readonly mediaItems = computed<MediaEditorItem[]>(() => {
    return this.existingMedia().map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName || 'kép',
      isImage: m.isImage ?? true
    }));
  });

  /** Computed: Mutassuk-e a media editor-t (mindig, ha allowMedia=true) */
  readonly showMediaEditor = computed(() => {
    return this.allowMedia();
  });

  constructor() {
    // Kezdeti érték beállítása amikor az input változik
    effect(() => {
      this.content = this.stripHtml(this.initialContent());
    });
  }

  /**
   * HTML tagek és entity-k eltávolítása plain text-té
   * DOMPurify-t használ XSS védelem érdekében
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    // DOMPurify szanitizálás, majd szöveg kinyerése
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    return sanitized;
  }

  onNewFilesChange(files: File[]): void {
    this.newMediaFiles = files;
    this.mediaError.set(null);
  }

  onMediaToDeleteChange(ids: number[]): void {
    this.mediaToDeleteIds = ids;
  }

  onMediaError(error: string): void {
    this.mediaError.set(error);
  }

  onSave(): void {
    const trimmed = this.content.trim();
    if (trimmed) {
      this.save.emit({
        content: trimmed,
        newMedia: this.newMediaFiles.length > 0 ? this.newMediaFiles : undefined,
        deleteMediaIds: this.mediaToDeleteIds.length > 0 ? this.mediaToDeleteIds : undefined
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
