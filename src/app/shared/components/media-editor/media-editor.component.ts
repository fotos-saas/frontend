import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  ElementRef,
  viewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatFileSize } from '@shared/utils/formatters.util';

/**
 * Média elem interface (újrahasználható)
 */
export interface MediaEditorItem {
  id: number;
  url: string;
  fileName: string;
  isImage: boolean;
}

/**
 * MediaEditorComponent
 *
 * Újrahasználható média kezelő komponens.
 * Kezeli a meglévő média megjelenítését, törlését és új fájlok feltöltését.
 *
 * Használható:
 * - Newsfeed poszt szerkesztés
 * - Fórum bejegyzés szerkesztés
 * - Galéria kezelés
 */
@Component({
  selector: 'app-media-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-editor.component.html',
  styleUrls: ['./media-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaEditorComponent {
  // ============================================================================
  // INPUTS
  // ============================================================================

  /** Meglévő médiák (edit módban) */
  existingMedia = input<MediaEditorItem[]>([]);

  /** Maximum fájlok száma */
  maxFiles = input<number>(5);

  /** Maximum fájl méret MB-ban */
  maxSizeMB = input<number>(10);

  /** Elfogadott fájl típusok */
  acceptedTypes = input<string>('image/jpeg,image/png,image/gif,image/webp,video/mp4');

  /** Disabled állapot */
  disabled = input<boolean>(false);

  /** Meglévő média címke */
  existingLabel = input<string>('Meglévő képek/videók');

  /** Új média címke */
  newLabel = input<string>('Új képek/videók hozzáadása');

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  /** Új fájlok változásakor */
  newFilesChange = output<File[]>();

  /** Törlésre jelölt ID-k változásakor */
  mediaToDeleteChange = output<number[]>();

  /** Validációs hiba */
  error = output<string>();

  // ============================================================================
  // STATE
  // ============================================================================

  /** Új fájlok listája */
  private readonly _newFiles = signal<File[]>([]);

  /** Törlésre jelölt média ID-k */
  private readonly _mediaToDelete = signal<number[]>([]);

  /** Hibaüzenet */
  readonly errorMessage = signal<string | null>(null);

  /** File input referencia */
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // ============================================================================
  // COMPUTED
  // ============================================================================

  /** Megmaradó meglévő média (ami nincs törölve) */
  readonly remainingMedia = computed(() => {
    const existing = this.existingMedia();
    const toDelete = this._mediaToDelete();
    return existing.filter(m => !toDelete.includes(m.id));
  });

  /** Törlésre jelölt médiák */
  readonly mediaToDelete = computed(() => this._mediaToDelete());

  /** Új fájlok */
  readonly newFiles = computed(() => this._newFiles());

  /** Elérhető helyek új fájloknak */
  readonly availableSlots = computed(() => {
    const max = this.maxFiles();
    const existing = this.existingMedia().length;
    const deleted = this._mediaToDelete().length;
    const newCount = this._newFiles().length;
    return max - (existing - deleted) - newCount;
  });

  /** Van-e meglévő média */
  readonly hasExistingMedia = computed(() => this.existingMedia().length > 0);

  /** Van-e törlésre jelölt */
  readonly hasMediaToDelete = computed(() => this._mediaToDelete().length > 0);

  /** Max fájl méret bytes-ban */
  readonly maxFileSizeBytes = computed(() => this.maxSizeMB() * 1024 * 1024);

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Fájl input triggerelése
   */
  triggerFileInput(): void {
    this.fileInput()?.nativeElement.click();
  }

  /**
   * Fájl kiválasztás kezelése
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const slots = this.availableSlots();

    if (slots <= 0) {
      this.setError('Nincs több szabad hely média számára.');
      input.value = '';
      return;
    }

    const filesToAdd = files.slice(0, slots);
    const validFiles: File[] = [];

    for (const file of filesToAdd) {
      const validationError = this.validateFile(file);
      if (validationError) {
        this.setError(validationError);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const updated = [...this._newFiles(), ...validFiles];
      this._newFiles.set(updated);
      this.newFilesChange.emit(updated);
      this.clearError();
    }

    input.value = '';
  }

  /**
   * Meglévő média törlésre jelölése
   */
  markForDeletion(mediaId: number): void {
    const current = this._mediaToDelete();
    if (!current.includes(mediaId)) {
      const updated = [...current, mediaId];
      this._mediaToDelete.set(updated);
      this.mediaToDeleteChange.emit(updated);
    }
  }

  /**
   * Törlés visszavonása
   */
  undoDeletion(mediaId: number): void {
    const updated = this._mediaToDelete().filter(id => id !== mediaId);
    this._mediaToDelete.set(updated);
    this.mediaToDeleteChange.emit(updated);
  }

  /**
   * Új fájl eltávolítása
   */
  removeNewFile(index: number): void {
    const updated = this._newFiles().filter((_, i) => i !== index);
    this._newFiles.set(updated);
    this.newFilesChange.emit(updated);
    this.clearError();
  }

  /**
   * Média keresése ID alapján (törlésre jelöltek megjelenítéséhez)
   */
  getMediaById(mediaId: number): MediaEditorItem | undefined {
    return this.existingMedia().find(m => m.id === mediaId);
  }

  /**
   * Fájl méret formázás
   */
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  /**
   * Track by függvény fájlokhoz
   */
  trackByFileName(_index: number, file: File): string {
    return file.name + file.size;
  }

  /**
   * Track by függvény médiákhoz
   */
  trackByMediaId(_index: number, media: MediaEditorItem): number {
    return media.id;
  }

  /**
   * Track by függvény törlendő ID-khoz
   */
  trackByDeleteId(_index: number, mediaId: number): number {
    return mediaId;
  }

  /**
   * Állapot resetelése (külső használatra)
   */
  reset(): void {
    this._newFiles.set([]);
    this._mediaToDelete.set([]);
    this.errorMessage.set(null);
    this.newFilesChange.emit([]);
    this.mediaToDeleteChange.emit([]);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Fájl validáció
   */
  private validateFile(file: File): string | null {
    // Méret ellenőrzés
    if (file.size > this.maxFileSizeBytes()) {
      return `A fájl túl nagy: ${file.name} (max ${this.maxSizeMB()}MB)`;
    }

    // Típus ellenőrzés
    const acceptedMimes = this.acceptedTypes().split(',').map(t => t.trim());
    if (!acceptedMimes.includes(file.type)) {
      return `Nem támogatott fájltípus: ${file.name}`;
    }

    return null;
  }

  /**
   * Hiba beállítása
   */
  private setError(message: string): void {
    this.errorMessage.set(message);
    this.error.emit(message);
  }

  /**
   * Hiba törlése
   */
  private clearError(): void {
    this.errorMessage.set(null);
  }
}
