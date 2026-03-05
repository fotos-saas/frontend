import { TestBed } from '@angular/core/testing';
import { ElectronCropService } from './electron-crop.service';
import { LoggerService } from './logger.service';

describe('ElectronCropService', () => {
  let service: ElectronCropService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(ElectronCropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('böngésző fallback', () => {
    it('checkPython not available', async () => {
      const result = await service.checkPython();
      expect(result.available).toBe(false);
    });

    it('mediapipeAvailable null kezdetben', () => {
      expect(service.mediapipeAvailable()).toBeNull();
    });

    it('detectFaces not available', async () => {
      const result = await service.detectFaces('/test.jpg');
      expect(result.success).toBe(false);
    });

    it('detectBatch not available', async () => {
      const result = await service.detectBatch([{ input: '/test.jpg' }]);
      expect(result.success).toBe(false);
    });

    it('executeCrop not available', async () => {
      const result = await service.executeCrop('/in.jpg', '/out.jpg', {} as any, {});
      expect(result.success).toBe(false);
    });

    it('getTempDir null', async () => {
      expect(await service.getTempDir()).toBeNull();
    });

    it('cleanupTemp not successful', async () => {
      const result = await service.cleanupTemp([]);
      expect(result.success).toBe(false);
    });

    it('downloadPhoto not available', async () => {
      const result = await service.downloadPhoto('https://example.com/img.jpg', '/out.jpg');
      expect(result.success).toBe(false);
    });

    it('readProcessedFile not available', async () => {
      const result = await service.readProcessedFile('/test.jpg');
      expect(result.success).toBe(false);
    });

    it('saveTempFile not available', async () => {
      const result = await service.saveTempFile('file.jpg', new ArrayBuffer(0));
      expect(result.success).toBe(false);
    });
  });
});
