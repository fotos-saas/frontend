import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OverlayLayerManagementService } from './overlay-layer-management.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { LoggerService } from '../../core/services/logger.service';
import { OverlayContext } from '../../core/services/electron.types';

function createPerson(overrides: Partial<PersonItem> = {}): PersonItem {
  return {
    id: 1,
    name: 'Teszt Elek',
    title: null,
    type: 'student',
    hasPhoto: true,
    photoThumbUrl: null,
    photoUrl: null,
    archiveId: null,
    linkedGroup: null,
    ...overrides,
  };
}

function createMockElectronAPI() {
  return {
    photoshop: {
      runJsx: vi.fn().mockResolvedValue({ success: true }),
    },
    overlay: {
      getProjectId: vi.fn().mockResolvedValue({ projectId: 1 }),
    },
  };
}

/**
 * overlay-layer-management.service – 2. rész
 * refreshRoster, applyRefreshRoster, closeRefreshRosterDialog
 */
describe('OverlayLayerManagementService – roster', () => {
  let service: OverlayLayerManagementService;
  let projectService: {
    resolveProjectId: ReturnType<typeof vi.fn>;
    fetchPersons: ReturnType<typeof vi.fn>;
  };
  let psService: {
    withBusy: ReturnType<typeof vi.fn>;
    getImageLayerNames: ReturnType<typeof vi.fn>;
    getNamesTextContent: ReturnType<typeof vi.fn>;
    runJsx: ReturnType<typeof vi.fn>;
  };

  const context: OverlayContext = { mode: 'normal', projectId: 42 };

  beforeEach(() => {
    projectService = {
      resolveProjectId: vi.fn().mockResolvedValue(42),
      fetchPersons: vi.fn().mockResolvedValue([]),
    };

    psService = {
      withBusy: vi.fn().mockImplementation(async (_id: string, fn: () => Promise<void>) => fn()),
      getImageLayerNames: vi.fn().mockResolvedValue([]),
      getNamesTextContent: vi.fn().mockResolvedValue(new Map()),
      runJsx: vi.fn().mockResolvedValue(null),
    };

    (window as any).electronAPI = createMockElectronAPI();

    TestBed.configureTestingModule({
      providers: [
        OverlayLayerManagementService,
        { provide: OverlayProjectService, useValue: projectService },
        { provide: OverlayPhotoshopService, useValue: psService },
        { provide: LoggerService, useValue: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() } },
      ],
    });

    service = TestBed.inject(OverlayLayerManagementService);
  });

  // ============================================================================
  // refreshRoster
  // ============================================================================
  describe('refreshRoster', () => {
    it('withBusy-t hasznalja a refresh-roster ID-val', async () => {
      await service.refreshRoster(context);

      expect(psService.withBusy).toHaveBeenCalledWith('refresh-roster', expect.any(Function));
    });

    it('ures layer lista eseten return-ol', async () => {
      psService.getImageLayerNames.mockResolvedValue([]);

      await service.refreshRoster(context);

      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('nincs projectId eseten return-ol', async () => {
      psService.getImageLayerNames.mockResolvedValue(['layer---1']);
      projectService.resolveProjectId.mockResolvedValue(null);

      await service.refreshRoster(context);

      expect(projectService.fetchPersons).not.toHaveBeenCalled();
    });

    it('nincs eletes eseten nem nyit dialogust', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---1']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Teszt Elek' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterDialogOpen()).toBe(false);
    });

    it('torlendo szemelyek: PSD-ben van de DB-ben nincs', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---1', 'regi_diak---99']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Teszt Elek' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterDialogOpen()).toBe(true);
      expect(service.refreshRosterToRemove().length).toBe(1);
      expect(service.refreshRosterToRemove()[0].layerName).toBe('regi_diak---99');
    });

    it('hozzaadando szemelyek: DB-ben van de PSD-ben nincs', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---1']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Teszt Elek' }),
        createPerson({ id: 2, name: 'Új Diák', type: 'student' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterDialogOpen()).toBe(true);
      expect(service.refreshRosterToAdd().length).toBe(1);
      expect(service.refreshRosterToAdd()[0].name).toBe('Új Diák');
      expect(service.refreshRosterToAdd()[0].group).toBe('Students');
    });

    it('tanar tipusu uj szemely Teachers groupba kerul', async () => {
      psService.getImageLayerNames.mockResolvedValue(['meglevo_diak---1']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Meglevo Diak' }),
        createPerson({ id: 3, name: 'Tanár Úr', type: 'teacher' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterToAdd().length).toBe(1);
      expect(service.refreshRosterToAdd()[0].group).toBe('Teachers');
    });

    it('ID nelkuli layereket figyelmen kivul hagyja a diff szamitasnal', async () => {
      psService.getImageLayerNames.mockResolvedValue(['no_id_layer', 'teszt_elek---1']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Teszt Elek' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterDialogOpen()).toBe(false);
    });

    it('mindket iranyba van elteres', async () => {
      psService.getImageLayerNames.mockResolvedValue(['regi---99']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Uj Ember' }),
      ]);

      await service.refreshRoster(context);

      expect(service.refreshRosterToRemove().length).toBe(1);
      expect(service.refreshRosterToAdd().length).toBe(1);
    });
  });

  // ============================================================================
  // applyRefreshRoster
  // ============================================================================
  describe('applyRefreshRoster', () => {
    it('runJsx-et hiv a helyes parametrekkel', async () => {
      service.refreshRosterToRemove.set([
        { name: 'Regi Diak', layerName: 'regi_diak---99' },
      ]);
      service.refreshRosterToAdd.set([
        { name: 'Uj Diak', type: 'student', layerName: 'uj_diak---2', displayText: 'Uj Diak', group: 'Students' },
      ]);

      await service.applyRefreshRoster();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'refresh-roster',
        'actions/refresh-roster.jsx',
        {
          toRemove: ['regi_diak---99'],
          toAdd: [{ layerName: 'uj_diak---2', displayText: 'Uj Diak', group: 'Students' }],
        },
      );
    });

    it('sikeres lefutas utan bezarja a dialogust es uriteni a listakat', async () => {
      service.refreshRosterDialogOpen.set(true);
      service.refreshRosterToRemove.set([{ name: 'X', layerName: 'x---1' }]);
      service.refreshRosterToAdd.set([]);

      await service.applyRefreshRoster();

      expect(service.refreshRosterDialogOpen()).toBe(false);
      expect(service.refreshRosterToRemove()).toEqual([]);
      expect(service.refreshRosterToAdd()).toEqual([]);
    });

    it('refreshRosterApplying true indulaskor es false vegul', async () => {
      service.refreshRosterToRemove.set([]);
      service.refreshRosterToAdd.set([]);

      let appliedDuringExec = false;
      psService.runJsx.mockImplementation(async () => {
        appliedDuringExec = service.refreshRosterApplying();
        return null;
      });

      await service.applyRefreshRoster();

      expect(appliedDuringExec).toBe(true);
      expect(service.refreshRosterApplying()).toBe(false);
    });

    it('hiba eseten is false-ra allitja a refreshRosterApplying-ot', async () => {
      service.refreshRosterToRemove.set([{ name: 'X', layerName: 'x---1' }]);
      service.refreshRosterToAdd.set([]);
      psService.runJsx.mockRejectedValue(new Error('PS crash'));

      await service.applyRefreshRoster();

      expect(service.refreshRosterApplying()).toBe(false);
    });
  });

  // ============================================================================
  // closeRefreshRosterDialog
  // ============================================================================
  describe('closeRefreshRosterDialog', () => {
    it('bezarja a dialogust es uriti a listakat', () => {
      service.refreshRosterDialogOpen.set(true);
      service.refreshRosterToRemove.set([{ name: 'X', layerName: 'x---1' }]);
      service.refreshRosterToAdd.set([{ name: 'Y', type: 'student', layerName: 'y---2', displayText: 'Y', group: 'Students' }]);

      service.closeRefreshRosterDialog();

      expect(service.refreshRosterDialogOpen()).toBe(false);
      expect(service.refreshRosterToRemove()).toEqual([]);
      expect(service.refreshRosterToAdd()).toEqual([]);
    });

    it('refreshRosterApplying kozben nem zarodik be', () => {
      service.refreshRosterDialogOpen.set(true);
      service.refreshRosterApplying.set(true);

      service.closeRefreshRosterDialog();

      expect(service.refreshRosterDialogOpen()).toBe(true);
    });
  });
});
