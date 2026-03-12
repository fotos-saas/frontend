import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';

describe('PhotoshopPathService', () => {
  let service: PhotoshopPathService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockPhotoshopApi = {
    checkInstalled: vi.fn(),
    setPath: vi.fn(),
    launch: vi.fn(),
    browsePath: vi.fn(),
    setWorkDir: vi.fn(),
    getWorkDir: vi.fn(),
    browseWorkDir: vi.fn(),
    openFile: vi.fn(),
    revealInFinder: vi.fn(),
    checkPsdExists: vi.fn(),
    backupPsd: vi.fn(),
    getDownloadsPath: vi.fn(),
    runJsx: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = { photoshop: mockPhotoshopApi };

    TestBed.configureTestingModule({
      providers: [
        PhotoshopPathService,
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopPathService);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('létrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('api getter', () => {
    it('visszaadja a window.electronAPI.photoshop referenciát', () => {
      expect(service.api).toBe(mockPhotoshopApi);
    });

    it('undefined-ot ad ha nincs electronAPI', () => {
      delete (window as any).electronAPI;
      expect(service.api).toBeUndefined();
    });
  });

  describe('signal-ok alapértékei', () => {
    it('path null alapértelmezetten', () => {
      expect(service.path()).toBeNull();
    });

    it('workDir null alapértelmezetten', () => {
      expect(service.workDir()).toBeNull();
    });

    it('isConfigured false alapértelmezetten', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('checking false alapértelmezetten', () => {
      expect(service.checking()).toBe(false);
    });

    it('psdPath null alapértelmezetten', () => {
      expect(service.psdPath()).toBeNull();
    });
  });

  describe('detectPath()', () => {
    it('nincs api esetén nem csinál semmit', async () => {
      delete (window as any).electronAPI;
      service = TestBed.inject(PhotoshopPathService);
      await service.detectPath();
      expect(service.path()).toBeNull();
    });

    it('megtalálja a Photoshop útvonalat', async () => {
      mockPhotoshopApi.checkInstalled.mockResolvedValue({ found: true, path: '/Applications/Photoshop.app' });
      mockPhotoshopApi.getWorkDir.mockResolvedValue(null);

      await service.detectPath();
      expect(service.path()).toBe('/Applications/Photoshop.app');
      expect(service.checking()).toBe(false);
    });

    it('betölti a mentett munka mappát', async () => {
      mockPhotoshopApi.checkInstalled.mockResolvedValue({ found: false, path: null });
      mockPhotoshopApi.getWorkDir.mockResolvedValue('/Users/test/work');

      await service.detectPath();
      expect(service.workDir()).toBe('/Users/test/work');
    });

    it('hiba esetén logol és checking false lesz', async () => {
      mockPhotoshopApi.checkInstalled.mockRejectedValue(new Error('test'));
      await service.detectPath();
      expect(service.checking()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('checkInstalled-ben nem talált path-nál null marad', async () => {
      mockPhotoshopApi.checkInstalled.mockResolvedValue({ found: false, path: null });
      mockPhotoshopApi.getWorkDir.mockResolvedValue(null);

      await service.detectPath();
      expect(service.path()).toBeNull();
    });
  });

  describe('setPath()', () => {
    it('nincs api esetén false-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.setPath('/test');
      expect(result).toBe(false);
    });

    it('sikeres beállítás frissíti a signal-t', async () => {
      mockPhotoshopApi.setPath.mockResolvedValue({ success: true });
      const result = await service.setPath('/Applications/PS.app');
      expect(result).toBe(true);
      expect(service.path()).toBe('/Applications/PS.app');
    });

    it('sikertelen beállítás nem frissíti a signal-t', async () => {
      mockPhotoshopApi.setPath.mockResolvedValue({ success: false, error: 'invalid' });
      const result = await service.setPath('/invalid');
      expect(result).toBe(false);
      expect(service.path()).toBeNull();
    });

    it('hiba esetén false-t ad és logol', async () => {
      mockPhotoshopApi.setPath.mockRejectedValue(new Error('boom'));
      const result = await service.setPath('/test');
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('launchPhotoshop()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.launchPhotoshop();
      expect(result).toEqual({ success: false, error: 'Nem Electron környezet' });
    });

    it('sikeres indítás', async () => {
      mockPhotoshopApi.launch.mockResolvedValue({ success: true });
      const result = await service.launchPhotoshop();
      expect(result).toEqual({ success: true });
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.launch.mockRejectedValue(new Error('fail'));
      const result = await service.launchPhotoshop();
      expect(result).toEqual({ success: false, error: 'Nem sikerült elindítani' });
    });
  });

  describe('browseForPhotoshop()', () => {
    it('nincs api esetén null-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.browseForPhotoshop();
      expect(result).toBeNull();
    });

    it('kiválasztott path-t adja vissza', async () => {
      mockPhotoshopApi.browsePath.mockResolvedValue({ cancelled: false, path: '/ps/path' });
      const result = await service.browseForPhotoshop();
      expect(result).toBe('/ps/path');
    });

    it('cancel esetén null-t ad', async () => {
      mockPhotoshopApi.browsePath.mockResolvedValue({ cancelled: true });
      const result = await service.browseForPhotoshop();
      expect(result).toBeNull();
    });

    it('hiba esetén null-t ad', async () => {
      mockPhotoshopApi.browsePath.mockRejectedValue(new Error('fail'));
      const result = await service.browseForPhotoshop();
      expect(result).toBeNull();
    });
  });

  describe('setWorkDir()', () => {
    it('nincs api esetén false-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.setWorkDir('/test');
      expect(result).toBe(false);
    });

    it('sikeres beállítás frissíti a signal-t', async () => {
      mockPhotoshopApi.setWorkDir.mockResolvedValue({ success: true });
      const result = await service.setWorkDir('/work');
      expect(result).toBe(true);
      expect(service.workDir()).toBe('/work');
    });

    it('sikertelen beállítás', async () => {
      mockPhotoshopApi.setWorkDir.mockResolvedValue({ success: false, error: 'hiba' });
      const result = await service.setWorkDir('/bad');
      expect(result).toBe(false);
    });
  });

  describe('browseForWorkDir()', () => {
    it('nincs api esetén null-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.browseForWorkDir();
      expect(result).toBeNull();
    });

    it('kiválasztott path-t adja vissza', async () => {
      mockPhotoshopApi.browseWorkDir.mockResolvedValue({ cancelled: false, path: '/work/dir' });
      const result = await service.browseForWorkDir();
      expect(result).toBe('/work/dir');
    });

    it('cancel esetén null-t ad', async () => {
      mockPhotoshopApi.browseWorkDir.mockResolvedValue({ cancelled: true });
      const result = await service.browseForWorkDir();
      expect(result).toBeNull();
    });
  });

  describe('openPsdFile()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.openPsdFile('/test.psd');
      expect(result).toEqual({ success: false, error: 'Nem Electron környezet' });
    });

    it('sikeres megnyitás', async () => {
      mockPhotoshopApi.openFile.mockResolvedValue({ success: true });
      const result = await service.openPsdFile('/test.psd');
      expect(result).toEqual({ success: true });
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.openFile.mockRejectedValue(new Error('fail'));
      const result = await service.openPsdFile('/test.psd');
      expect(result).toEqual({ success: false, error: 'Váratlan hiba a PSD megnyitásnál' });
    });
  });

  describe('revealInFinder()', () => {
    it('meghívja az api.revealInFinder-t', () => {
      service.revealInFinder('/test/file');
      expect(mockPhotoshopApi.revealInFinder).toHaveBeenCalledWith('/test/file');
    });
  });

  describe('checkPsdExists()', () => {
    it('nincs api esetén empty-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.checkPsdExists('/test.psd');
      expect(result).toEqual({ exists: false, hasLayouts: false });
    });

    it('sikeres ellenőrzés visszaadja az adatokat', async () => {
      mockPhotoshopApi.checkPsdExists.mockResolvedValue({
        success: true, exists: true, hasLayouts: true,
        hasPlacedPhotos: true, placedPhotos: { layer1: 1 }, majorityWithFrame: false,
      });
      const result = await service.checkPsdExists('/test.psd');
      expect(result.exists).toBe(true);
      expect(result.hasLayouts).toBe(true);
      expect(result.hasPlacedPhotos).toBe(true);
    });

    it('hiba esetén empty-t ad', async () => {
      mockPhotoshopApi.checkPsdExists.mockRejectedValue(new Error('fail'));
      const result = await service.checkPsdExists('/test.psd');
      expect(result).toEqual({ exists: false, hasLayouts: false });
    });
  });

  describe('backupPsd()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.backupPsd('/test.psd');
      expect(result).toEqual({ success: false, error: 'Nem Electron környezet' });
    });

    it('sikeres backup', async () => {
      mockPhotoshopApi.backupPsd.mockResolvedValue({ success: true, backupPath: '/backup.psd' });
      const result = await service.backupPsd('/test.psd');
      expect(result.success).toBe(true);
      expect(result.backupPath).toBe('/backup.psd');
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.backupPsd.mockRejectedValue(new Error('fail'));
      const result = await service.backupPsd('/test.psd');
      expect(result.success).toBe(false);
    });
  });

  describe('getDownloadsPath()', () => {
    it('nincs api esetén üres stringet ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.getDownloadsPath();
      expect(result).toBe('');
    });

    it('visszaadja a downloads path-t', async () => {
      mockPhotoshopApi.getDownloadsPath.mockResolvedValue('/Users/test/Downloads');
      const result = await service.getDownloadsPath();
      expect(result).toBe('/Users/test/Downloads');
    });
  });

  describe('runJsx()', () => {
    it('runJsx hozzáadja a psdFilePath-ot', () => {
      service.psdPath.set('/test.psd');
      mockPhotoshopApi.runJsx.mockResolvedValue({ success: true });

      service.runJsx({ scriptName: 'test.jsx' });
      expect(mockPhotoshopApi.runJsx).toHaveBeenCalledWith({
        scriptName: 'test.jsx',
        psdFilePath: '/test.psd',
      });
    });

    it('psdFilePath undefined ha nincs psdPath', () => {
      mockPhotoshopApi.runJsx.mockResolvedValue({ success: true });
      service.runJsx({ scriptName: 'test.jsx' });
      expect(mockPhotoshopApi.runJsx).toHaveBeenCalledWith({
        scriptName: 'test.jsx',
        psdFilePath: undefined,
      });
    });
  });
});
