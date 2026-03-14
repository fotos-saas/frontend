import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';
import { PhotoshopSnapshotService } from './photoshop-snapshot.service';

describe('PhotoshopSnapshotService', () => {
  let service: PhotoshopSnapshotService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockPhotoshopApi = {
    saveSnapshot: vi.fn(),
    listSnapshots: vi.fn(),
    loadSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
    renameSnapshot: vi.fn(),
    saveLayoutJson: vi.fn(),
  };

  const mockPathService = {
    api: mockPhotoshopApi,
    psdPath: vi.fn(() => '/test.psd'),
    runJsx: vi.fn(),
  };

  const mockSettings = {
    marginCm: vi.fn(() => 2),
    gapHCm: vi.fn(() => 2),
    gapVCm: vi.fn(() => 3),
    gridAlign: vi.fn(() => 'center'),
    nameGapCm: vi.fn(() => 0.5),
    textAlign: vi.fn(() => 'center'),
    nameBreakAfter: vi.fn(() => 1),
  };

  const mockPsdService = {
    sanitizeName: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, '_')),
  };

  const mockJsxService = {
    readFullLayout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        PhotoshopSnapshotService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: PhotoshopSettingsService, useValue: mockSettings },
        { provide: PhotoshopPsdService, useValue: mockPsdService },
        { provide: PhotoshopJsxService, useValue: mockJsxService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopSnapshotService);
  });

  it('letrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('saveSnapshot()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveSnapshot('Test', { widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('layout kiolvasás hiba esetén error', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({ success: false, error: 'read fail' });
      const result = await service.saveSnapshot('Test', { widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
    });

    it('sikeres snapshot mentés', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: {
          document: { name: 'test.psd', widthPx: 2000, heightPx: 3000, dpi: 200 },
          layers: [{ layerId: 1, layerName: 'l1' }],
          board: { widthCm: 80 },
          nameSettings: { nameGapCm: 0.5 },
        },
      });
      mockPhotoshopApi.saveSnapshot.mockResolvedValue({ success: true });

      const result = await service.saveSnapshot('Teszt Snapshot', { widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(true);
      expect(mockPhotoshopApi.saveSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          psdPath: '/test.psd',
          snapshotData: expect.objectContaining({ version: 3, snapshotName: 'Teszt Snapshot' }),
        }),
      );
    });

    it('fájlnév dátum + slug formátumú', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: { document: {}, layers: [], board: {}, nameSettings: {} },
      });
      mockPhotoshopApi.saveSnapshot.mockResolvedValue({ success: true });
      mockPsdService.sanitizeName.mockReturnValue('teszt');

      await service.saveSnapshot('Teszt', { widthCm: 80, heightCm: 120 }, '/test.psd');
      const call = mockPhotoshopApi.saveSnapshot.mock.calls[0][0];
      expect(call.fileName).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_teszt\.json$/);
    });

    it('exception esetén error response', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: { document: {}, layers: [], board: {}, nameSettings: {} },
      });
      mockPhotoshopApi.saveSnapshot.mockRejectedValue(new Error('boom'));
      const result = await service.saveSnapshot('Test', { widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
    });
  });

  describe('listSnapshots()', () => {
    it('nincs api esetén üres listát ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.listSnapshots('/test.psd');
      expect(result).toEqual([]);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres lista lekérés', async () => {
      const snapshots = [
        { fileName: 's1.json', filePath: '/s1', snapshotName: 'S1', createdAt: null, personCount: 5, layerCount: 10, version: 3 },
      ];
      mockPhotoshopApi.listSnapshots.mockResolvedValue({ success: true, snapshots });
      const result = await service.listSnapshots('/test.psd');
      expect(result).toHaveLength(1);
      expect(result[0].snapshotName).toBe('S1');
    });

    it('hiba esetén üres listát ad', async () => {
      mockPhotoshopApi.listSnapshots.mockRejectedValue(new Error('fail'));
      const result = await service.listSnapshots('/test.psd');
      expect(result).toEqual([]);
    });
  });

  describe('restoreSnapshot()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.restoreSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('snapshot betöltés hiba esetén error', async () => {
      mockPhotoshopApi.loadSnapshot.mockResolvedValue({ success: false, error: 'load fail' });
      const result = await service.restoreSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
    });

    it('sikeres visszaállítás', async () => {
      mockPhotoshopApi.loadSnapshot.mockResolvedValue({
        success: true, data: { version: 3, layers: [] },
      });
      mockPathService.runJsx.mockResolvedValue({ success: true });

      const result = await service.restoreSnapshot('/snapshot.json', 'doc.psd');
      expect(result.success).toBe(true);
      expect(mockPathService.runJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/restore-layout.jsx', targetDocName: 'doc.psd' }),
      );
    });

    it('restoreGroups paramétert hozzáadja', async () => {
      mockPhotoshopApi.loadSnapshot.mockResolvedValue({
        success: true, data: { version: 3, layers: [] },
      });
      mockPathService.runJsx.mockResolvedValue({ success: true });

      await service.restoreSnapshot('/snapshot.json', undefined, [['Images'], ['Names']]);
      const call = mockPathService.runJsx.mock.calls[0][0];
      expect(call.jsonData.restoreGroups).toEqual([['Images'], ['Names']]);
    });

    it('JSX hiba esetén error', async () => {
      mockPhotoshopApi.loadSnapshot.mockResolvedValue({
        success: true, data: { version: 3 },
      });
      mockPathService.runJsx.mockResolvedValue({ success: false, error: 'jsx fail' });
      const result = await service.restoreSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
    });
  });

  describe('deleteSnapshot()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.deleteSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres törlés', async () => {
      mockPhotoshopApi.deleteSnapshot.mockResolvedValue({ success: true });
      const result = await service.deleteSnapshot('/snapshot.json');
      expect(result.success).toBe(true);
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.deleteSnapshot.mockRejectedValue(new Error('fail'));
      const result = await service.deleteSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
    });
  });

  describe('loadSnapshot()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.loadSnapshot('/snapshot.json');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres betöltés', async () => {
      mockPhotoshopApi.loadSnapshot.mockResolvedValue({
        success: true, data: { version: 3, layers: [] },
      });
      const result = await service.loadSnapshot('/snapshot.json');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('saveSnapshotData()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveSnapshotData('/test.psd', {}, 'test.json');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres közvetlen mentés', async () => {
      mockPhotoshopApi.saveSnapshot.mockResolvedValue({ success: true });
      const result = await service.saveSnapshotData('/test.psd', { data: 1 }, 'test.json');
      expect(result.success).toBe(true);
    });
  });

  describe('saveSnapshotDataAsNew()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveSnapshotDataAsNew('/test.psd', {}, 'Original');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('új fájlnévvel ment -szerkesztett suffixszel', async () => {
      mockPhotoshopApi.saveSnapshot.mockResolvedValue({ success: true });
      mockPsdService.sanitizeName.mockReturnValue('original');
      await service.saveSnapshotDataAsNew('/test.psd', {}, 'Original');
      const call = mockPhotoshopApi.saveSnapshot.mock.calls[0][0];
      expect(call.fileName).toContain('-szerkesztett.json');
      expect(call.snapshotData.snapshotName).toContain('(szerkesztett)');
    });
  });

  describe('saveSnapshotWithFileName()', () => {
    it('sikeres mentés megadott fájlnévvel', async () => {
      mockPhotoshopApi.saveSnapshot.mockResolvedValue({ success: true });
      const result = await service.saveSnapshotWithFileName('/test.psd', {}, 'custom.json');
      expect(result.success).toBe(true);
      expect(mockPhotoshopApi.saveSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'custom.json' }),
      );
    });
  });

  describe('renameSnapshot()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.renameSnapshot('/s.json', 'Új név');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres átnevezés', async () => {
      mockPhotoshopApi.renameSnapshot.mockResolvedValue({ success: true });
      const result = await service.renameSnapshot('/s.json', 'Új név');
      expect(result.success).toBe(true);
    });
  });

  describe('readAndSaveLayout()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.readAndSaveLayout({ widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('JSX hiba esetén error', async () => {
      mockPathService.runJsx.mockResolvedValue({ success: false, error: 'jsx fail' });
      const result = await service.readAndSaveLayout({ widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
    });

    it('sikeres layout mentés', async () => {
      const layoutData = {
        document: { name: 'test', widthPx: 2000, heightPx: 3000, dpi: 200 },
        layers: [],
      };
      mockPathService.runJsx.mockResolvedValue({
        success: true, output: `__LAYOUT_JSON__${JSON.stringify(layoutData)}`,
      });
      mockPhotoshopApi.saveLayoutJson.mockResolvedValue({ success: true });

      const result = await service.readAndSaveLayout({ widthCm: 80, heightCm: 120 }, '/test.psd', undefined, 42);
      expect(result.success).toBe(true);
      expect(mockPhotoshopApi.saveLayoutJson).toHaveBeenCalledWith(
        expect.objectContaining({
          psdPath: '/test.psd',
          layoutData: expect.objectContaining({ version: 3, projectId: 42 }),
        }),
      );
    });

    it('hiányzó JSON prefix esetén error', async () => {
      mockPathService.runJsx.mockResolvedValue({ success: true, output: 'no-prefix' });
      const result = await service.readAndSaveLayout({ widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
    });

    it('érvénytelen JSON esetén parse error', async () => {
      mockPathService.runJsx.mockResolvedValue({
        success: true, output: '__LAYOUT_JSON__not-valid-json',
      });
      const result = await service.readAndSaveLayout({ widthCm: 80, heightCm: 120 }, '/test.psd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });
  });
});
