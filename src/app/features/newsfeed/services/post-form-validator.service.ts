import { Injectable } from '@angular/core';
import { formatFileSize } from '@shared/utils/formatters.util';

/**
 * Validációs hibák típus
 */
export interface PostFormErrors {
  title?: string;
  content?: string;
  eventDate?: string;
  media?: string;
}

/**
 * Form adatok validáláshoz
 */
export interface PostFormData {
  postType: 'announcement' | 'event';
  title: string;
  contentTextLength: number;
  eventDate: string;
}

/**
 * Média validálás eredménye
 */
export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Post Form Validator Service
 *
 * A poszt létrehozás/szerkesztés form validációs logikája.
 * Kiemelve a create-post-dialog komponensből a Clean Code elvek szerint.
 */
@Injectable({
  providedIn: 'root'
})
export class PostFormValidatorService {
  /** Max fájl méret (10MB) */
  readonly maxFileSize = 10 * 1024 * 1024;

  /** Max fájlok száma */
  readonly maxFiles = 5;

  /** Engedélyezett MIME típusok */
  readonly validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4'
  ];

  /**
   * Teljes form validáció
   */
  validate(data: PostFormData): PostFormErrors {
    const errors: PostFormErrors = {};

    // Cím validáció
    const titleError = this.validateTitle(data.title);
    if (titleError) errors.title = titleError;

    // Tartalom validáció
    const contentError = this.validateContent(data.contentTextLength);
    if (contentError) errors.content = contentError;

    // Esemény dátum validáció
    if (data.postType === 'event') {
      const dateError = this.validateEventDate(data.eventDate);
      if (dateError) errors.eventDate = dateError;
    }

    return errors;
  }

  /**
   * Van-e hiba
   */
  hasErrors(errors: PostFormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /**
   * Cím validáció
   */
  validateTitle(title: string): string | undefined {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return 'A cím megadása kötelező.';
    }

    if (trimmedTitle.length < 3) {
      return 'A cím legalább 3 karakter legyen.';
    }

    if (trimmedTitle.length > 255) {
      return 'A cím maximum 255 karakter lehet.';
    }

    return undefined;
  }

  /**
   * Tartalom validáció
   */
  validateContent(textLength: number): string | undefined {
    if (textLength > 5000) {
      return 'A tartalom maximum 5000 karakter lehet.';
    }

    return undefined;
  }

  /**
   * Esemény dátum validáció
   */
  validateEventDate(eventDate: string): string | undefined {
    if (!eventDate) {
      return 'Esemény esetén a dátum megadása kötelező.';
    }

    const selectedDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return 'Az esemény dátuma nem lehet múltbeli.';
    }

    return undefined;
  }

  /**
   * Média fájl validáció
   */
  validateMediaFile(file: File): MediaValidationResult {
    // Méret ellenőrzés
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `A fájl túl nagy: ${file.name} (max 10MB)`
      };
    }

    // Típus ellenőrzés
    if (!this.validMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Nem támogatott fájltípus: ${file.name}`
      };
    }

    return { valid: true };
  }

  /**
   * Fájl méret formázás
   * @deprecated Használd a `formatFileSize` függvényt a `@shared/utils/formatters.util`-ból
   */
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  /**
   * Minimum dátum (ma)
   */
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Form érvényes-e (gyors ellenőrzés)
   */
  isFormValid(title: string, postType: 'announcement' | 'event', eventDate: string): boolean {
    const titleValid = title.trim().length >= 3;
    if (postType === 'event') {
      return titleValid && !!eventDate;
    }
    return titleValid;
  }
}
