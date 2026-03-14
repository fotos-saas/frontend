import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { SnapshotLayer } from '@core/services/electron.types';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';
import { PhotoshopTemplateService } from './photoshop-template.service';

describe('PhotoshopTemplateService', () => {
  let service: PhotoshopTemplateService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockPhotoshopApi = {
    saveTemplate: vi.fn(),
    listTemplates: vi.fn(),
    loadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    renameTemplate: vi.fn(),
    applyTemplate: vi.fn(),
  };

  const mockPathService = {
    api: mockPhotoshopApi,
    psdPath: vi.fn(() => '/test.psd'),
  };

  const mockJsxService = {
    readFullLayout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        PhotoshopTemplateService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: PhotoshopJsxService, useValue: mockJsxService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopTemplateService);
  });

  it('létrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('saveTemplate()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.saveTemplate('Test', { widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('layout kiolvasás hiba esetén error', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({ success: false, error: 'read fail' });
      const result = await service.saveTemplate('Test', { widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
    });

    it('sikeres sablon mentés slot extraction-nel', async () => {
      const layers: SnapshotLayer[] = [
        { layerId: 1, layerName: 'diak1', groupPath: ['Images', 'Students'], x: 0, y: 0, width: 100, height: 150, kind: 'normal' },
        { layerId: 2, layerName: 'diak1', groupPath: ['Names', 'Students'], x: 0, y: 160, width: 100, height: 20, kind: 'text', justification: 'center' },
        { layerId: 3, layerName: 'tanar1', groupPath: ['Images', 'Teachers'], x: 200, y: 0, width: 100, height: 150, kind: 'normal' },
        { layerId: 4, layerName: 'hatter', groupPath: ['Background'], x: 0, y: 0, width: 2000, height: 3000, kind: 'normal' },
      ];

      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: {
          document: { name: 'test.psd', widthPx: 2000, heightPx: 3000, dpi: 200 },
          layers,
          board: { widthCm: 80, heightCm: 120, marginCm: 2, gapHCm: 2, gapVCm: 3, gridAlign: 'center' },
          nameSettings: { nameGapCm: 0.5, textAlign: 'center', nameBreakAfter: 1 },
        },
      });
      mockPhotoshopApi.saveTemplate.mockResolvedValue({ success: true });

      const result = await service.saveTemplate('Teszt Sablon', { widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(true);

      const call = mockPhotoshopApi.saveTemplate.mock.calls[0][0];
      const template = call.templateData;
      expect(template.version).toBe(1);
      expect(template.type).toBe('template');
      expect(template.templateName).toBe('Teszt Sablon');
      expect(template.studentSlots).toHaveLength(1);
      expect(template.teacherSlots).toHaveLength(1);
      expect(template.fixedLayers).toHaveLength(1); // hatter
      expect(template.studentSlots[0].name).not.toBeNull();
      expect(template.studentSlots[0].name?.justification).toBe('center');
    });

    it('slot extraction - név nélküli slot esetén name null', async () => {
      const layers: SnapshotLayer[] = [
        { layerId: 1, layerName: 'diak1', groupPath: ['Images', 'Students'], x: 0, y: 0, width: 100, height: 150, kind: 'normal' },
        // nincs megfelelő név layer
      ];

      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: { document: { name: 'test', widthPx: 2000, heightPx: 3000, dpi: 200 }, layers, board: {}, nameSettings: {} },
      });
      mockPhotoshopApi.saveTemplate.mockResolvedValue({ success: true });

      const result = await service.saveTemplate('Test', { widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(true);
      const template = mockPhotoshopApi.saveTemplate.mock.calls[0][0].templateData;
      expect(template.studentSlots[0].name).toBeNull();
    });

    it('exception esetén error response', async () => {
      mockJsxService.readFullLayout.mockResolvedValue({
        success: true,
        data: { document: {}, layers: [], board: {}, nameSettings: {} },
      });
      mockPhotoshopApi.saveTemplate.mockRejectedValue(new Error('boom'));
      const result = await service.saveTemplate('Test', { widthCm: 80, heightCm: 120 });
      expect(result.success).toBe(false);
    });
  });

  describe('listTemplates()', () => {
    it('nincs api esetén üres listát ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.listTemplates();
      expect(result).toEqual([]);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres lista lekérés', async () => {
      const templates = [
        { id: 't1', templateName: 'Sablon1', createdAt: '2026-01-01', studentSlotCount: 5, teacherSlotCount: 2, boardWidthCm: 80, boardHeightCm: 120, sourceDocName: 'doc.psd' },
      ];
      mockPhotoshopApi.listTemplates.mockResolvedValue({ success: true, templates });
      const result = await service.listTemplates();
      expect(result).toHaveLength(1);
      expect(result[0].templateName).toBe('Sablon1');
    });

    it('hiba esetén üres listát ad', async () => {
      mockPhotoshopApi.listTemplates.mockRejectedValue(new Error('fail'));
      const result = await service.listTemplates();
      expect(result).toEqual([]);
    });

    it('sikertelen api válasz esetén üres lista', async () => {
      mockPhotoshopApi.listTemplates.mockResolvedValue({ success: false });
      const result = await service.listTemplates();
      expect(result).toEqual([]);
    });
  });

  describe('loadTemplate()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.loadTemplate('t1');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres betöltés', async () => {
      mockPhotoshopApi.loadTemplate.mockResolvedValue({
        success: true, data: { id: 't1', templateName: 'Test' },
      });
      const result = await service.loadTemplate('t1');
      expect(result.success).toBe(true);
      expect(result.data?.templateName).toBe('Test');
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.loadTemplate.mockRejectedValue(new Error('fail'));
      const result = await service.loadTemplate('t1');
      expect(result.success).toBe(false);
    });
  });

  describe('deleteTemplate()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.deleteTemplate('t1');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres törlés', async () => {
      mockPhotoshopApi.deleteTemplate.mockResolvedValue({ success: true });
      const result = await service.deleteTemplate('t1');
      expect(result.success).toBe(true);
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.deleteTemplate.mockRejectedValue(new Error('fail'));
      const result = await service.deleteTemplate('t1');
      expect(result.success).toBe(false);
    });
  });

  describe('renameTemplate()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.renameTemplate('t1', 'Új név');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres átnevezés', async () => {
      mockPhotoshopApi.renameTemplate.mockResolvedValue({ success: true });
      const result = await service.renameTemplate('t1', 'Új név');
      expect(result.success).toBe(true);
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.renameTemplate.mockRejectedValue(new Error('fail'));
      const result = await service.renameTemplate('t1', 'Új név');
      expect(result.success).toBe(false);
    });
  });

  describe('applyTemplate()', () => {
    it('nincs api esetén hibaüzenetet ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.applyTemplate('t1');
      expect(result.success).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('sikeres alkalmazás', async () => {
      mockPhotoshopApi.applyTemplate.mockResolvedValue({ success: true });
      const result = await service.applyTemplate('t1', 'doc.psd');
      expect(result.success).toBe(true);
      expect(mockPhotoshopApi.applyTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: 't1', targetDocName: 'doc.psd', psdFilePath: '/test.psd' }),
      );
    });

    it('hiba esetén error response', async () => {
      mockPhotoshopApi.applyTemplate.mockRejectedValue(new Error('fail'));
      const result = await service.applyTemplate('t1');
      expect(result.success).toBe(false);
    });
  });
});
