import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProjectPrintTabStateService } from './project-print-tab-state.service';

describe('ProjectPrintTabStateService', () => {
  let service: ProjectPrintTabStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectPrintTabStateService],
    });
    service = TestBed.inject(ProjectPrintTabStateService);
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('draggingSmallTablo false', () => {
      expect(service.draggingSmallTablo()).toBe(false);
    });

    it('draggingFlat false', () => {
      expect(service.draggingFlat()).toBe(false);
    });

    it('uploading false', () => {
      expect(service.uploading()).toBe(false);
    });

    it('uploadError null', () => {
      expect(service.uploadError()).toBeNull();
    });
  });

  // ============================================================================
  // Ikon computed-ok
  // ============================================================================
  describe('ikon computed-ok', () => {
    it('smallTabloIcon alapertelmezetten file-check', () => {
      expect(service.smallTabloIcon()).toBe('file-check');
    });

    it('flatIcon alapertelmezetten file-check', () => {
      expect(service.flatIcon()).toBe('file-check');
    });

    it('pdf mime eseten file-text ikon', () => {
      service.updateMimeTypes('application/pdf', undefined);
      expect(service.smallTabloIcon()).toBe('file-text');
    });

    it('image mime eseten image ikon', () => {
      service.updateMimeTypes(undefined, 'image/tiff');
      expect(service.flatIcon()).toBe('image');
    });

    it('image/jpeg mime eseten image ikon', () => {
      service.updateMimeTypes('image/jpeg', undefined);
      expect(service.smallTabloIcon()).toBe('image');
    });

    it('ismeretlen mime eseten file-check ikon', () => {
      service.updateMimeTypes('application/octet-stream', undefined);
      expect(service.smallTabloIcon()).toBe('file-check');
    });
  });

  // ============================================================================
  // updateMimeTypes()
  // ============================================================================
  describe('updateMimeTypes()', () => {
    it('mindket tipust frissiti', () => {
      service.updateMimeTypes('application/pdf', 'image/tiff');
      expect(service.smallTabloIcon()).toBe('file-text');
      expect(service.flatIcon()).toBe('image');
    });

    it('undefined-ra allitva file-check-re all vissza', () => {
      service.updateMimeTypes('application/pdf', 'image/tiff');
      service.updateMimeTypes(undefined, undefined);
      expect(service.smallTabloIcon()).toBe('file-check');
      expect(service.flatIcon()).toBe('file-check');
    });
  });

  // ============================================================================
  // setDragging()
  // ============================================================================
  describe('setDragging()', () => {
    it('small_tablo tipust allit', () => {
      service.setDragging('small_tablo', true);
      expect(service.draggingSmallTablo()).toBe(true);
      expect(service.draggingFlat()).toBe(false);
    });

    it('flat tipust allit', () => {
      service.setDragging('flat', true);
      expect(service.draggingFlat()).toBe(true);
      expect(service.draggingSmallTablo()).toBe(false);
    });

    it('false-ra allitja', () => {
      service.setDragging('small_tablo', true);
      service.setDragging('small_tablo', false);
      expect(service.draggingSmallTablo()).toBe(false);
    });
  });

  // ============================================================================
  // resetDragging()
  // ============================================================================
  describe('resetDragging()', () => {
    it('mindket drag allapotot false-ra allit', () => {
      service.setDragging('small_tablo', true);
      service.setDragging('flat', true);

      service.resetDragging();

      expect(service.draggingSmallTablo()).toBe(false);
      expect(service.draggingFlat()).toBe(false);
    });
  });

  // ============================================================================
  // validateFile()
  // ============================================================================
  describe('validateFile()', () => {
    it('null-t ad PDF fajlra', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('null-t ad TIFF fajlra', () => {
      const file = new File([''], 'test.tiff', { type: 'image/tiff' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('null-t ad PSD fajlra (mime)', () => {
      const file = new File([''], 'test.psd', { type: 'image/vnd.adobe.photoshop' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('null-t ad JPG fajlra', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('null-t ad PNG fajlra', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('hibat ad nem tamogatott tipusra', () => {
      const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      const result = service.validateFile(file);
      expect(result).toContain('Nem támogatott');
    });

    it('elfogadja kiterjesztes alapjan ha a mime nem egyezik', () => {
      // Ures mime, de jo kiterjesztes
      const file = new File([''], 'test.psd', { type: '' });
      expect(service.validateFile(file)).toBeNull();
    });

    it('hibat ad tul nagy fajlra', () => {
      const largeContent = new ArrayBuffer(201 * 1024 * 1024);
      const file = new File([largeContent], 'test.pdf', { type: 'application/pdf' });
      const result = service.validateFile(file);
      expect(result).toContain('túl nagy');
    });

    it('elfogad pontosan 200 MB-os fajlt', () => {
      const content = new ArrayBuffer(200 * 1024 * 1024);
      const file = new File([content], 'test.pdf', { type: 'application/pdf' });
      expect(service.validateFile(file)).toBeNull();
    });
  });

  // ============================================================================
  // processFile()
  // ============================================================================
  describe('processFile()', () => {
    it('true-t ad valid fajlra', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(service.processFile(file)).toBe(true);
      expect(service.uploadError()).toBeNull();
    });

    it('false-t ad invalid fajlra es beallitja az uploadError-t', () => {
      const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      expect(service.processFile(file)).toBe(false);
      expect(service.uploadError()).not.toBeNull();
    });

    it('torli a korabbi hibat mielott validalna', () => {
      service.uploadError.set('Korabbi hiba');
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });

      service.processFile(file);

      expect(service.uploadError()).toBeNull();
    });
  });
});
