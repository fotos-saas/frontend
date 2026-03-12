import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';

/**
 * PhotoshopJsxService tesztek — 2. rész
 * Tartalmazza: arrangeTabloLayout, updatePositions, placePhotos, linkLayers,
 * unlinkLayers, resizeLayers, addGroupLayers, relocateLayers,
 * closeDocumentWithoutSaving, applyCircleMask, removeMasks,
 * addPlaceholderTexts, readFullLayout
 */
describe('PhotoshopJsxService — 2. rész (advanced)', () => {
  let service: PhotoshopJsxService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockRunJsx = vi.fn();
  const mockPlacePhotos = vi.fn();
  const mockPhotoshopApi = { runJsx: mockRunJsx, placePhotos: mockPlacePhotos };

  const mockPathService = {
    api: mockPhotoshopApi,
    psdPath: vi.fn(() => '/test.psd'),
    runJsx: mockRunJsx,
  };

  const mockSettings = {
    marginCm: vi.fn(() => 2),
    studentSizeCm: vi.fn(() => 6),
    teacherSizeCm: vi.fn(() => 6),
    gapHCm: vi.fn(() => 2),
    gapVCm: vi.fn(() => 3),
    nameGapCm: vi.fn(() => 0.5),
    nameBreakAfter: vi.fn(() => 1),
    textAlign: vi.fn(() => 'center'),
    gridAlign: vi.fn(() => 'center'),
    positionGapCm: vi.fn(() => 0.15),
    positionFontSize: vi.fn(() => 18),
  };

  const mockPsdService = {
    sanitizeName: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, '_')),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        PhotoshopJsxService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: PhotoshopSettingsService, useValue: mockSettings },
        { provide: PhotoshopPsdService, useValue: mockPsdService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopJsxService);
  });

  describe('arrangeTabloLayout()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.arrangeTabloLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres elrendezés freeZone-nal', async () => {
      mockRunJsx
        .mockResolvedValueOnce({ success: true, output: JSON.stringify({ freeZoneTopPx: 100, freeZoneBottomPx: 800 }) }) // grid
        .mockResolvedValueOnce({ success: true }) // names
        .mockResolvedValueOnce({ success: true }); // subtitles
      const result = await service.arrangeTabloLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledTimes(3);
    });

    it('grid hiba esetén korai visszatérés', async () => {
      mockRunJsx.mockResolvedValueOnce({ success: false, error: 'grid fail' });
      const result = await service.arrangeTabloLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('grid fail');
    });

    it('layoutConfig paraméterei átadódnak', async () => {
      mockRunJsx
        .mockResolvedValueOnce({ success: true, output: '{}' })
        .mockResolvedValueOnce({ success: true });
      await service.arrangeTabloLayout(
        { widthCm: 80, heightCm: 120 }, undefined, undefined,
        { studentPattern: 'grid', teacherPattern: 'grid', studentMaxPerRow: 5, teacherMaxPerRow: 3, gapHCm: 1, gapVCm: 2, gridAlign: 'left' },
      );
      const gridCall = mockRunJsx.mock.calls[0][0];
      expect(gridCall.jsonData.studentMaxPerRow).toBe(5);
      expect(gridCall.jsonData.teacherMaxPerRow).toBe(3);
      expect(gridCall.jsonData.gapHCm).toBe(1);
    });

    it('linked layereket kezel', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '{}' });
      await service.arrangeTabloLayout({ widthCm: 80, heightCm: 120 }, 'doc', ['layer1']);
      // unlink + grid + names + link = 4 hívás
      expect(mockRunJsx).toHaveBeenCalledTimes(4);
    });
  });

  describe('updatePositions()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.updatePositions([]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres pozíció frissítés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const persons = [{ id: 1, name: 'Kiss Pista', type: 'student', title: 'elnök' }];
      const result = await service.updatePositions(persons);
      expect(result.success).toBe(true);
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.persons[0].group).toBe('Students');
      expect(call.jsonData.persons[0].position).toBe('elnök');
    });

    it('tanár típust Teachers csoportba sorolja', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.updatePositions([{ id: 1, name: 'Nagy Tanár', type: 'teacher', title: null }]);
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.persons[0].group).toBe('Teachers');
    });
  });

  describe('placePhotos()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.placePhotos([{ layerName: 'l1', photoUrl: '/photo.jpg' }]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.placePhotos([]);
      expect(result).toEqual({ success: true });
    });

    it('sikeres fotó behelyezés api.placePhotos-on keresztül', async () => {
      mockPlacePhotos.mockResolvedValue({ success: true });
      const layers = [{ layerName: 'layer1', photoUrl: '/photo.jpg' }];
      const result = await service.placePhotos(layers, 'doc', true);
      expect(result.success).toBe(true);
      expect(mockPlacePhotos).toHaveBeenCalledWith(
        expect.objectContaining({ layers, targetDocName: 'doc', syncBorder: true }),
      );
    });
  });

  describe('linkLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.linkLayers(['l1']);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.linkLayers([]);
      expect(result).toEqual({ success: true });
    });

    it('sikeres linkelés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.linkLayers(['l1', 'l2']);
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/link-layers.jsx', jsonData: { layerNames: ['l1', 'l2'] } }),
      );
    });
  });

  describe('unlinkLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.unlinkLayers(['l1']);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.unlinkLayers([]);
      expect(result).toEqual({ success: true });
    });

    it('sikeres unlinkelés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.unlinkLayers(['l1']);
      expect(result.success).toBe(true);
    });
  });

  describe('resizeLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.resizeLayers({ layerNames: ['l1'], width: 10, height: null, unit: 'cm' });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.resizeLayers({ layerNames: [], width: 10, height: null, unit: 'cm' });
      expect(result).toEqual({ success: true });
    });

    it('sikeres átméretezés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const params = { layerNames: ['l1'], width: 10, height: 15, unit: 'cm' as const };
      const result = await service.resizeLayers(params);
      expect(result.success).toBe(true);
    });
  });

  describe('addGroupLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addGroupLayers({ groupName: 'g', sourceFiles: [], layers: [] });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres csoport layer hozzáadás', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.addGroupLayers({
        groupName: 'Students',
        sourceFiles: [{ filePath: '/photo.jpg' }],
        layers: [{ layerName: 'l1', group: 'Students', x: 0, y: 0, sourceIndex: 0 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('relocateLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.relocateLayers([]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres áthelyezés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const layers = [{ layerId: 1, layerName: 'l1', groupPath: ['Images'], x: 0, y: 0, width: 100, height: 100, kind: 'normal' }];
      const result = await service.relocateLayers(layers);
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/restore-layout.jsx' }),
      );
    });

    it('linked layereket is elküldi', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.relocateLayers([], 'doc', ['linked1']);
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.linkedLayerNames).toEqual(['linked1']);
    });
  });

  describe('closeDocumentWithoutSaving()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.closeDocumentWithoutSaving();
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres bezárás __CLOSE_NOSAVE__OK tokennel', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '__CLOSE_NOSAVE__OK' });
      const result = await service.closeDocumentWithoutSaving();
      expect(result.success).toBe(true);
    });

    it('JSX hiba esetén error response', async () => {
      mockRunJsx.mockResolvedValue({ success: false, error: 'hiba' });
      const result = await service.closeDocumentWithoutSaving();
      expect(result.success).toBe(false);
    });

    it('hiányzó OK token és JSX HIBA minta', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '[JSX] HIBA: Nincs nyitott dokumentum' });
      const result = await service.closeDocumentWithoutSaving();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Nincs nyitott dokumentum');
    });

    it('exception esetén sikert ad (nincs nyitva)', async () => {
      mockRunJsx.mockRejectedValue(new Error('fail'));
      const result = await service.closeDocumentWithoutSaving();
      expect(result.success).toBe(true);
    });
  });

  describe('applyCircleMask()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.applyCircleMask({ layerNames: ['l1'] });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres layerNames és nem useSelected esetén skip', async () => {
      const result = await service.applyCircleMask({ layerNames: [] });
      expect(result).toEqual({ success: true, masked: 0 });
    });

    it('sikeres maszkolás statisztikával', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '{"masked": 5, "skipped": 1, "errors": 0}',
      });
      const result = await service.applyCircleMask({ layerNames: ['l1', 'l2'] });
      expect(result.success).toBe(true);
      expect(result.masked).toBe(5);
    });

    it('useSelectedLayers-szel is hív', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '{}' });
      await service.applyCircleMask({ useSelectedLayers: true });
      expect(mockRunJsx).toHaveBeenCalled();
    });
  });

  describe('removeMasks()', () => {
    it('üres layerNames és nem useSelected esetén skip', async () => {
      const result = await service.removeMasks({ layerNames: [] });
      expect(result).toEqual({ success: true, removed: 0 });
    });

    it('sikeres eltávolítás', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '{"removed": 3, "skipped": 0, "errors": 0}',
      });
      const result = await service.removeMasks({ layerNames: ['l1'] });
      expect(result.success).toBe(true);
      expect(result.removed).toBe(3);
    });
  });

  describe('addPlaceholderTexts()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addPlaceholderTexts({ layers: [] });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres layers esetén skip', async () => {
      const result = await service.addPlaceholderTexts({ layers: [] });
      expect(result).toEqual({ success: true, created: 0 });
    });

    it('sikeres létrehozás', async () => {
      mockRunJsx.mockResolvedValue({
        success: true, output: '{"created": 2, "errors": 0}',
      });
      const result = await service.addPlaceholderTexts({
        layers: [{ layerName: 'l1', displayText: 'Test', group: 'Students', x: 0, y: 0 }],
      });
      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
    });
  });

  describe('readFullLayout()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres layout olvasás', async () => {
      const layoutData = {
        document: { name: 'test.psd', widthPx: 2000, heightPx: 3000, dpi: 200 },
        layers: [{ layerId: 1, layerName: 'l1', groupPath: [], x: 0, y: 0, width: 100, height: 100, kind: 'normal' }],
      };
      mockRunJsx.mockResolvedValue({
        success: true, output: `__LAYOUT_JSON__${JSON.stringify(layoutData)}`,
      });
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(true);
      expect(result.data?.document.name).toBe('test.psd');
      expect(result.data?.layers).toHaveLength(1);
    });

    it('JSX hiba esetén error', async () => {
      mockRunJsx.mockResolvedValue({ success: false, error: 'hiba' });
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
    });

    it('hiányzó JSON prefix esetén error', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: 'valami mas' });
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('nem adott vissza');
    });

    it('érvénytelen JSON esetén parse error', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '__LAYOUT_JSON__not-json' });
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });

    it('board és nameSettings beállításokat is visszaadja', async () => {
      const layoutData = {
        document: { name: 'test.psd', widthPx: 2000, heightPx: 3000, dpi: 200 },
        layers: [],
      };
      mockRunJsx.mockResolvedValue({
        success: true, output: `__LAYOUT_JSON__${JSON.stringify(layoutData)}`,
      });
      const result = await service.readFullLayout({ widthCm: 80, heightCm: 120 });
      expect(result.data?.board).toEqual(expect.objectContaining({ widthCm: 80, heightCm: 120, marginCm: 2 }));
      expect(result.data?.nameSettings).toEqual(expect.objectContaining({ nameGapCm: 0.5, textAlign: 'center' }));
    });
  });
});
