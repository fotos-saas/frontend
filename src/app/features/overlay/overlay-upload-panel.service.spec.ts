import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DestroyRef, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { OverlayUploadPanelService } from './overlay-upload-panel.service';
import { OverlayUploadService, PsLayerPerson } from './overlay-upload.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { environment } from '../../../environments/environment';

describe('OverlayUploadPanelService', () => {
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

    // electronAPI mock
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
  // Kezdeti állapot
  // ============================================================================
  describe('Kezdeti állapot', () => {
    it('panelOpen false', () => {
      expect(service.panelOpen()).toBe(false);
    });

    it('selectedPerson null', () => {
      expect(service.selectedPerson()).toBeNull();
    });

    it('searchQuery üres', () => {
      expect(service.searchQuery()).toBe('');
    });

    it('uploading false', () => {
      expect(service.uploading()).toBe(false);
    });

    it('uploadResult null', () => {
      expect(service.uploadResult()).toBeNull();
    });

    it('dragOver false', () => {
      expect(service.dragOver()).toBe(false);
    });

    it('selectedFile null', () => {
      expect(service.selectedFile()).toBeNull();
    });

    it('panelHeight 300', () => {
      expect(service.panelHeight()).toBe(300);
    });

    it('psLayers üres', () => {
      expect(service.psLayers()).toEqual([]);
    });

    it('batchUploading false', () => {
      expect(service.batchUploading()).toBe(false);
    });

    it('batchProgress { done: 0, total: 0 }', () => {
      expect(service.batchProgress()).toEqual({ done: 0, total: 0 });
    });

    it('placing false', () => {
      expect(service.placing()).toBe(false);
    });

    it('unmatchedFiles üres', () => {
      expect(service.unmatchedFiles()).toEqual([]);
    });

    it('batchResult null', () => {
      expect(service.batchResult()).toBeNull();
    });
  });

  // ============================================================================
  // Computed signalok
  // ============================================================================
  describe('Computed signalok', () => {
    it('hasPsLayers false ha üres', () => {
      expect(service.hasPsLayers()).toBe(false);
    });

    it('hasPsLayers true ha van layer', () => {
      service.psLayers.set([{ personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending' }]);
      expect(service.hasPsLayers()).toBe(true);
    });

    it('uploadableLayers a fájllal rendelkező, nem-done layereket adja', () => {
      const file = new File([''], 'test.jpg');
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending', file },
        { personId: 2, layerName: 'b---2', slug: 'b', uploadStatus: 'done', file },
        { personId: 3, layerName: 'c---3', slug: 'c', uploadStatus: 'pending' },
      ]);

      expect(service.uploadableLayers()).toHaveLength(1);
      expect(service.uploadableLayers()[0].personId).toBe(1);
    });

    it('placableLayers a done + photoUrl-es layereket adja', () => {
      service.psLayers.set([
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'done', photoUrl: 'url1' },
        { personId: 2, layerName: 'b---2', slug: 'b', uploadStatus: 'done' },
        { personId: 3, layerName: 'c---3', slug: 'c', uploadStatus: 'pending', photoUrl: 'url3' },
      ]);

      expect(service.placableLayers()).toHaveLength(1);
      expect(service.placableLayers()[0].personId).toBe(1);
    });

    it('filteredPersons szűr a searchQuery alapján', () => {
      projectServiceMock.persons.set(mockPersons);
      service.searchQuery.set('kiss');

      const result = service.filteredPersons();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Kiss János');
    });

    it('filteredPersons mindet visszaadja ha üres a query', () => {
      projectServiceMock.persons.set(mockPersons);
      service.searchQuery.set('');

      expect(service.filteredPersons()).toHaveLength(2);
    });

    it('canUpload true ha van person + file + nem uploading', () => {
      service.selectedPerson.set(mockPersons[0]);
      service.selectedFile.set(new File([''], 'test.jpg'));
      service.uploading.set(false);

      expect(service.canUpload()).toBe(true);
    });

    it('canUpload false ha nincs selectedPerson', () => {
      service.selectedFile.set(new File([''], 'test.jpg'));
      expect(service.canUpload()).toBe(false);
    });

    it('canUpload false ha nincs selectedFile', () => {
      service.selectedPerson.set(mockPersons[0]);
      expect(service.canUpload()).toBe(false);
    });

    it('canUpload false ha uploading', () => {
      service.selectedPerson.set(mockPersons[0]);
      service.selectedFile.set(new File([''], 'test.jpg'));
      service.uploading.set(true);
      expect(service.canUpload()).toBe(false);
    });
  });

  // ============================================================================
  // closePanel
  // ============================================================================
  describe('closePanel', () => {
    it('visszaállítja az összes panel állapotot', () => {
      service.panelOpen.set(true);
      service.selectedPerson.set(mockPersons[0]);
      service.selectedFile.set(new File([''], 'test.jpg'));
      service.uploadResult.set({ success: true });
      service.searchQuery.set('test');
      service.batchResult.set({ success: true, message: 'ok' });

      service.closePanel();

      expect(service.panelOpen()).toBe(false);
      expect(service.selectedPerson()).toBeNull();
      expect(service.selectedFile()).toBeNull();
      expect(service.uploadResult()).toBeNull();
      expect(service.searchQuery()).toBe('');
      expect(service.batchResult()).toBeNull();
    });
  });

  // ============================================================================
  // setContextResolver
  // ============================================================================
  describe('setContextResolver', () => {
    it('kontextus resolver beállítható', () => {
      const resolver = () => ({ mode: 'designer' as const, projectId: 99 });
      service.setContextResolver(resolver);
      // Nem dob hibát — implicit teszt
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // Drag & Drop események
  // ============================================================================
  describe('Drag & Drop események', () => {
    it('onDragOver beállítja dragOver-t true-ra', () => {
      const event = new Event('dragover') as DragEvent;
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

      service.onDragOver(event);
      expect(service.dragOver()).toBe(true);
    });

    it('onDragLeave beállítja dragOver-t false-ra', () => {
      service.dragOver.set(true);
      const event = new Event('dragleave') as DragEvent;
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

      service.onDragLeave(event);
      expect(service.dragOver()).toBe(false);
    });
  });

  // ============================================================================
  // selectPerson
  // ============================================================================
  describe('selectPerson', () => {
    it('beállítja a selectedPerson-t és reseteli az uploadResult-ot', () => {
      service.uploadResult.set({ success: true, message: 'ok' });

      service.selectPerson(mockPersons[0]);

      expect(service.selectedPerson()).toBe(mockPersons[0]);
      expect(service.uploadResult()).toBeNull();
    });
  });

  // ============================================================================
  // onSearchInput
  // ============================================================================
  describe('onSearchInput', () => {
    it('frissíti a searchQuery-t', () => {
      const event = { target: { value: 'teszt' } } as unknown as Event;
      service.onSearchInput(event);

      expect(service.searchQuery()).toBe('teszt');
    });
  });

  // ============================================================================
  // upload (single)
  // ============================================================================
  describe('upload (single)', () => {
    it('nem csinál semmit ha nincs person, file vagy projectId', () => {
      service.setContextResolver(() => ({ mode: 'normal' }));
      service.upload();

      expect(service.uploading()).toBe(false);
    });

    it('sikeres upload frissíti az állapotot', () => {
      service.setContextResolver(() => ({ mode: 'normal', projectId: 42 }));
      service.selectedPerson.set(mockPersons[0]);
      service.selectedFile.set(new File(['data'], 'test.jpg', { type: 'image/jpeg' }));

      service.upload();

      expect(service.uploading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/1/photo`);
      req.flush({ success: true, photo: { thumbUrl: 'new-thumb.jpg' } });

      expect(service.uploading()).toBe(false);
      expect(service.uploadResult()?.success).toBe(true);
      expect(service.selectedFile()).toBeNull();
    });

    it('upload hiba esetén hibaüzenetet állít be', () => {
      service.setContextResolver(() => ({ mode: 'normal', projectId: 42 }));
      service.selectedPerson.set(mockPersons[0]);
      service.selectedFile.set(new File(['data'], 'test.jpg', { type: 'image/jpeg' }));

      service.upload();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/1/photo`);
      req.flush({ message: 'Túl nagy fájl' }, { status: 413, statusText: 'Payload Too Large' });

      expect(service.uploading()).toBe(false);
      expect(service.uploadResult()?.success).toBe(false);
    });
  });

  // ============================================================================
  // onFileSelect
  // ============================================================================
  describe('onFileSelect', () => {
    it('beállítja a kiválasztott fájlt ha érvényes típusú', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as unknown as Event;

      service.onFileSelect(event);

      expect(service.selectedFile()).toBe(file);
    });

    it('hibaüzenetet ad ha nem képfájl', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } } as unknown as Event;

      service.onFileSelect(event);

      expect(service.selectedFile()).toBeNull();
      expect(service.uploadResult()?.success).toBe(false);
      expect(service.uploadResult()?.message).toContain('képfájlok');
    });

    it('hibaüzenetet ad ha túl nagy a fájl', () => {
      // 101 MB fájl mock
      const largeFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 101 * 1024 * 1024 });

      const event = { target: { files: [largeFile] } } as unknown as Event;

      service.onFileSelect(event);

      expect(service.selectedFile()).toBeNull();
      expect(service.uploadResult()?.success).toBe(false);
      expect(service.uploadResult()?.message).toContain('100 MB');
    });
  });

  // ============================================================================
  // matchDroppedFiles
  // ============================================================================
  describe('matchDroppedFiles', () => {
    it('szűri a nem megengedett fájltípusokat', () => {
      const jpgFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const pdfFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      const fileList = { length: 2, 0: jpgFile, 1: pdfFile, item: (i: number) => [jpgFile, pdfFile][i] } as unknown as FileList;

      uploadServiceMock.matchFilesToLayers.mockReturnValue({ matched: [], unmatched: [jpgFile] });

      service.matchDroppedFiles(fileList);

      // Csak a jpg fájl kerül az uploadService.matchFilesToLayers hívásba
      expect(uploadServiceMock.matchFilesToLayers).toHaveBeenCalledWith(
        [jpgFile],
        expect.any(Array),
        expect.anything(),
      );
    });

    it('szűri a túl nagy fájlokat', () => {
      const normalFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const bigFile = new File(['data'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(bigFile, 'size', { value: 200 * 1024 * 1024 });
      const fileList = { length: 2, 0: normalFile, 1: bigFile } as unknown as FileList;

      uploadServiceMock.matchFilesToLayers.mockReturnValue({ matched: [], unmatched: [normalFile] });

      service.matchDroppedFiles(fileList);

      expect(uploadServiceMock.matchFilesToLayers).toHaveBeenCalledWith(
        [normalFile],
        expect.any(Array),
        expect.anything(),
      );
    });

    it('üres listánál nem hívja a matchFilesToLayers-t', () => {
      const fileList = { length: 0 } as unknown as FileList;

      service.matchDroppedFiles(fileList);

      expect(uploadServiceMock.matchFilesToLayers).not.toHaveBeenCalled();
    });

    it('beállítja az unmatchedFiles-t és psLayers-t', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const unmatched = new File(['data'], 'other.jpg', { type: 'image/jpeg' });
      const fileList = { length: 2, 0: file, 1: unmatched } as unknown as FileList;

      const matchedLayers: PsLayerPerson[] = [
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending', file },
      ];
      uploadServiceMock.matchFilesToLayers.mockReturnValue({ matched: matchedLayers, unmatched: [unmatched] });

      service.matchDroppedFiles(fileList);

      expect(service.psLayers()).toEqual(matchedLayers);
      expect(service.unmatchedFiles()).toEqual([unmatched]);
      expect(service.batchResult()).toBeNull();
    });
  });

});
