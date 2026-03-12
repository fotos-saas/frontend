import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopSampleService } from './photoshop-sample.service';

describe('PhotoshopSampleService', () => {
  let service: PhotoshopSampleService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockRunJsx = vi.fn();
  const mockPhotoshopApi = { runJsx: mockRunJsx };

  const mockSampleApi = { generate: vi.fn() };
  const mockFinalizerApi = { upload: vi.fn() };

  const mockPathService = {
    api: mockPhotoshopApi,
    psdPath: vi.fn(() => '/work/project/test.psd'),
    runJsx: mockRunJsx,
  };

  const mockSettings = {
    sampleWatermarkText: vi.fn(() => 'MINTA'),
    sampleWatermarkColor: vi.fn(() => 'white' as const),
    sampleWatermarkOpacity: vi.fn(() => 0.15),
    sampleSizeLarge: vi.fn(() => 4000),
    sampleSizeSmall: vi.fn(() => 2000),
  };

  const mockPsdService = {
    buildProjectFolderName: vi.fn(() => 'iskola_12a'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = {
      photoshop: mockPhotoshopApi,
      sample: mockSampleApi,
      finalizer: mockFinalizerApi,
    };
    // Mock sessionStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');

    TestBed.configureTestingModule({
      providers: [
        PhotoshopSampleService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: PhotoshopSettingsService, useValue: mockSettings },
        { provide: PhotoshopPsdService, useValue: mockPsdService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopSampleService);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    vi.restoreAllMocks();
  });

  it('letrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('generateSample()', () => {
    it('nincs api/sampleApi esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.generateSample(1, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Nem Electron környezet');
    });

    it('nincs psdPath esetén hibaüzenetet ad', async () => {
      mockPathService.psdPath.mockReturnValue(null);
      const result = await service.generateSample(1, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nincs megnyitott PSD');
      mockPathService.psdPath.mockReturnValue('/work/project/test.psd');
    });

    it('flatten hiba esetén error response', async () => {
      mockRunJsx.mockResolvedValue({ success: false, error: 'flatten fail' });
      const result = await service.generateSample(1, 'Test');
      expect(result.success).toBe(false);
    });

    it('sikeres minta generálás kis mérettel', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockSampleApi.generate.mockResolvedValue({
        success: true, localPaths: ['/out/minta.jpg'], uploadedCount: 1,
      });

      const result = await service.generateSample(1, 'Test', false);
      expect(result.success).toBe(true);
      expect(mockSampleApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          psdFilePath: '/tmp/flat.jpg',
          projectId: 1,
          sizes: [{ name: 'minta', width: 2000 }], // sampleSizeSmall
        }),
      );
    });

    it('sikeres minta generálás nagy mérettel', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockSampleApi.generate.mockResolvedValue({ success: true });

      await service.generateSample(1, 'Test', true);
      expect(mockSampleApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          sizes: [{ name: 'minta', width: 4000 }], // sampleSizeLarge
        }),
      );
    });

    it('watermark beállításokat átadja', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockSampleApi.generate.mockResolvedValue({ success: true });

      await service.generateSample(1, 'Test');
      expect(mockSampleApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          watermarkText: 'MINTA',
          watermarkColor: 'white',
          watermarkOpacity: 0.15,
        }),
      );
    });

    it('exception esetén error response', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockSampleApi.generate.mockRejectedValue(new Error('boom'));
      const result = await service.generateSample(1, 'Test');
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generateFinal()', () => {
    it('nincs api/finalizerApi esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.generateFinal(1, 'Test');
      expect(result.success).toBe(false);
    });

    it('nincs psdPath esetén hibaüzenetet ad', async () => {
      mockPathService.psdPath.mockReturnValue(null);
      const result = await service.generateFinal(1, 'Test');
      expect(result.success).toBe(false);
      mockPathService.psdPath.mockReturnValue('/work/project/test.psd');
    });

    it('flatten hiba esetén error response', async () => {
      mockRunJsx.mockResolvedValue({ success: false, error: 'flatten fail' });
      const result = await service.generateFinal(1, 'Test');
      expect(result.success).toBe(false);
    });

    it('sikeres véglegesítés', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockFinalizerApi.upload.mockResolvedValue({ success: true, localPath: '/out/final.jpg' });

      const result = await service.generateFinal(1, 'Test');
      expect(result.success).toBe(true);
      expect(mockFinalizerApi.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          flattenedJpgPath: '/tmp/flat.jpg',
          type: 'flat',
        }),
      );
    });

    it('exception esetén error response', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockFinalizerApi.upload.mockRejectedValue(new Error('boom'));
      const result = await service.generateFinal(1, 'Test');
      expect(result.success).toBe(false);
    });
  });

  describe('generateSmallTablo()', () => {
    it('nincs api/finalizerApi esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.generateSmallTablo(1, 'Test');
      expect(result.success).toBe(false);
    });

    it('nincs psdPath esetén hibaüzenetet ad', async () => {
      mockPathService.psdPath.mockReturnValue(null);
      const result = await service.generateSmallTablo(1, 'Test');
      expect(result.success).toBe(false);
      mockPathService.psdPath.mockReturnValue('/work/project/test.psd');
    });

    it('sikeres kistabló generálás', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockFinalizerApi.upload.mockResolvedValue({ success: true });

      const result = await service.generateSmallTablo(1, 'Test');
      expect(result.success).toBe(true);
      expect(mockFinalizerApi.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'small_tablo',
          maxSize: 3000,
        }),
      );
    });

    it('exception esetén error response', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockFinalizerApi.upload.mockRejectedValue(new Error('boom'));
      const result = await service.generateSmallTablo(1, 'Test');
      expect(result.success).toBe(false);
    });
  });

  describe('flatten export - közös viselkedés', () => {
    it('hiányzó OK minta a flatten output-ban', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: 'no-ok-here' });
      const result = await service.generateSample(1, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('nem adott vissza OK');
    });

    it('quality=95 a sample-nél, quality=12 a final-nál', async () => {
      // Sample: quality=95
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockSampleApi.generate.mockResolvedValue({ success: true });
      await service.generateSample(1, 'Test');
      const sampleCall = mockRunJsx.mock.calls[0][0];
      expect(sampleCall.jsonData.quality).toBe(95);

      vi.clearAllMocks();

      // Final: quality=12
      mockRunJsx.mockResolvedValue({
        success: true, output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      });
      mockFinalizerApi.upload.mockResolvedValue({ success: true });
      await service.generateFinal(1, 'Test');
      const finalCall = mockRunJsx.mock.calls[0][0];
      expect(finalCall.jsonData.quality).toBe(12);
    });
  });
});
