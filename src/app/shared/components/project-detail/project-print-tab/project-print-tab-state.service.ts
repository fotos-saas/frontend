import { Injectable, signal, computed } from '@angular/core';
import { ICONS } from '../../../constants/icons.constants';

export type PrintFileType = 'small_tablo' | 'flat';

export interface PrintFileUploadEvent {
  file: File;
  type: PrintFileType;
}

export interface PrintFileDeleteEvent {
  type: PrintFileType;
}

export interface PrintFileDownloadEvent {
  type: PrintFileType;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/tiff',
  'image/x-tiff',
  'image/vnd.adobe.photoshop',
  'application/x-photoshop',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['pdf', 'tiff', 'tif', 'psd', 'jpg', 'jpeg', 'png'];
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

@Injectable()
export class ProjectPrintTabStateService {
  /** Drag & drop állapotok */
  readonly draggingSmallTablo = signal(false);
  readonly draggingFlat = signal(false);

  /** Feltöltési állapot */
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  /** Fájl ikon computed-ok - kívülről állítható mime típusok */
  private readonly smallTabloMime = signal<string | undefined>(undefined);
  private readonly flatMime = signal<string | undefined>(undefined);

  readonly smallTabloIcon = computed(() => this.getFileIcon(this.smallTabloMime()));
  readonly flatIcon = computed(() => this.getFileIcon(this.flatMime()));

  /** Mime típusok frissítése a projekt adatból */
  updateMimeTypes(smallTabloMime?: string, flatMime?: string): void {
    this.smallTabloMime.set(smallTabloMime);
    this.flatMime.set(flatMime);
  }

  /** Drag over kezelés */
  setDragging(type: PrintFileType, value: boolean): void {
    if (type === 'small_tablo') {
      this.draggingSmallTablo.set(value);
    } else {
      this.draggingFlat.set(value);
    }
  }

  /** Mindkét drag állapot visszaállítása */
  resetDragging(): void {
    this.draggingSmallTablo.set(false);
    this.draggingFlat.set(false);
  }

  /** Fájl validáció - hibát ad vissza, vagy null ha rendben */
  validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type) && !this.hasAllowedExtension(file.name)) {
      return 'Nem támogatott fájlformátum. Engedélyezett: PDF, TIFF, PSD, JPG, PNG.';
    }
    if (file.size > MAX_SIZE) {
      return 'A fájl túl nagy. Maximum 200 MB engedélyezett.';
    }
    return null;
  }

  /** Fájl feldolgozás - validál, hibát kezel, true-t ad vissza ha rendben */
  processFile(file: File): boolean {
    this.uploadError.set(null);
    const error = this.validateFile(file);
    if (error) {
      this.uploadError.set(error);
      return false;
    }
    return true;
  }

  private hasAllowedExtension(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ALLOWED_EXTENSIONS.includes(ext);
  }

  private getFileIcon(mime?: string): string {
    if (!mime) return ICONS.FILE_CHECK;
    if (mime.includes('pdf')) return ICONS.FILE_TEXT;
    if (mime.includes('image')) return ICONS.IMAGE;
    return ICONS.FILE_CHECK;
  }
}
