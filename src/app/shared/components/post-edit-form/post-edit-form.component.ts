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
  templateUrl: './post-edit-form.component.html',
  styleUrls: ['./post-edit-form.component.scss'],
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
