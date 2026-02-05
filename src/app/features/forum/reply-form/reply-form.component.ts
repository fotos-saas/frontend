import { Component, ChangeDetectionStrategy, signal, viewChild, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent, EditorMode } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { MediaEditorComponent } from '../../../shared/components/media-editor/media-editor.component';

/**
 * Reply Form Component
 *
 * Hozzászólás form a fórumhoz.
 * Használható új hozzászóláshoz vagy válaszhoz.
 * Támogatja a Rich Text Editor-t és a sima textarea-t is.
 */
@Component({
  selector: 'app-reply-form',
  imports: [FormsModule, RichTextEditorComponent, MediaEditorComponent],
  templateUrl: './reply-form.component.html',
  styleUrls: ['./reply-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReplyFormComponent {
  /** Parent post ID (válasz esetén) */
  readonly parentId = input<number | undefined>(undefined);

  /** Küldés folyamatban */
  readonly isSubmitting = input<boolean>(false);

  /** Placeholder szöveg */
  readonly placeholder = input<string>('Írd be a hozzászólásod...');

  /** Rich text editor használata (true = ngx-quill, false = textarea) */
  readonly useRichEditor = input<boolean>(false);

  /** Rich text editor mód */
  readonly editorMode = input<EditorMode>('basic');

  /** Média feltöltés engedélyezése */
  readonly allowMedia = input<boolean>(true);

  /** Form elküldése */
  readonly submitEvent = output<{ content: string; parentId?: number; media?: File[] }>();

  /** Megszakítás (válasz esetén) */
  readonly cancelEvent = output<void>();

  /** Hozzászólás szövege */
  content = '';

  /** Plain text hossz (rich editor esetén) */
  textLength = 0;

  /** Kiválasztott média fájlok */
  mediaFiles: File[] = [];

  /** Média hiba üzenet */
  readonly mediaError = signal<string | null>(null);

  /** Media editor referencia (reset-hez) */
  private readonly mediaEditor = viewChild<MediaEditorComponent>('mediaEditor');

  /**
   * Form elküldése
   * FONTOS: A form NEM törlődik itt! A parent komponens hívja a reset()-et sikeres küldés után.
   */
  onSubmit(): void {
    const trimmedContent = this.content.trim();
    if (!trimmedContent || this.isSubmitting()) return;

    this.submitEvent.emit({
      content: trimmedContent,
      parentId: this.parentId(),
      media: this.mediaFiles.length > 0 ? this.mediaFiles : undefined
    });
  }

  /**
   * Form resetelése (parent hívja sikeres küldés után)
   */
  reset(): void {
    this.content = '';
    this.mediaFiles = [];
    this.mediaError.set(null);
    // Media editor reset
    this.mediaEditor()?.reset();
  }

  /**
   * Megszakítás
   */
  onCancel(): void {
    this.content = '';
    this.mediaFiles = [];
    this.mediaError.set(null);
    this.cancelEvent.emit();
  }

  /**
   * Média fájlok változása
   */
  onMediaFilesChange(files: File[]): void {
    this.mediaFiles = files;
    this.mediaError.set(null);
  }

  /**
   * Média hiba kezelése
   */
  onMediaError(error: string): void {
    this.mediaError.set(error);
  }

  /**
   * Plain text hossz frissítése (rich editor esetén)
   */
  onTextLengthChange(length: number): void {
    this.textLength = length;
  }

  /**
   * Lehet-e küldeni (computed signal)
   */
  readonly canSubmit = computed(() => {
    if (this.useRichEditor()) {
      // Rich editor: HTML stripped text hossz alapján
      return this.textLength > 0 && !this.isSubmitting();
    }
    return this.content.trim().length > 0 && !this.isSubmitting();
  });

  /**
   * Válasz mód (van parentId) (computed signal)
   */
  readonly isReply = computed(() => this.parentId() !== undefined);
}
