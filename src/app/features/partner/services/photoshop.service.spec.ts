import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PhotoshopPathService } from './photoshop-path.service';
import { PhotoshopSettingsService } from './photoshop-settings.service';
import { PhotoshopPsdService } from './photoshop-psd.service';
import { PhotoshopJsxService } from './photoshop-jsx.service';
import { PhotoshopSnapshotService } from './photoshop-snapshot.service';
import { PhotoshopTemplateService } from './photoshop-template.service';
import { PhotoshopSampleService } from './photoshop-sample.service';
import { PhotoshopService } from './photoshop.service';
import { signal } from '@angular/core';

/**
 * PhotoshopService — Facade teszt
 * Ellenőrzi hogy a facade helyes delegálást végez a sub-service-ekhez.
 */
describe('PhotoshopService — facade', () => {
  let service: PhotoshopService;

  const mockPathSvc = {
    path: signal<string | null>(null),
    workDir: signal<string | null>(null),
    isConfigured: signal(false),
    checking: signal(false),
    psdPath: signal<string | null>(null),
    detectPath: vi.fn(),
    setPath: vi.fn(),
    launchPhotoshop: vi.fn(),
    setWorkDir: vi.fn(),
    browseForWorkDir: vi.fn(),
    browseForPhotoshop: vi.fn(),
    openPsdFile: vi.fn(),
    revealInFinder: vi.fn(),
    checkPsdExists: vi.fn(),
    backupPsd: vi.fn(),
  };

  const mockSettingsSvc = {
    marginCm: signal(2),
    studentSizeCm: signal(6),
    teacherSizeCm: signal(6),
    gapHCm: signal(2),
    gapVCm: signal(3),
    nameGapCm: signal(0.5),
    nameBreakAfter: signal(1),
    textAlign: signal('center'),
    gridAlign: signal('center'),
    positionGapCm: signal(0.15),
    positionFontSize: signal(18),
    sampleSizeLarge: signal(4000),
    sampleSizeSmall: signal(2000),
    sampleWatermarkText: signal('MINTA'),
    sampleWatermarkColor: signal('white'),
    sampleWatermarkOpacity: signal(0.15),
    sampleUseLargeSize: signal(false),
    setMargin: vi.fn(),
    setStudentSize: vi.fn(),
    setTeacherSize: vi.fn(),
    setGapH: vi.fn(),
    setGapV: vi.fn(),
    setNameGap: vi.fn(),
    setNameBreakAfter: vi.fn(),
    setTextAlign: vi.fn(),
    setGridAlign: vi.fn(),
    setPositionGap: vi.fn(),
    setPositionFontSize: vi.fn(),
    setSampleSettings: vi.fn(),
  };

  const mockPsdSvc = {
    parseSizeValue: vi.fn(),
    sanitizeName: vi.fn(),
    sanitizePathName: vi.fn(),
    buildProjectFolderName: vi.fn(),
    computePsdPath: vi.fn(),
    computeProjectFolderPath: vi.fn(),
    findProjectPsd: vi.fn(),
    generateAndOpenPsd: vi.fn(),
    saveTempFiles: vi.fn(),
    saveAndCloseDocument: vi.fn(),
  };

  const mockJsxSvc = {
    addGuides: vi.fn(),
    buildSubtitles: vi.fn(),
    addSubtitleLayers: vi.fn(),
    addNameLayers: vi.fn(),
    addImageLayers: vi.fn(),
    addExtraNames: vi.fn(),
    arrangeGrid: vi.fn(),
    arrangeNames: vi.fn(),
    arrangeSubtitles: vi.fn(),
    arrangeTabloLayout: vi.fn(),
    updatePositions: vi.fn(),
    relocateLayers: vi.fn(),
    readFullLayout: vi.fn(),
    placePhotos: vi.fn(),
    linkLayers: vi.fn(),
    unlinkLayers: vi.fn(),
    resizeLayers: vi.fn(),
    applyCircleMask: vi.fn(),
    removeMasks: vi.fn(),
    addPlaceholderTexts: vi.fn(),
    addGroupLayers: vi.fn(),
    closeDocumentWithoutSaving: vi.fn(),
  };

  const mockSnapshotSvc = {
    readAndSaveLayout: vi.fn(),
    saveSnapshot: vi.fn(),
    listSnapshots: vi.fn(),
    restoreSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
    loadSnapshot: vi.fn(),
    saveSnapshotData: vi.fn(),
    saveSnapshotDataAsNew: vi.fn(),
    saveSnapshotWithFileName: vi.fn(),
    renameSnapshot: vi.fn(),
  };

  const mockTemplateSvc = {
    saveTemplate: vi.fn(),
    listTemplates: vi.fn(),
    loadTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    renameTemplate: vi.fn(),
    applyTemplate: vi.fn(),
  };

  const mockSampleSvc = {
    generateSample: vi.fn(),
    generateFinal: vi.fn(),
    generateSmallTablo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        PhotoshopService,
        { provide: PhotoshopPathService, useValue: mockPathSvc },
        { provide: PhotoshopSettingsService, useValue: mockSettingsSvc },
        { provide: PhotoshopPsdService, useValue: mockPsdSvc },
        { provide: PhotoshopJsxService, useValue: mockJsxSvc },
        { provide: PhotoshopSnapshotService, useValue: mockSnapshotSvc },
        { provide: PhotoshopTemplateService, useValue: mockTemplateSvc },
        { provide: PhotoshopSampleService, useValue: mockSampleSvc },
      ],
    });
    service = TestBed.inject(PhotoshopService);
  });

  it('létrejön', () => {
    expect(service).toBeTruthy();
  });

  describe('signal delegálás', () => {
    it('path signal a pathSvc-ből jön', () => {
      expect(service.path).toBe(mockPathSvc.path);
    });

    it('workDir signal a pathSvc-ből jön', () => {
      expect(service.workDir).toBe(mockPathSvc.workDir);
    });

    it('marginCm signal a settingsSvc-ből jön', () => {
      expect(service.marginCm).toBe(mockSettingsSvc.marginCm);
    });

    it('sampleUseLargeSize signal a settingsSvc-ből jön', () => {
      expect(service.sampleUseLargeSize).toBe(mockSettingsSvc.sampleUseLargeSize);
    });
  });

  describe('PATH delegálás', () => {
    it('detectPhotoshop → pathSvc.detectPath', () => {
      service.detectPhotoshop();
      expect(mockPathSvc.detectPath).toHaveBeenCalled();
    });

    it('setPath → pathSvc.setPath', () => {
      service.setPath('/ps');
      expect(mockPathSvc.setPath).toHaveBeenCalledWith('/ps');
    });

    it('launchPhotoshop → pathSvc.launchPhotoshop', () => {
      service.launchPhotoshop();
      expect(mockPathSvc.launchPhotoshop).toHaveBeenCalled();
    });

    it('setWorkDir → pathSvc.setWorkDir', () => {
      service.setWorkDir('/work');
      expect(mockPathSvc.setWorkDir).toHaveBeenCalledWith('/work');
    });

    it('openPsdFile → pathSvc.openPsdFile', () => {
      service.openPsdFile('/test.psd');
      expect(mockPathSvc.openPsdFile).toHaveBeenCalledWith('/test.psd');
    });

    it('revealInFinder → pathSvc.revealInFinder', () => {
      service.revealInFinder('/file');
      expect(mockPathSvc.revealInFinder).toHaveBeenCalledWith('/file');
    });

    it('checkPsdExists → pathSvc.checkPsdExists', () => {
      service.checkPsdExists('/test.psd');
      expect(mockPathSvc.checkPsdExists).toHaveBeenCalledWith('/test.psd');
    });

    it('backupPsd → pathSvc.backupPsd', () => {
      service.backupPsd('/test.psd');
      expect(mockPathSvc.backupPsd).toHaveBeenCalledWith('/test.psd');
    });
  });

  describe('SETTINGS delegálás', () => {
    it('setMargin → settingsSvc.setMargin', () => {
      service.setMargin(5);
      expect(mockSettingsSvc.setMargin).toHaveBeenCalledWith(5);
    });

    it('setTextAlign → settingsSvc.setTextAlign', () => {
      service.setTextAlign('left');
      expect(mockSettingsSvc.setTextAlign).toHaveBeenCalledWith('left');
    });

    it('setSampleSettings → settingsSvc.setSampleSettings', () => {
      service.setSampleSettings({ sizeLarge: 5000 });
      expect(mockSettingsSvc.setSampleSettings).toHaveBeenCalledWith({ sizeLarge: 5000 });
    });
  });

  describe('PSD delegálás', () => {
    it('parseSizeValue → psdSvc.parseSizeValue', () => {
      service.parseSizeValue('80x120');
      expect(mockPsdSvc.parseSizeValue).toHaveBeenCalledWith('80x120');
    });

    it('sanitizeName → psdSvc.sanitizeName', () => {
      service.sanitizeName('Test');
      expect(mockPsdSvc.sanitizeName).toHaveBeenCalledWith('Test');
    });

    it('saveAndCloseDocument → psdSvc.saveAndCloseDocument', () => {
      service.saveAndCloseDocument('doc');
      expect(mockPsdSvc.saveAndCloseDocument).toHaveBeenCalledWith('doc');
    });
  });

  describe('JSX delegálás', () => {
    it('addGuides → jsxSvc.addGuides', () => {
      service.addGuides('doc');
      expect(mockJsxSvc.addGuides).toHaveBeenCalledWith('doc');
    });

    it('buildSubtitles → jsxSvc.buildSubtitles', () => {
      service.buildSubtitles({ schoolName: 'Test' });
      expect(mockJsxSvc.buildSubtitles).toHaveBeenCalledWith({ schoolName: 'Test' });
    });

    it('arrangeNames → jsxSvc.arrangeNames', () => {
      service.arrangeNames('doc', ['l1']);
      expect(mockJsxSvc.arrangeNames).toHaveBeenCalledWith('doc', ['l1']);
    });

    it('closeDocumentWithoutSaving → jsxSvc.closeDocumentWithoutSaving', () => {
      service.closeDocumentWithoutSaving('doc');
      expect(mockJsxSvc.closeDocumentWithoutSaving).toHaveBeenCalledWith('doc');
    });
  });

  describe('SNAPSHOT delegálás', () => {
    it('saveSnapshot → snapshotSvc.saveSnapshot', () => {
      service.saveSnapshot('Test', { widthCm: 80, heightCm: 120 }, '/path', 'doc');
      expect(mockSnapshotSvc.saveSnapshot).toHaveBeenCalledWith('Test', { widthCm: 80, heightCm: 120 }, '/path', 'doc');
    });

    it('listSnapshots → snapshotSvc.listSnapshots', () => {
      service.listSnapshots('/path');
      expect(mockSnapshotSvc.listSnapshots).toHaveBeenCalledWith('/path');
    });

    it('deleteSnapshot → snapshotSvc.deleteSnapshot', () => {
      service.deleteSnapshot('/path');
      expect(mockSnapshotSvc.deleteSnapshot).toHaveBeenCalledWith('/path');
    });

    it('renameSnapshot → snapshotSvc.renameSnapshot', () => {
      service.renameSnapshot('/path', 'new');
      expect(mockSnapshotSvc.renameSnapshot).toHaveBeenCalledWith('/path', 'new');
    });
  });

  describe('TEMPLATE delegálás', () => {
    it('saveTemplate → templateSvc.saveTemplate', () => {
      service.saveTemplate('Test', { widthCm: 80, heightCm: 120 });
      expect(mockTemplateSvc.saveTemplate).toHaveBeenCalledWith('Test', { widthCm: 80, heightCm: 120 });
    });

    it('listTemplates → templateSvc.listTemplates', () => {
      service.listTemplates();
      expect(mockTemplateSvc.listTemplates).toHaveBeenCalled();
    });

    it('deleteTemplate → templateSvc.deleteTemplate', () => {
      service.deleteTemplate('t1');
      expect(mockTemplateSvc.deleteTemplate).toHaveBeenCalledWith('t1');
    });

    it('applyTemplate → templateSvc.applyTemplate', () => {
      service.applyTemplate('t1', 'doc');
      expect(mockTemplateSvc.applyTemplate).toHaveBeenCalledWith('t1', 'doc');
    });
  });

  describe('SAMPLE delegálás', () => {
    it('generateSample → sampleSvc.generateSample', () => {
      service.generateSample(1, 'Test', true);
      expect(mockSampleSvc.generateSample).toHaveBeenCalledWith(1, 'Test', true);
    });

    it('generateFinal → sampleSvc.generateFinal', () => {
      service.generateFinal(1, 'Test');
      expect(mockSampleSvc.generateFinal).toHaveBeenCalledWith(1, 'Test');
    });

    it('generateSmallTablo → sampleSvc.generateSmallTablo', () => {
      service.generateSmallTablo(1, 'Test');
      expect(mockSampleSvc.generateSmallTablo).toHaveBeenCalledWith(1, 'Test');
    });
  });
});
