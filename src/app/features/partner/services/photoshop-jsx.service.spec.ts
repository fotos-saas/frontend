import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';

/**
 * PhotoshopJsxService tesztek — 1. rész
 * Tartalmazza: addGuides, buildSubtitles, addSubtitleLayers, addNameLayers,
 * addImageLayers, addExtraNames, arrangeGrid, arrangeNames, arrangeSubtitles
 */
describe('PhotoshopJsxService — 1. rész (add/arrange)', () => {
  let service: PhotoshopJsxService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockRunJsx = vi.fn();
  const mockPlacePhotos = vi.fn();
  const mockPhotoshopApi = { runJsx: mockRunJsx, placePhotos: mockPlacePhotos };

  const mockPathService = {
    api: mockPhotoshopApi,
    psdPath: vi.fn(() => null),
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

  describe('addGuides()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addGuides();
      expect(result).toEqual({ success: false, error: 'Nem Electron környezet' });
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('marginCm <= 0 esetén sikeres (skip)', async () => {
      mockSettings.marginCm.mockReturnValue(0);
      const result = await service.addGuides();
      expect(result).toEqual({ success: true });
    });

    it('sikeres JSX futtatás', async () => {
      mockSettings.marginCm.mockReturnValue(2);
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.addGuides('test.psd');
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/add-guides.jsx', jsonData: { marginCm: 2 }, targetDocName: 'test.psd' }),
      );
    });

    it('hiba esetén error response', async () => {
      mockSettings.marginCm.mockReturnValue(2);
      mockRunJsx.mockRejectedValue(new Error('boom'));
      const result = await service.addGuides();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Váratlan hiba');
    });
  });

  describe('buildSubtitles()', () => {
    it('teljes kontextussal 4 feliratot generál', () => {
      const result = service.buildSubtitles({
        schoolName: 'Iskola', className: '12.A', classYear: '2026', quote: 'Idézet',
      });
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ name: 'iskola-neve', text: 'Iskola', fontSize: 80 });
      expect(result[1]).toEqual({ name: 'osztaly', text: '12.A', fontSize: 70 });
      expect(result[2]).toEqual({ name: 'evfolyam', text: '2026', fontSize: 70 });
      expect(result[3]).toEqual({ name: 'idezet', text: 'Idézet', fontSize: 50 });
    });

    it('classYear nélkül az aktuális évet használja', () => {
      const result = service.buildSubtitles({ schoolName: 'Iskola' });
      const yearEntry = result.find(s => s.name === 'evfolyam');
      expect(yearEntry?.text).toBe(new Date().getFullYear().toString());
    });

    it('null/undefined mezőket kihagyja', () => {
      const result = service.buildSubtitles({});
      expect(result).toHaveLength(1); // csak évfolyam
      expect(result[0].name).toBe('evfolyam');
    });
  });

  describe('addSubtitleLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addSubtitleLayers([{ name: 'test', text: 'Test' }]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.addSubtitleLayers([]);
      expect(result).toEqual({ success: true });
    });

    it('null lista esetén sikeres (skip)', async () => {
      const result = await service.addSubtitleLayers(null as any);
      expect(result).toEqual({ success: true });
    });

    it('sikeres JSX futtatás', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.addSubtitleLayers([{ name: 'iskola', text: 'Test', fontSize: 80 }]);
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptName: 'actions/add-subtitle-layers.jsx',
          jsonData: { subtitles: [{ layerName: 'iskola', displayText: 'Test', fontSize: 80 }] },
        }),
      );
    });

    it('fontSize nélkül 50-et használ', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.addSubtitleLayers([{ name: 'test', text: 'Test' }]);
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.subtitles[0].fontSize).toBe(50);
    });
  });

  describe('addNameLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addNameLayers([{ id: 1, name: 'Test', type: 'student' }]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.addNameLayers([]);
      expect(result).toEqual({ success: true });
    });

    it('sikeres JSX futtatás person adatokkal', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const persons = [{ id: 1, name: 'Kiss', type: 'student' }];
      const result = await service.addNameLayers(persons, 'doc.psd');
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/add-name-layers.jsx', personsData: persons, targetDocName: 'doc.psd' }),
      );
    });
  });

  describe('addImageLayers()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addImageLayers([{ id: 1, name: 'Test', type: 'student' }]);
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('üres lista esetén sikeres (skip)', async () => {
      const result = await service.addImageLayers([]);
      expect(result).toEqual({ success: true });
    });

    it('sikeres JSX futtatás méret adatokkal', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const persons = [{ id: 1, name: 'Kiss', type: 'student', photoUrl: '/photo.jpg' }];
      await service.addImageLayers(persons, { widthCm: 10, heightCm: 15, dpi: 300 });
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptName: 'actions/add-image-layers.jsx',
          imageData: expect.objectContaining({ persons, widthCm: 10, heightCm: 15, dpi: 300, studentSizeCm: 6, teacherSizeCm: 6 }),
        }),
      );
    });
  });

  describe('addExtraNames()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.addExtraNames(
        { students: 'A\nB', teachers: 'T' },
        { includeStudents: true, includeTeachers: true },
      );
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('diákok és tanárok adatokat küld', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.addExtraNames(
        { students: 'Anna\nBéla', teachers: 'Tanár1' },
        { includeStudents: true, includeTeachers: true },
      );
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.students.header).toBe('Osztálytársaink voltak még:');
      expect(call.jsonData.teachers.header).toBe('Tanítottak még:');
    });

    it('csak diákok opcióval tanárokat nem küldi', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.addExtraNames(
        { students: 'Anna', teachers: 'Tanár' },
        { includeStudents: true, includeTeachers: false },
      );
      const call = mockRunJsx.mock.calls[0][0];
      expect(call.jsonData.students).toBeDefined();
      expect(call.jsonData.teachers).toBeUndefined();
    });
  });

  describe('arrangeGrid()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.arrangeGrid({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres rendezés a beállításokkal', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.arrangeGrid({ widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptName: 'actions/arrange-grid.jsx',
          jsonData: expect.objectContaining({ boardWidthCm: 80, boardHeightCm: 120 }),
        }),
      );
    });

    it('linked layereket unlink-eli majd visszalinkel', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      await service.arrangeGrid({ widthCm: 80, heightCm: 120 }, 'doc', ['layer1', 'layer2']);
      // unlink hívás + grid hívás + 2 link hívás
      expect(mockRunJsx).toHaveBeenCalledTimes(4);
    });
  });

  describe('arrangeNames()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.arrangeNames();
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres név rendezés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.arrangeNames('doc');
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({ scriptName: 'actions/arrange-names.jsx' }),
      );
    });
  });

  describe('arrangeSubtitles()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.arrangeSubtitles({ topPx: 100, bottomPx: 800 });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres felirat rendezés', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const result = await service.arrangeSubtitles({ topPx: 100, bottomPx: 800 }, 40);
      expect(result.success).toBe(true);
      expect(mockRunJsx).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptName: 'actions/arrange-subtitles.jsx',
          jsonData: { freeZoneTopPx: 100, freeZoneBottomPx: 800, subtitleGapPx: 40 },
        }),
      );
    });
  });
});
