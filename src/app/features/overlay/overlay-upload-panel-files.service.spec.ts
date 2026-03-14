import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DestroyRef, signal } from '@angular/core';
import { of } from 'rxjs';
import { OverlayUploadPanelService } from './overlay-upload-panel.service';
import { OverlayUploadService, PsLayerPerson } from './overlay-upload.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySettingsService } from './overlay-settings.service';

/**
 * overlay-upload-panel.service – 2. rész
 * Fájl hozzárendelés, unmatched kezelés, layer műveletek,
 * reset, file preview, retrySmartMatch, updatePsLayersFromDoc, placeInPs, startResize
 */
describe('OverlayUploadPanelService – files & layers', () => {
  let service: OverlayUploadPanelService;
  let httpMock: HttpTestingController;

  let uploadServiceMock: {
    parseLayerNames: ReturnType<typeof vi.fn>;
    enrichWithPersons: ReturnType<typeof vi.fn>;
    matchFilesToLayers: ReturnType<typeof vi.fn>;
    uploadBatch: ReturnType<typeof vi.fn>;
    placePhotosInPs: ReturnType<typeof vi.fn>;
  };

  let projectServiceMock: {
    persons: ReturnType<typeof signal>;
    resolveProjectId: ReturnType<typeof vi.fn>;
    lookupProjectIdFromPerson: ReturnType<typeof vi.fn>;
    loadPersons: ReturnType<typeof vi.fn>;
    getLastProjectId: ReturnType<typeof vi.fn>;
  };

  let psMock: {
    busyCommand: ReturnType<typeof signal>;
  };

  let pollingMock: {
    activeDoc: ReturnType<typeof signal>;
  };

  let settingsMock: {
    syncWithBorder: ReturnType<typeof signal>;
  };

  const mockPersons: PersonItem[] = [
    { id: 1, name: 'Kiss János', title: null, type: 'student', hasPhoto: false, photoThumbUrl: null, photoUrl: null, archiveId: null, linkedGroup: null },
    { id: 2, name: 'Nagy Péter', title: null, type: 'student', hasPhoto: true, photoThumbUrl: 'thumb.jpg', photoUrl: 'photo.jpg', archiveId: null, linkedGroup: null },
  ];

  beforeEach(() => {
    uploadServiceMock = {
      parseLayerNames: vi.fn().mockReturnValue([]),
      enrichWithPersons: vi.fn().mockImplementation((layers: any[]) => layers),
      matchFilesToLayers: vi.fn().mockReturnValue({ matched: [], unmatched: [] }),
      uploadBatch: vi.fn().mockReturnValue(of([])),
      placePhotosInPs: vi.fn().mockResolvedValue({ success: true }),
    };

    projectServiceMock = {
      persons: signal<PersonItem[]>([]),
      resolveProjectId: vi.fn().mockResolvedValue(42),
      lookupProjectIdFromPerson: vi.fn().mockResolvedValue(42),
      loadPersons: vi.fn(),
      getLastProjectId: vi.fn().mockReturnValue(42),
    };

    psMock = {
      busyCommand: signal<string | null>(null),
    };

    pollingMock = {
      activeDoc: signal({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp', selectedLayerNames: [] as string[] }),
    };

    settingsMock = {
      syncWithBorder: signal(true),
    };

    delete (window as any).electronAPI;

    TestBed.configureTestingModule({
      providers: [
        OverlayUploadPanelService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OverlayUploadService, useValue: uploadServiceMock },
        { provide: OverlayProjectService, useValue: projectServiceMock },
        { provide: OverlayPhotoshopService, useValue: psMock },
        { provide: OverlayPollingService, useValue: pollingMock },
        { provide: OverlaySettingsService, useValue: settingsMock },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });

    service = TestBed.inject(OverlayUploadPanelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================================================
  // assignFileToLayer
  // ============================================================================
  describe('assignFileToLayer', () => {
    it('hozzárendeli a fájlt a layerhez és törli az unmatched-ból', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ]);
      service.unmatchedFiles.set([file]);

      service.assignFileToLayer(0, file);

      expect(service.psLayers()[0].file).toBe(file);
      expect(service.psLayers()[0].matchType).toBe('manual');
      expect(service.psLayers()[0].matchConfidence).toBe(100);
      expect(service.unmatchedFiles()).toHaveLength(0);
    });
  });

  // ============================================================================
  // selectUnmatchedFile
  // ============================================================================
  describe('selectUnmatchedFile', () => {
    it('kiválasztja az unmatched fájlt', () => {
      const file = new File([''], 'test.jpg');
      service.selectUnmatchedFile(file);

      expect(service.selectedUnmatchedFile()).toBe(file);
    });

    it('togglelve null-ra állítja ha már kiválasztott', () => {
      const file = new File([''], 'test.jpg');
      service.selectUnmatchedFile(file);
      service.selectUnmatchedFile(file);

      expect(service.selectedUnmatchedFile()).toBeNull();
    });
  });

  // ============================================================================
  // onLayerRowClick
  // ============================================================================
  describe('onLayerRowClick', () => {
    it('nem csinál semmit ha nincs selectedUnmatchedFile', () => {
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ]);

      service.onLayerRowClick(0);

      expect(service.psLayers()[0].file).toBeUndefined();
    });

    it('nem csinál semmit ha a layer már foglalt (fájl van)', () => {
      const existingFile = new File([''], 'existing.jpg');
      const unmatchedFile = new File([''], 'unmatched.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending', file: existingFile },
      ]);
      service.selectedUnmatchedFile.set(unmatchedFile);

      service.onLayerRowClick(0);

      expect(service.psLayers()[0].file).toBe(existingFile);
    });

    it('nem csinál semmit ha a layer uploadStatus "done"', () => {
      const unmatchedFile = new File([''], 'unmatched.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'done' },
      ]);
      service.selectedUnmatchedFile.set(unmatchedFile);

      service.onLayerRowClick(0);

      expect(service.psLayers()[0].file).toBeUndefined();
    });

    it('hozzárendeli a selectedUnmatched fájlt ha a layer szabad', () => {
      const unmatchedFile = new File([''], 'unmatched.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ]);
      service.unmatchedFiles.set([unmatchedFile]);
      service.selectedUnmatchedFile.set(unmatchedFile);

      service.onLayerRowClick(0);

      expect(service.psLayers()[0].file).toBe(unmatchedFile);
      expect(service.psLayers()[0].matchType).toBe('manual');
      expect(service.unmatchedFiles()).toHaveLength(0);
      expect(service.selectedUnmatchedFile()).toBeNull();
    });
  });

  // ============================================================================
  // removeFileFromLayer
  // ============================================================================
  describe('removeFileFromLayer', () => {
    it('eltávolítja a fájlt és az unmatched-be rakja', () => {
      const file = new File([''], 'test.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending', file },
      ]);

      service.removeFileFromLayer(0);

      expect(service.psLayers()[0].file).toBeUndefined();
      expect(service.unmatchedFiles()).toHaveLength(1);
      expect(service.unmatchedFiles()[0]).toBe(file);
    });

    it('nem csinál semmit ha nincs fájl a layernél', () => {
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ]);

      service.removeFileFromLayer(0);

      expect(service.unmatchedFiles()).toHaveLength(0);
    });
  });

  // ============================================================================
  // clearUnmatchedFiles
  // ============================================================================
  describe('clearUnmatchedFiles', () => {
    it('törli az összes unmatched fájlt', () => {
      service.unmatchedFiles.set([new File([''], 'a.jpg'), new File([''], 'b.jpg')]);
      service.selectedUnmatchedFile.set(new File([''], 'a.jpg'));

      service.clearUnmatchedFiles();

      expect(service.unmatchedFiles()).toEqual([]);
      expect(service.selectedUnmatchedFile()).toBeNull();
    });
  });

  // ============================================================================
  // resetUploadState
  // ============================================================================
  describe('resetUploadState', () => {
    it('visszaállítja a batch upload állapotot', () => {
      service.batchUploading.set(true);
      service.placing.set(true);
      service.batchProgress.set({ done: 5, total: 10 });
      service.batchResult.set({ success: true, message: 'ok' });
      service.unmatchedFiles.set([new File([''], 'a.jpg')]);

      const file = new File([''], 'test.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'done', file, photoUrl: 'url' },
      ]);

      service.resetUploadState();

      expect(service.batchUploading()).toBe(false);
      expect(service.placing()).toBe(false);
      expect(service.batchProgress()).toEqual({ done: 0, total: 0 });
      expect(service.batchResult()).toBeNull();
      expect(service.unmatchedFiles()).toEqual([]);
      expect(service.selectedUnmatchedFile()).toBeNull();

      const layers = service.psLayers();
      expect(layers[0].uploadStatus).toBe('pending');
      expect(layers[0].file).toBeUndefined();
      expect(layers[0].photoUrl).toBeUndefined();
    });
  });

  // ============================================================================
  // getFilePreview
  // ============================================================================
  describe('getFilePreview', () => {
    it('URL.createObjectURL-t hív és cache-el', () => {
      const file = new File([''], 'test.jpg');
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');

      const url1 = service.getFilePreview(file);
      const url2 = service.getFilePreview(file);

      expect(url1).toBe('blob:test');
      expect(url2).toBe('blob:test');
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

      createObjectURLSpy.mockRestore();
    });
  });

  // ============================================================================
  // retrySmartMatch
  // ============================================================================
  describe('retrySmartMatch', () => {
    it('nem csinál semmit ha nincs unmatched fájl', () => {
      service.unmatchedFiles.set([]);
      service.retrySmartMatch();

      expect(service.matching()).toBe(false);
    });

    it('beállítja matching-et true-ra majd false-ra', async () => {
      const file = new File([''], 'test.jpg');
      service.unmatchedFiles.set([file]);
      uploadServiceMock.matchFilesToLayers.mockReturnValue({ matched: [], unmatched: [file] });

      service.retrySmartMatch();
      expect(service.matching()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 350));
      expect(service.matching()).toBe(false);
    });
  });

  // ============================================================================
  // updatePsLayersFromDoc
  // ============================================================================
  describe('updatePsLayersFromDoc', () => {
    it('üres selectedLayerNames-re üres psLayers-t állít', () => {
      uploadServiceMock.parseLayerNames.mockReturnValue([]);

      service.updatePsLayersFromDoc({ name: 'test.psd', path: '/tmp', dir: '/tmp', selectedLayerNames: [] });

      expect(service.psLayers()).toEqual([]);
    });

    it('merge-eli a meglévő file/uploadStatus adatokat', () => {
      const file = new File([''], 'test.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'done', file, photoUrl: 'url', personName: 'Kiss', photoThumbUrl: 'thumb' },
      ]);

      const parsed: PsLayerPerson[] = [
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ];
      uploadServiceMock.parseLayerNames.mockReturnValue(parsed);

      service.updatePsLayersFromDoc({ name: 'test.psd', path: '/tmp', dir: '/tmp', selectedLayerNames: ['a---1'] });

      const layers = service.psLayers();
      expect(layers[0].file).toBe(file);
      expect(layers[0].uploadStatus).toBe('done');
      expect(layers[0].photoUrl).toBe('url');
      expect(layers[0].personName).toBe('Kiss');
    });

    it('enrichWithPersons-t hívja ha van persons adat', () => {
      projectServiceMock.persons.set(mockPersons);
      const parsed: PsLayerPerson[] = [
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' },
      ];
      uploadServiceMock.parseLayerNames.mockReturnValue(parsed);

      service.updatePsLayersFromDoc({ name: 'test.psd', path: '/tmp', dir: '/tmp', selectedLayerNames: ['a---1'] });

      expect(uploadServiceMock.enrichWithPersons).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // placeInPs
  // ============================================================================
  describe('placeInPs', () => {
    it('beállítja placing-et és hívja a placePhotosInPs-t', async () => {
      uploadServiceMock.placePhotosInPs.mockResolvedValue({ success: true });
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'done', photoUrl: 'url' },
      ]);

      await service.placeInPs();

      expect(service.placing()).toBe(false);
      expect(service.batchResult()?.success).toBe(true);
      expect(service.batchResult()?.message).toBe('Fotók behelyezve a Photoshopba');
    });

    it('hiba esetén error message-t állít', async () => {
      uploadServiceMock.placePhotosInPs.mockResolvedValue({ success: false, error: 'PS hiba' });

      await service.placeInPs();

      expect(service.placing()).toBe(false);
      expect(service.batchResult()?.success).toBe(false);
      expect(service.batchResult()?.message).toBe('PS hiba');
    });
  });

  // ============================================================================
  // startResize
  // ============================================================================
  describe('startResize', () => {
    it('beállítja a resizing flag-et', () => {
      const event = new MouseEvent('mousedown', { clientY: 500 });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      service.startResize(event);

      expect(service.resizing).toBe(true);
    });
  });
});
