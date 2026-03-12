import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';

describe('PhotoshopPsdService', () => {
  let service: PhotoshopPsdService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockPhotoshopApi = {
    generatePsd: vi.fn(),
    openFile: vi.fn(),
    getDownloadsPath: vi.fn(),
    findProjectPsd: vi.fn(),
    saveTempFiles: vi.fn(),
  };

  const mockPathService = {
    api: mockPhotoshopApi,
    workDir: vi.fn(() => null),
    psdPath: vi.fn(() => null),
    getDownloadsPath: vi.fn(),
    runJsx: vi.fn(),
  };

  const mockSettings = {
    marginCm: vi.fn(() => 2),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        PhotoshopPsdService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: PhotoshopSettingsService, useValue: mockSettings },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopPsdService);
  });

  it('létrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('parseSizeValue()', () => {
    it('kistablo aliast kezel', () => {
      const result = service.parseSizeValue('kistablo');
      expect(result).toEqual({ widthCm: 100, heightCm: 70 });
    });

    it('HxW formátumot parszol (magasság x szélesség)', () => {
      const result = service.parseSizeValue('80x120');
      expect(result).toEqual({ heightCm: 80, widthCm: 120 });
    });

    it('érvénytelen formátum null-t ad', () => {
      expect(service.parseSizeValue('abc')).toBeNull();
      expect(service.parseSizeValue('123')).toBeNull();
      expect(service.parseSizeValue('')).toBeNull();
      expect(service.parseSizeValue('80x')).toBeNull();
    });
  });

  describe('sanitizeName()', () => {
    it('ékezetes karaktereket cserél', () => {
      expect(service.sanitizeName('Kovács Áron')).toBe('kovacs_aron');
    });

    it('speciális karaktereket eltávolít', () => {
      expect(service.sanitizeName('Dr. Nagy-Kovács')).toBe('dr_nagy_kovacs');
    });

    it('szóközöket kicseréli', () => {
      expect(service.sanitizeName('Kiss Pista')).toBe('kiss_pista');
    });

    it('szélső szeparátorokat eltávolít', () => {
      expect(service.sanitizeName(' Test ')).toBe('test');
    });
  });

  describe('sanitizePathName()', () => {
    it('ugyanúgy működik mint a sanitizeName', () => {
      expect(service.sanitizePathName('Teszt Mappa!')).toBe('teszt_mappa');
    });
  });

  describe('buildProjectFolderName()', () => {
    it('iskola név + osztály slug', () => {
      const result = service.buildProjectFolderName({
        schoolName: 'Boronkay', projectName: 'Test', className: '13. R',
      });
      expect(result).toBe('boronkay_13_r');
    });

    it('iskola név nélkül projekt nevet használ', () => {
      const result = service.buildProjectFolderName({
        projectName: 'Teszt Projekt', className: 'A',
      });
      expect(result).toBe('teszt_projekt_a');
    });

    it('osztály nélkül csak az iskola/projekt nevét adja', () => {
      const result = service.buildProjectFolderName({
        schoolName: 'Arany', projectName: 'Test',
      });
      expect(result).toBe('arany');
    });
  });

  describe('computePsdPath()', () => {
    it('nincs api esetén null-t ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.computePsdPath('80x120');
      expect(result).toBeNull();
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('workDir + kontextussal projekt útvonalat generál', async () => {
      mockPathService.workDir.mockReturnValue('/work');
      const result = await service.computePsdPath('80x120', {
        projectName: 'Test', schoolName: 'Iskola', className: 'A', brandName: 'Brand',
      });
      const year = new Date().getFullYear().toString();
      expect(result).toContain('/work/brand/');
      expect(result).toContain(`/${year}/`);
      expect(result).toContain('.psd');
    });

    it('workDir nélkül Downloads mappát használ', async () => {
      mockPathService.workDir.mockReturnValue(null);
      mockPathService.getDownloadsPath.mockResolvedValue('/Downloads');
      const result = await service.computePsdPath('80x120');
      expect(result).toBe('/Downloads/PhotoStack/80x120.psd');
    });

    it('brandName nélkül photostack mappát használ', async () => {
      mockPathService.workDir.mockReturnValue('/work');
      const result = await service.computePsdPath('80x120', {
        projectName: 'Test', schoolName: 'Iskola',
      });
      expect(result).toContain('/work/photostack/');
    });
  });

  describe('computeProjectFolderPath()', () => {
    it('null ha nincs workDir', () => {
      mockPathService.workDir.mockReturnValue(null);
      const result = service.computeProjectFolderPath({ projectName: 'Test' });
      expect(result).toBeNull();
    });

    it('helyes útvonalat generál', () => {
      mockPathService.workDir.mockReturnValue('/work');
      const result = service.computeProjectFolderPath({
        projectName: 'Test', schoolName: 'Iskola', brandName: 'Brand',
      });
      const year = new Date().getFullYear().toString();
      expect(result).toBe(`/work/brand/${year}/iskola`);
    });
  });

  describe('findProjectPsd()', () => {
    it('nincs api esetén empty-t ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.findProjectPsd('/folder');
      expect(result.exists).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('megtalált PSD adatait visszaadja', async () => {
      mockPhotoshopApi.findProjectPsd.mockResolvedValue({
        success: true, exists: true, psdPath: '/test.psd',
        hasLayouts: true, hasPlacedPhotos: false, placedPhotos: null,
      });
      const result = await service.findProjectPsd('/folder');
      expect(result.exists).toBe(true);
      expect(result.psdPath).toBe('/test.psd');
    });

    it('nem megtalált PSD esetén empty', async () => {
      mockPhotoshopApi.findProjectPsd.mockResolvedValue({ success: true, exists: false });
      const result = await service.findProjectPsd('/folder');
      expect(result.exists).toBe(false);
    });

    it('hiba esetén empty', async () => {
      mockPhotoshopApi.findProjectPsd.mockRejectedValue(new Error('fail'));
      const result = await service.findProjectPsd('/folder');
      expect(result.exists).toBe(false);
    });
  });

  describe('generateAndOpenPsd()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.generateAndOpenPsd({ label: '80x120', value: '80x120' });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('érvénytelen méret formátum hibát ad', async () => {
      const result = await service.generateAndOpenPsd({ label: 'Bad', value: 'bad' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Érvénytelen méret');
    });

    it('sikeres generálás és megnyitás', async () => {
      mockPathService.workDir.mockReturnValue(null);
      mockPathService.getDownloadsPath.mockResolvedValue('/Downloads');
      mockPhotoshopApi.generatePsd.mockResolvedValue({ success: true, stdout: 'ok' });
      mockPhotoshopApi.openFile.mockResolvedValue({ success: true });

      const result = await service.generateAndOpenPsd({ label: '80x120', value: '80x120' });
      expect(result.success).toBe(true);
      expect(result.outputPath).toContain('.psd');
    });

    it('generálás hiba esetén error response', async () => {
      mockPathService.workDir.mockReturnValue(null);
      mockPathService.getDownloadsPath.mockResolvedValue('/Downloads');
      mockPhotoshopApi.generatePsd.mockResolvedValue({ success: false, error: 'gen fail' });

      const result = await service.generateAndOpenPsd({ label: '80x120', value: '80x120' });
      expect(result.success).toBe(false);
    });

    it('megnyitás hiba esetén error response', async () => {
      mockPathService.workDir.mockReturnValue(null);
      mockPathService.getDownloadsPath.mockResolvedValue('/Downloads');
      mockPhotoshopApi.generatePsd.mockResolvedValue({ success: true });
      mockPhotoshopApi.openFile.mockResolvedValue({ success: false, error: 'open fail' });

      const result = await service.generateAndOpenPsd({ label: '80x120', value: '80x120' });
      expect(result.success).toBe(false);
    });
  });

  describe('saveTempFiles()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveTempFiles([]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('fájlokat elment', async () => {
      const mockFile = {
        name: 'test.jpg',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as File;
      mockPhotoshopApi.saveTempFiles.mockResolvedValue({ success: true, paths: ['/tmp/test.jpg'] });
      const result = await service.saveTempFiles([mockFile]);
      expect(result.success).toBe(true);
      expect(result.paths).toHaveLength(1);
    });
  });

  describe('saveAndCloseDocument()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres mentés és bezárás', async () => {
      mockPathService.runJsx.mockResolvedValue({
        success: true, output: '__SAVE_CLOSE__OK',
      });
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(true);
    });

    it('JSX hiba esetén error', async () => {
      mockPathService.runJsx.mockResolvedValue({ success: false, error: 'hiba' });
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(false);
    });

    it('hiányzó OK token esetén error', async () => {
      mockPathService.runJsx.mockResolvedValue({ success: true, output: 'valami mas' });
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(false);
    });

    it('JSX HIBA mintát kiolvassa az output-ból', async () => {
      mockPathService.runJsx.mockResolvedValue({
        success: true, output: '[JSX] HIBA: Dokumentum nincs nyitva',
      });
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Dokumentum nincs nyitva');
    });

    it('hiba esetén error response', async () => {
      mockPathService.runJsx.mockRejectedValue(new Error('boom'));
      const result = await service.saveAndCloseDocument();
      expect(result.success).toBe(false);
    });
  });
});
