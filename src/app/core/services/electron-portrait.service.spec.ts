import { TestBed } from '@angular/core/testing';
import { ElectronPortraitService } from './electron-portrait.service';
import { LoggerService } from './logger.service';

describe('ElectronPortraitService', () => {
  let service: ElectronPortraitService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(ElectronPortraitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('böngésző fallback', () => {
    it('pythonAvailable null kezdetben', () => {
      expect(service.pythonAvailable()).toBeNull();
    });

    it('checkPython not available', async () => {
      const result = await service.checkPython();
      expect(result.available).toBe(false);
    });

    it('isPythonAvailable false', async () => {
      expect(await service.isPythonAvailable()).toBe(false);
    });

    it('processSingle not available', async () => {
      const result = await service.processSingle('/in.jpg', '/out.jpg', {} as any);
      expect(result.success).toBe(false);
    });

    it('processBatch not available', async () => {
      const result = await service.processBatch([], {} as any);
      expect(result.success).toBe(false);
    });

    it('downloadBackground not available', async () => {
      const result = await service.downloadBackground('https://example.com/bg.jpg', '/out.jpg');
      expect(result.success).toBe(false);
    });

    it('getTempDir null', async () => {
      expect(await service.getTempDir()).toBeNull();
    });

    it('cleanupTemp not successful', async () => {
      const result = await service.cleanupTemp([]);
      expect(result.success).toBe(false);
    });

    it('readProcessedFile not available', async () => {
      const result = await service.readProcessedFile({ filePath: '/test.jpg' });
      expect(result.success).toBe(false);
    });
  });
});
