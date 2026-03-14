import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger.service';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';

describe('PhotoshopSettingsService', () => {
  let service: PhotoshopSettingsService;
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

  const mockPhotoshopApi = {
    setMargin: vi.fn(),
    getMargin: vi.fn(),
    setStudentSize: vi.fn(),
    getStudentSize: vi.fn(),
    setTeacherSize: vi.fn(),
    getTeacherSize: vi.fn(),
    setGapH: vi.fn(),
    getGapH: vi.fn(),
    setGapV: vi.fn(),
    getGapV: vi.fn(),
    setNameGap: vi.fn(),
    getNameGap: vi.fn(),
    setNameBreakAfter: vi.fn(),
    getNameBreakAfter: vi.fn(),
    setTextAlign: vi.fn(),
    getTextAlign: vi.fn(),
    setGridAlign: vi.fn(),
    getGridAlign: vi.fn(),
    setPositionGap: vi.fn(),
    getPositionGap: vi.fn(),
    setPositionFontSize: vi.fn(),
    getPositionFontSize: vi.fn(),
  };

  const mockSampleApi = {
    getSettings: vi.fn(),
    setSettings: vi.fn(),
  };

  const mockPathService = {
    api: mockPhotoshopApi,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).electronAPI = {
      photoshop: mockPhotoshopApi,
      sample: mockSampleApi,
    };

    TestBed.configureTestingModule({
      providers: [
        PhotoshopSettingsService,
        { provide: PhotoshopPathService, useValue: mockPathService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(PhotoshopSettingsService);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('létrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('signal-ok alapértékei', () => {
    it('marginCm = 2', () => expect(service.marginCm()).toBe(2));
    it('studentSizeCm = 6', () => expect(service.studentSizeCm()).toBe(6));
    it('teacherSizeCm = 6', () => expect(service.teacherSizeCm()).toBe(6));
    it('gapHCm = 2', () => expect(service.gapHCm()).toBe(2));
    it('gapVCm = 3', () => expect(service.gapVCm()).toBe(3));
    it('nameGapCm = 0.5', () => expect(service.nameGapCm()).toBe(0.5));
    it('nameBreakAfter = 1', () => expect(service.nameBreakAfter()).toBe(1));
    it('textAlign = center', () => expect(service.textAlign()).toBe('center'));
    it('gridAlign = center', () => expect(service.gridAlign()).toBe('center'));
    it('positionGapCm = 0.15', () => expect(service.positionGapCm()).toBe(0.15));
    it('positionFontSize = 18', () => expect(service.positionFontSize()).toBe(18));
    it('sampleSizeLarge = 4000', () => expect(service.sampleSizeLarge()).toBe(4000));
    it('sampleSizeSmall = 2000', () => expect(service.sampleSizeSmall()).toBe(2000));
    it('sampleWatermarkText = MINTA', () => expect(service.sampleWatermarkText()).toBe('MINTA'));
    it('sampleWatermarkColor = white', () => expect(service.sampleWatermarkColor()).toBe('white'));
    it('sampleWatermarkOpacity = 0.15', () => expect(service.sampleWatermarkOpacity()).toBe(0.15));
    it('sampleUseLargeSize = false', () => expect(service.sampleUseLargeSize()).toBe(false));
  });

  describe('setMargin()', () => {
    it('sikeres beállítás frissíti a signal-t', async () => {
      mockPhotoshopApi.setMargin.mockResolvedValue({ success: true });
      const result = await service.setMargin(3);
      expect(result).toBe(true);
      expect(service.marginCm()).toBe(3);
    });

    it('sikertelen beállítás nem frissíti', async () => {
      mockPhotoshopApi.setMargin.mockResolvedValue({ success: false, error: 'hiba' });
      const result = await service.setMargin(3);
      expect(result).toBe(false);
      expect(service.marginCm()).toBe(2);
    });

    it('nincs api esetén false-t ad', async () => {
      (mockPathService as any).api = null;
      const result = await service.setMargin(3);
      expect(result).toBe(false);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('hiba esetén false-t ad és logol', async () => {
      mockPhotoshopApi.setMargin.mockRejectedValue(new Error('boom'));
      const result = await service.setMargin(3);
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('setter metódusok', () => {
    it('setStudentSize sikeres', async () => {
      mockPhotoshopApi.setStudentSize.mockResolvedValue({ success: true });
      expect(await service.setStudentSize(8)).toBe(true);
      expect(service.studentSizeCm()).toBe(8);
    });

    it('setTeacherSize sikeres', async () => {
      mockPhotoshopApi.setTeacherSize.mockResolvedValue({ success: true });
      expect(await service.setTeacherSize(9)).toBe(true);
      expect(service.teacherSizeCm()).toBe(9);
    });

    it('setGapH sikeres', async () => {
      mockPhotoshopApi.setGapH.mockResolvedValue({ success: true });
      expect(await service.setGapH(4)).toBe(true);
      expect(service.gapHCm()).toBe(4);
    });

    it('setGapV sikeres', async () => {
      mockPhotoshopApi.setGapV.mockResolvedValue({ success: true });
      expect(await service.setGapV(5)).toBe(true);
      expect(service.gapVCm()).toBe(5);
    });

    it('setNameGap sikeres', async () => {
      mockPhotoshopApi.setNameGap.mockResolvedValue({ success: true });
      expect(await service.setNameGap(1)).toBe(true);
      expect(service.nameGapCm()).toBe(1);
    });

    it('setNameBreakAfter sikeres', async () => {
      mockPhotoshopApi.setNameBreakAfter.mockResolvedValue({ success: true });
      expect(await service.setNameBreakAfter(2)).toBe(true);
      expect(service.nameBreakAfter()).toBe(2);
    });

    it('setTextAlign sikeres', async () => {
      mockPhotoshopApi.setTextAlign.mockResolvedValue({ success: true });
      expect(await service.setTextAlign('left')).toBe(true);
      expect(service.textAlign()).toBe('left');
    });

    it('setGridAlign sikeres', async () => {
      mockPhotoshopApi.setGridAlign.mockResolvedValue({ success: true });
      expect(await service.setGridAlign('right')).toBe(true);
      expect(service.gridAlign()).toBe('right');
    });

    it('setPositionGap sikeres', async () => {
      mockPhotoshopApi.setPositionGap.mockResolvedValue({ success: true });
      expect(await service.setPositionGap(0.3)).toBe(true);
      expect(service.positionGapCm()).toBe(0.3);
    });

    it('setPositionFontSize sikeres', async () => {
      mockPhotoshopApi.setPositionFontSize.mockResolvedValue({ success: true });
      expect(await service.setPositionFontSize(24)).toBe(true);
      expect(service.positionFontSize()).toBe(24);
    });
  });

  describe('loadSavedSettings()', () => {
    it('nincs api esetén nem csinál semmit', async () => {
      (mockPathService as any).api = null;
      await service.loadSavedSettings();
      expect(service.marginCm()).toBe(2);
      (mockPathService as any).api = mockPhotoshopApi;
    });

    it('betölti az összes mentett beállítást', async () => {
      mockPhotoshopApi.getMargin.mockResolvedValue(5);
      mockPhotoshopApi.getStudentSize.mockResolvedValue(10);
      mockPhotoshopApi.getTeacherSize.mockResolvedValue(12);
      mockPhotoshopApi.getGapH.mockResolvedValue(3);
      mockPhotoshopApi.getGapV.mockResolvedValue(4);
      mockPhotoshopApi.getNameGap.mockResolvedValue(1);
      mockPhotoshopApi.getNameBreakAfter.mockResolvedValue(2);
      mockPhotoshopApi.getTextAlign.mockResolvedValue('left');
      mockPhotoshopApi.getGridAlign.mockResolvedValue('right');
      mockPhotoshopApi.getPositionGap.mockResolvedValue(0.5);
      mockPhotoshopApi.getPositionFontSize.mockResolvedValue(22);

      await service.loadSavedSettings();

      expect(service.marginCm()).toBe(5);
      expect(service.studentSizeCm()).toBe(10);
      expect(service.teacherSizeCm()).toBe(12);
      expect(service.gapHCm()).toBe(3);
      expect(service.gapVCm()).toBe(4);
      expect(service.nameGapCm()).toBe(1);
      expect(service.nameBreakAfter()).toBe(2);
      expect(service.textAlign()).toBe('left');
      expect(service.gridAlign()).toBe('right');
      expect(service.positionGapCm()).toBe(0.5);
      expect(service.positionFontSize()).toBe(22);
    });

    it('undefined értékek nem felülírják az alapértékeket', async () => {
      mockPhotoshopApi.getMargin.mockResolvedValue(undefined);
      mockPhotoshopApi.getStudentSize.mockResolvedValue(undefined);
      mockPhotoshopApi.getTeacherSize.mockResolvedValue(undefined);
      mockPhotoshopApi.getGapH.mockResolvedValue(undefined);
      mockPhotoshopApi.getGapV.mockResolvedValue(undefined);
      mockPhotoshopApi.getNameGap.mockResolvedValue(undefined);
      mockPhotoshopApi.getNameBreakAfter.mockResolvedValue(undefined);
      mockPhotoshopApi.getTextAlign.mockResolvedValue(undefined);
      mockPhotoshopApi.getGridAlign.mockResolvedValue(undefined);
      mockPhotoshopApi.getPositionGap.mockResolvedValue(undefined);
      mockPhotoshopApi.getPositionFontSize.mockResolvedValue(undefined);

      await service.loadSavedSettings();
      expect(service.marginCm()).toBe(2);
      expect(service.textAlign()).toBe('center');
    });
  });

  describe('loadSampleSettings()', () => {
    it('nincs sampleApi esetén nem csinál semmit', async () => {
      delete (window as any).electronAPI;
      await service.loadSampleSettings();
      expect(service.sampleSizeLarge()).toBe(4000);
    });

    it('betölti a minta beállításokat', async () => {
      mockSampleApi.getSettings.mockResolvedValue({
        success: true,
        settings: {
          sizeLarge: 5000, sizeSmall: 3000, watermarkText: 'TEST',
          watermarkColor: 'black', watermarkOpacity: 0.3, useLargeSize: true,
        },
      });

      await service.loadSampleSettings();

      expect(service.sampleSizeLarge()).toBe(5000);
      expect(service.sampleSizeSmall()).toBe(3000);
      expect(service.sampleWatermarkText()).toBe('TEST');
      expect(service.sampleWatermarkColor()).toBe('black');
      expect(service.sampleWatermarkOpacity()).toBe(0.3);
      expect(service.sampleUseLargeSize()).toBe(true);
    });

    it('sikertelen getSettings nem módosít', async () => {
      mockSampleApi.getSettings.mockResolvedValue({ success: false });
      await service.loadSampleSettings();
      expect(service.sampleSizeLarge()).toBe(4000);
    });
  });

  describe('setSampleSettings()', () => {
    it('nincs sampleApi esetén false-t ad', async () => {
      delete (window as any).electronAPI;
      const result = await service.setSampleSettings({ sizeLarge: 5000 });
      expect(result).toBe(false);
    });

    it('sikeres beállítás frissíti a signal-okat', async () => {
      mockSampleApi.setSettings.mockResolvedValue({ success: true });

      const result = await service.setSampleSettings({
        sizeLarge: 5000, watermarkText: 'PROBA', watermarkColor: 'black',
      });

      expect(result).toBe(true);
      expect(service.sampleSizeLarge()).toBe(5000);
      expect(service.sampleWatermarkText()).toBe('PROBA');
      expect(service.sampleWatermarkColor()).toBe('black');
    });

    it('részleges beállítás csak az érintettet frissíti', async () => {
      mockSampleApi.setSettings.mockResolvedValue({ success: true });
      await service.setSampleSettings({ sizeSmall: 1500 });
      expect(service.sampleSizeSmall()).toBe(1500);
      expect(service.sampleSizeLarge()).toBe(4000); // default marad
    });

    it('sikertelen beállítás false-t ad', async () => {
      mockSampleApi.setSettings.mockResolvedValue({ success: false });
      const result = await service.setSampleSettings({ sizeLarge: 5000 });
      expect(result).toBe(false);
    });

    it('hiba esetén false-t ad és logol', async () => {
      mockSampleApi.setSettings.mockRejectedValue(new Error('boom'));
      const result = await service.setSampleSettings({ sizeLarge: 5000 });
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
