import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FileUploadService, FileValidationResult } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileUploadService]
    });
    service = TestBed.inject(FileUploadService);
  });

  // ============================================================================
  // Configuration
  // ============================================================================
  describe('configuration', () => {
    describe('backgroundConfig', () => {
      it('should have correct max size (16MB)', () => {
        expect(service.backgroundConfig.maxSize).toBe(16 * 1024 * 1024);
      });

      it('should allow jpeg and bmp mime types', () => {
        expect(service.backgroundConfig.allowedMimeTypes).toContain('image/jpeg');
        expect(service.backgroundConfig.allowedMimeTypes).toContain('image/bmp');
      });

      it('should have magic bytes for JPEG and BMP', () => {
        expect(service.backgroundConfig.magicBytes).toHaveLength(2);
        // JPEG magic bytes: FF D8 FF
        expect(service.backgroundConfig.magicBytes![0].bytes).toEqual([0xFF, 0xD8, 0xFF]);
        // BMP magic bytes: 42 4D
        expect(service.backgroundConfig.magicBytes![1].bytes).toEqual([0x42, 0x4D]);
      });
    });

    describe('attachmentConfig', () => {
      it('should have correct max size (64MB)', () => {
        expect(service.attachmentConfig.maxSize).toBe(64 * 1024 * 1024);
      });

      it('should allow archive mime types', () => {
        expect(service.attachmentConfig.allowedMimeTypes).toContain('application/zip');
        expect(service.attachmentConfig.allowedMimeTypes).toContain('application/x-rar-compressed');
        expect(service.attachmentConfig.allowedMimeTypes).toContain('application/x-7z-compressed');
      });

      it('should have magic bytes for ZIP, RAR, and 7Z', () => {
        expect(service.attachmentConfig.magicBytes).toHaveLength(3);
        // ZIP magic bytes: 50 4B 03 04
        expect(service.attachmentConfig.magicBytes![0].bytes).toEqual([0x50, 0x4B, 0x03, 0x04]);
      });
    });

    describe('getConfig', () => {
      it('should return background config for "background" type', () => {
        expect(service.getConfig('background')).toBe(service.backgroundConfig);
      });

      it('should return attachment config for "attachment" type', () => {
        expect(service.getConfig('attachment')).toBe(service.attachmentConfig);
      });
    });
  });

  // ============================================================================
  // validateFile (synchronous)
  // ============================================================================
  describe('validateFile', () => {
    describe('background validation', () => {
      it('should accept valid JPEG file', () => {
        const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

        const result = service.validateFile(file, 'background');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid BMP file', () => {
        const file = new File(['content'], 'photo.bmp', { type: 'image/bmp' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

        const result = service.validateFile(file, 'background');

        expect(result.valid).toBe(true);
      });

      it('should reject file exceeding size limit', () => {
        const file = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // 20MB

        const result = service.validateFile(file, 'background');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('A háttérkép maximum 16MB lehet!');
      });

      it('should reject invalid file type', () => {
        const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });

        const result = service.validateFile(file, 'background');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Csak JPG, JPEG vagy BMP fájl tölthető fel!');
      });

      it('should accept file with valid extension even if mime type is generic', () => {
        // Some browsers report generic mime types
        const file = new File(['content'], 'photo.jpg', { type: 'application/octet-stream' });
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });

        const result = service.validateFile(file, 'background');

        // Should pass because extension is valid
        expect(result.valid).toBe(true);
      });
    });

    describe('attachment validation', () => {
      it('should accept valid ZIP file', () => {
        const file = new File(['content'], 'archive.zip', { type: 'application/zip' });
        Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 }); // 30MB

        const result = service.validateFile(file, 'attachment');

        expect(result.valid).toBe(true);
      });

      it('should accept valid RAR file', () => {
        const file = new File(['content'], 'archive.rar', { type: 'application/x-rar-compressed' });
        Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 }); // 50MB

        const result = service.validateFile(file, 'attachment');

        expect(result.valid).toBe(true);
      });

      it('should reject file exceeding 64MB', () => {
        const file = new File(['content'], 'large.zip', { type: 'application/zip' });
        Object.defineProperty(file, 'size', { value: 70 * 1024 * 1024 }); // 70MB

        const result = service.validateFile(file, 'attachment');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('A csatolmány maximum 64MB lehet!');
      });

      it('should reject non-archive files', () => {
        const file = new File(['content'], 'image.png', { type: 'image/png' });
        Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });

        const result = service.validateFile(file, 'attachment');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Csak ZIP, RAR vagy 7Z fájl tölthető fel!');
      });
    });
  });

  // ============================================================================
  // validateMagicBytes
  // ============================================================================
  describe('validateMagicBytes', () => {
    it('should return true when no magic bytes config exists', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const configWithoutMagicBytes = {
        ...service.backgroundConfig,
        magicBytes: undefined
      };

      const result = await service.validateMagicBytes(file, configWithoutMagicBytes);

      expect(result).toBe(true);
    });

    it('should return true when magic bytes array is empty', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const configWithEmptyMagicBytes = {
        ...service.backgroundConfig,
        magicBytes: []
      };

      const result = await service.validateMagicBytes(file, configWithEmptyMagicBytes);

      expect(result).toBe(true);
    });

    it('should validate JPEG magic bytes correctly', async () => {
      // Create a file with JPEG magic bytes: FF D8 FF
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const file = new File([jpegBytes], 'photo.jpg', { type: 'image/jpeg' });

      const result = await service.validateMagicBytes(file, service.backgroundConfig);

      expect(result).toBe(true);
    });

    it('should validate BMP magic bytes correctly', async () => {
      // Create a file with BMP magic bytes: 42 4D (BM)
      const bmpBytes = new Uint8Array([0x42, 0x4D, 0x00, 0x00, 0x00, 0x00]);
      const file = new File([bmpBytes], 'photo.bmp', { type: 'image/bmp' });

      const result = await service.validateMagicBytes(file, service.backgroundConfig);

      expect(result).toBe(true);
    });

    it('should reject file with invalid magic bytes', async () => {
      // Create a file with random bytes that don't match JPEG or BMP
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidBytes], 'fake.jpg', { type: 'image/jpeg' });

      const result = await service.validateMagicBytes(file, service.backgroundConfig);

      expect(result).toBe(false);
    });

    it('should validate ZIP magic bytes correctly', async () => {
      // Create a file with ZIP magic bytes: 50 4B 03 04 (PK..)
      const zipBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]);
      const file = new File([zipBytes], 'archive.zip', { type: 'application/zip' });

      const result = await service.validateMagicBytes(file, service.attachmentConfig);

      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // validateFileWithMagicBytes (async full validation)
  // ============================================================================
  describe('validateFileWithMagicBytes', () => {
    it('should return error if sync validation fails', async () => {
      const file = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // Too large

      const result = await service.validateFileWithMagicBytes(file, 'background');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('A háttérkép maximum 16MB lehet!');
    });

    it('should validate magic bytes after sync validation passes', async () => {
      // Create valid JPEG
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const file = new File([jpegBytes], 'photo.jpg', { type: 'image/jpeg' });

      const result = await service.validateFileWithMagicBytes(file, 'background');

      expect(result.valid).toBe(true);
    });

    it('should return magic bytes error for spoofed file', async () => {
      // Create a file that claims to be JPEG but has wrong magic bytes
      const fakeBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const file = new File([fakeBytes], 'fake.jpg', { type: 'image/jpeg' });

      const result = await service.validateFileWithMagicBytes(file, 'background');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('A fájl tartalma nem felel meg a várt képformátumnak!');
    });
  });

  // ============================================================================
  // formatFileSize
  // ============================================================================
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(service.formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(service.formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(service.formatFileSize(1024)).toBe('1 KB');
      expect(service.formatFileSize(2560)).toBe('2.5 KB');
    });

    it('should format megabytes', () => {
      expect(service.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(service.formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(service.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(service.formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });
  });
});
