import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { OverlaySyncService } from './overlay-sync.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayPollingService } from './overlay-polling.service';
import { LoggerService } from '../../core/services/logger.service';
import { OverlayContext } from '../../core/services/electron.types';

// === Mock electronAPI ===

function createMockElectronAPI() {
  return {
    photoshop: {
      placePhotos: vi.fn().mockResolvedValue({ success: true }),
      refreshPlacedJson: vi.fn().mockResolvedValue({ success: true }),
      runJsx: vi.fn().mockResolvedValue({ success: true }),
    },
    overlay: {
      getProjectId: vi.fn().mockResolvedValue({ projectId: 1 }),
    },
  };
}

function createPerson(overrides: Partial<PersonItem> = {}): PersonItem {
  return {
    id: 1,
    name: 'Teszt Elek',
    title: null,
    type: 'student',
    hasPhoto: true,
    photoThumbUrl: 'http://example.com/thumb.jpg',
    photoUrl: 'http://example.com/photo.jpg',
    archiveId: null,
    linkedGroup: null,
    ...overrides,
  };
}

describe('OverlaySyncService', () => {
  let service: OverlaySyncService;
  let projectService: { persons: ReturnType<typeof vi.fn>; resolveProjectId: ReturnType<typeof vi.fn>; fetchPersons: ReturnType<typeof vi.fn> };
  let psService: { getFreshSelectedLayerNames: ReturnType<typeof vi.fn>; getImageLayerNames: ReturnType<typeof vi.fn>; withBusy: ReturnType<typeof vi.fn> };
  let settingsService: { syncWithBorder: ReturnType<typeof vi.fn> };
  let pollingService: { activeDoc: ReturnType<typeof vi.fn> };

  const context: OverlayContext = { mode: 'normal', projectId: 42 };

  beforeEach(() => {
    projectService = {
      persons: vi.fn().mockReturnValue([]),
      resolveProjectId: vi.fn().mockResolvedValue(42),
      fetchPersons: vi.fn().mockResolvedValue([]),
    };

    psService = {
      getFreshSelectedLayerNames: vi.fn().mockResolvedValue({ names: [], doc: null }),
      getImageLayerNames: vi.fn().mockResolvedValue([]),
      withBusy: vi.fn().mockImplementation(async (_id: string, fn: () => Promise<void>) => fn()),
    };

    settingsService = {
      syncWithBorder: vi.fn().mockReturnValue(true),
    };

    pollingService = {
      activeDoc: vi.fn().mockReturnValue({ name: 'test.psd', path: '/path/to/test.psd', dir: '/path/to' }),
    };

    (window as any).electronAPI = createMockElectronAPI();

    TestBed.configureTestingModule({
      providers: [
        OverlaySyncService,
        { provide: OverlayProjectService, useValue: projectService },
        { provide: OverlayPhotoshopService, useValue: psService },
        { provide: OverlaySettingsService, useValue: settingsService },
        { provide: OverlayPollingService, useValue: pollingService },
        { provide: LoggerService, useValue: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() } },
      ],
    });

    service = TestBed.inject(OverlaySyncService);
  });

  // ============================================================================
  // syncPhotos
  // ============================================================================
  describe('syncPhotos', () => {
    it('nincs electronAPI eseten ne csinaljon semmit', async () => {
      (window as any).electronAPI = undefined;

      await service.syncPhotos('all', context);

      expect(psService.getImageLayerNames).not.toHaveBeenCalled();
    });

    it('selected modban getFreshSelectedLayerNames-t hiv', async () => {
      psService.getFreshSelectedLayerNames.mockResolvedValue({
        names: ['teszt_elek---1'],
        doc: null,
      });
      projectService.persons.mockReturnValue([createPerson({ id: 1 })]);

      await service.syncPhotos('selected', context);

      expect(psService.getFreshSelectedLayerNames).toHaveBeenCalled();
      expect(psService.getImageLayerNames).not.toHaveBeenCalled();
    });

    it('selected modban 0 kijelolt layer eseten return-ol', async () => {
      psService.getFreshSelectedLayerNames.mockResolvedValue({ names: [], doc: null });

      await service.syncPhotos('selected', context);

      expect(psService.withBusy).not.toHaveBeenCalled();
    });

    it('all modban getImageLayerNames-t hiv', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---1']);
      projectService.persons.mockReturnValue([createPerson({ id: 1 })]);

      await service.syncPhotos('all', context);

      expect(psService.getImageLayerNames).toHaveBeenCalled();
    });

    it('person ID nelkuli layereket figyelmen kivul hagyja', async () => {
      psService.getImageLayerNames.mockResolvedValue(['no_id_here', 'invalid_layer']);

      await service.syncPhotos('all', context);

      // layerPersonMap ures, return-ol
      expect(psService.withBusy).not.toHaveBeenCalled();
    });

    it('layer nevbol kinyeri a person ID-t (---N minta)', async () => {
      const person = createPerson({ id: 123, photoUrl: 'http://example.com/p.jpg' });
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---123']);
      projectService.fetchPersons.mockResolvedValue([person]);

      await service.syncPhotos('all', context);

      expect(psService.withBusy).toHaveBeenCalledWith('sync-photos', expect.any(Function));
    });

    it('photo nelkuli szemelyt kihagyja', async () => {
      const person = createPerson({ id: 1, photoUrl: null });
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---1']);
      projectService.fetchPersons.mockResolvedValue([person]);

      await service.syncPhotos('all', context);

      // photosToSync ures, return-ol a withBusy elott VAGY a withBusy-n belul nem hiv placePhotos-t
      // A service ujra lekeri a persons-oket fetchPersons-szel
      expect(projectService.fetchPersons).toHaveBeenCalledWith(42);
    });

    it('tobb szemely eseten mindegyik photot sync-eli', async () => {
      const persons = [
        createPerson({ id: 1, name: 'Egy Elek', photoUrl: 'http://example.com/1.jpg' }),
        createPerson({ id: 2, name: 'Ketto Kata', photoUrl: 'http://example.com/2.jpg' }),
      ];
      psService.getImageLayerNames.mockResolvedValue(['egy_elek---1', 'ketto_kata---2']);
      projectService.fetchPersons.mockResolvedValue(persons);

      await service.syncPhotos('all', context);

      expect(psService.withBusy).toHaveBeenCalledWith('sync-photos', expect.any(Function));
      expect((window as any).electronAPI.photoshop.placePhotos).toHaveBeenCalledWith({
        layers: [
          { layerName: 'egy_elek---1', photoUrl: 'http://example.com/1.jpg' },
          { layerName: 'ketto_kata---2', photoUrl: 'http://example.com/2.jpg' },
        ],
        syncBorder: true,
        psdFilePath: '/path/to/test.psd',
      });
    });

    it('resolveProjectId eredmenye alapjan fetchPersons-t hiv', async () => {
      projectService.resolveProjectId.mockResolvedValue(99);
      psService.getImageLayerNames.mockResolvedValue(['teszt---5']);
      projectService.fetchPersons.mockResolvedValue([createPerson({ id: 5, photoUrl: 'http://example.com/5.jpg' })]);

      await service.syncPhotos('all', context);

      expect(projectService.fetchPersons).toHaveBeenCalledWith(99);
    });

    it('resolveProjectId null eseten a meglevo persons()-t hasznalja', async () => {
      projectService.resolveProjectId.mockResolvedValue(null);
      const person = createPerson({ id: 7, photoUrl: 'http://example.com/7.jpg' });
      projectService.persons.mockReturnValue([person]);
      psService.getImageLayerNames.mockResolvedValue(['teszt---7']);

      await service.syncPhotos('all', context);

      expect(projectService.fetchPersons).not.toHaveBeenCalled();
      expect(projectService.persons).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // refreshPlacedJson
  // ============================================================================
  describe('refreshPlacedJson', () => {
    it('nincs electronAPI eseten ne csinaljon semmit', async () => {
      (window as any).electronAPI = undefined;

      await service.refreshPlacedJson(context);

      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('nincs PSD utvonal eseten return-ol', async () => {
      pollingService.activeDoc.mockReturnValue({ name: null, path: null, dir: null });

      await service.refreshPlacedJson(context);

      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('nincs projectId eseten return-ol', async () => {
      projectService.resolveProjectId.mockResolvedValue(null);

      await service.refreshPlacedJson(context);

      expect(psService.withBusy).not.toHaveBeenCalled();
    });

    it('szemelyek kiszurese fotoval rendelkezokre', async () => {
      const persons = [
        createPerson({ id: 1, name: 'Teszt Elek', photoUrl: 'http://example.com/1.jpg' }),
        createPerson({ id: 2, name: 'Foto Nelkul', photoUrl: null }),
        createPerson({ id: 3, name: 'Van Foto', photoUrl: 'http://example.com/3.jpg' }),
      ];
      projectService.fetchPersons.mockResolvedValue(persons);

      await service.refreshPlacedJson(context);

      expect(psService.withBusy).toHaveBeenCalledWith('refresh-placed-json', expect.any(Function));
      expect((window as any).electronAPI.photoshop.refreshPlacedJson).toHaveBeenCalledWith({
        psdFilePath: '/path/to/test.psd',
        layers: [
          { layerName: 'teszt_elek---1', photoUrl: 'http://example.com/1.jpg' },
          { layerName: 'van_foto---3', photoUrl: 'http://example.com/3.jpg' },
        ],
        syncBorder: true,
      });
    });

    it('ures szemelylista eseten nem hiv refreshPlacedJson IPC-t', async () => {
      projectService.fetchPersons.mockResolvedValue([]);

      await service.refreshPlacedJson(context);

      expect((window as any).electronAPI.photoshop.refreshPlacedJson).not.toHaveBeenCalled();
    });

    it('foto nelkuli szemelylista eseten nem hiv refreshPlacedJson IPC-t', async () => {
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, photoUrl: null }),
        createPerson({ id: 2, photoUrl: null }),
      ]);

      await service.refreshPlacedJson(context);

      expect((window as any).electronAPI.photoshop.refreshPlacedJson).not.toHaveBeenCalled();
    });

    it('ekezeteket eltavolitja a layer slug-bol', async () => {
      const person = createPerson({ id: 1, name: 'Árvíztűrő Tükörfúrógép', photoUrl: 'http://example.com/1.jpg' });
      projectService.fetchPersons.mockResolvedValue([person]);

      await service.refreshPlacedJson(context);

      const call = (window as any).electronAPI.photoshop.refreshPlacedJson.mock.calls[0][0];
      expect(call.layers[0].layerName).toBe('arvizturo_tukorfurogep---1');
    });

    it('syncWithBorder erteket tovabbitja', async () => {
      settingsService.syncWithBorder.mockReturnValue(false);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, photoUrl: 'http://example.com/1.jpg' }),
      ]);

      await service.refreshPlacedJson(context);

      const call = (window as any).electronAPI.photoshop.refreshPlacedJson.mock.calls[0][0];
      expect(call.syncBorder).toBe(false);
    });
  });
});
