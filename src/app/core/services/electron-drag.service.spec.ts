import { TestBed } from '@angular/core/testing';
import { ElectronDragService } from './electron-drag.service';
import { LoggerService } from './logger.service';

describe('ElectronDragService', () => {
  let service: ElectronDragService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(ElectronDragService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('böngésző fallback', () => {
    it('prepareDragFiles nem támogatott', async () => {
      const result = await service.prepareDragFiles([]);
      expect(result.success).toBe(false);
    });

    it('startNativeDrag nem dob hibát', () => {
      expect(() => service.startNativeDrag([])).not.toThrow();
    });

    it('getDragTempDir null', async () => {
      expect(await service.getDragTempDir()).toBeNull();
    });

    it('cleanupDragFiles false', async () => {
      expect(await service.cleanupDragFiles([])).toBe(false);
    });

    it('prepareAndStartDrag nem támogatott', async () => {
      const result = await service.prepareAndStartDrag([]);
      expect(result.success).toBe(false);
    });
  });

  describe('Touch Bar', () => {
    it('hasTouchBar false böngészőben', () => {
      expect(service.hasTouchBar).toBe(false);
    });

    it('setTouchBarContext false', async () => {
      expect(await service.setTouchBarContext('dashboard')).toBe(false);
    });

    it('setTouchBarItems false', async () => {
      expect(await service.setTouchBarItems([])).toBe(false);
    });

    it('clearTouchBar false', async () => {
      expect(await service.clearTouchBar()).toBe(false);
    });

    it('onTouchBarAction nem dob hibát', () => {
      expect(() => service.onTouchBarAction(vi.fn())).not.toThrow();
    });
  });
});
