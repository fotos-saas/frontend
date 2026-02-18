import { Injectable } from '@angular/core';
import { formatFileSize as formatFileSizeUtil } from '@shared/utils/formatters.util';

/**
 * Magic bytes konfiguráció
 */
export interface MagicBytesConfig {
  bytes: number[];
  offset?: number;
}

/**
 * Fájl típus konfiguráció
 */
export interface FileTypeConfig {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: RegExp;
  magicBytes?: MagicBytesConfig[];
  errorMessages: {
    size: string;
    type: string;
    magicBytes?: string;
  };
}

/**
 * Validáció eredmény
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Unified File Upload Validation Service
 *
 * Központi fájl validációs szolgáltatás:
 * - MIME type + extension kombinált validáció
 * - Magic bytes ellenőrzés (MIME spoofing védelem)
 * - Fájlméret validáció
 * - Központi hibaüzenetek
 */
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  /**
   * Háttérkép konfiguráció
   * JPG, JPEG, BMP - max 16MB
   */
  readonly backgroundConfig: FileTypeConfig = {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedMimeTypes: ['image/jpeg', 'image/bmp'],
    allowedExtensions: /\.(jpg|jpeg|bmp)$/i,
    magicBytes: [
      // JPEG: FF D8 FF
      { bytes: [0xFF, 0xD8, 0xFF] },
      // BMP: 42 4D (BM)
      { bytes: [0x42, 0x4D] }
    ],
    errorMessages: {
      size: 'A háttérkép maximum 16MB lehet!',
      type: 'Csak JPG, JPEG vagy BMP fájl tölthető fel!',
      magicBytes: 'A fájl tartalma nem felel meg a várt képformátumnak!'
    }
  };

  /**
   * Csatolmány konfiguráció
   * ZIP, RAR, 7Z - max 64MB
   */
  readonly attachmentConfig: FileTypeConfig = {
    maxSize: 64 * 1024 * 1024, // 64MB
    allowedMimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/octet-stream' // Néhány böngésző ezt használja
    ],
    allowedExtensions: /\.(zip|rar|7z)$/i,
    magicBytes: [
      // ZIP: 50 4B 03 04 (PK..)
      { bytes: [0x50, 0x4B, 0x03, 0x04] },
      // RAR: 52 61 72 21 1A 07 (Rar!..)
      { bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07] },
      // 7Z: 37 7A BC AF 27 1C
      { bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C] }
    ],
    errorMessages: {
      size: 'A csatolmány maximum 64MB lehet!',
      type: 'Csak ZIP, RAR vagy 7Z fájl tölthető fel!',
      magicBytes: 'A fájl tartalma nem felel meg a várt archív formátumnak!'
    }
  };

  /**
   * Konfiguráció lekérése típus alapján
   */
  getConfig(type: 'background' | 'attachment'): FileTypeConfig {
    return type === 'background' ? this.backgroundConfig : this.attachmentConfig;
  }

  /**
   * Szinkron fájl validáció (MIME + extension + méret)
   * @returns FileValidationResult
   */
  validateFile(file: File, type: 'background' | 'attachment'): FileValidationResult {
    const config = this.getConfig(type);

    // 1. Méret ellenőrzés
    if (file.size > config.maxSize) {
      return { valid: false, error: config.errorMessages.size };
    }

    // 2. MIME type + extension validáció
    const isValidType = config.allowedMimeTypes.includes(file.type);
    const isValidExtension = config.allowedExtensions.test(file.name);

    if (!isValidType && !isValidExtension) {
      return { valid: false, error: config.errorMessages.type };
    }

    return { valid: true };
  }

  /**
   * Teljes fájl validáció magic bytes-szal (async)
   * Használd ezt, ha MIME spoofing elleni védelmet akarsz.
   *
   * @param file - Fájl
   * @param type - Típus (background | attachment)
   * @returns Promise<FileValidationResult>
   */
  async validateFileWithMagicBytes(
    file: File,
    type: 'background' | 'attachment'
  ): Promise<FileValidationResult> {
    // Szinkron validáció először
    const syncResult = this.validateFile(file, type);
    if (!syncResult.valid) {
      return syncResult;
    }

    // Magic bytes validáció
    const config = this.getConfig(type);
    const isMagicBytesValid = await this.validateMagicBytes(file, config);

    if (!isMagicBytesValid) {
      return {
        valid: false,
        error: config.errorMessages.magicBytes || 'A fájl tartalma nem megfelelő!'
      };
    }

    return { valid: true };
  }

  /**
   * Magic bytes validáció
   * Ellenőrzi, hogy a fájl tartalma megfelel-e a várt típusnak
   *
   * @param file - Fájl
   * @param config - Konfiguráció magic bytes-szal
   * @returns Promise<boolean> - true ha valid
   */
  async validateMagicBytes(file: File, config: FileTypeConfig): Promise<boolean> {
    // Ha nincs magic bytes konfiguráció, átmegy
    if (!config.magicBytes || config.magicBytes.length === 0) {
      return true;
    }

    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer);

        // Ellenőrizzük az összes lehetséges magic bytes-ot
        for (const mb of config.magicBytes!) {
          const offset = mb.offset ?? 0;
          let matches = true;

          for (let i = 0; i < mb.bytes.length; i++) {
            if (arr[offset + i] !== mb.bytes[i]) {
              matches = false;
              break;
            }
          }

          if (matches) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      };

      reader.onerror = () => resolve(false);

      // Csak az első 16 byte-ot olvassuk (elég a magic bytes-hoz)
      reader.readAsArrayBuffer(file.slice(0, 16));
    });
  }

  /**
   * Fájlméret formázása olvasható formátumban
   * @deprecated Használd a `formatFileSize` függvényt a `@shared/utils/formatters.util`-ból
   * @param bytes - Méret byte-ban
   * @returns Formázott string (pl. "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    return formatFileSizeUtil(bytes);
  }
}
