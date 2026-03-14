import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
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

describe('OverlayLayerManagementService', () => {
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
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('renameDialogOpen false', () => {
      expect(service.renameDialogOpen()).toBe(false);
    });

    it('renameMatched ures tomb', () => {
      expect(service.renameMatched()).toEqual([]);
    });

    it('renameUnmatched ures tomb', () => {
      expect(service.renameUnmatched()).toEqual([]);
    });

    it('renameApplying false', () => {
      expect(service.renameApplying()).toBe(false);
    });

    it('refreshRosterDialogOpen false', () => {
      expect(service.refreshRosterDialogOpen()).toBe(false);
    });

    it('refreshRosterToRemove ures tomb', () => {
      expect(service.refreshRosterToRemove()).toEqual([]);
    });

    it('refreshRosterToAdd ures tomb', () => {
      expect(service.refreshRosterToAdd()).toEqual([]);
    });

    it('refreshRosterApplying false', () => {
      expect(service.refreshRosterApplying()).toBe(false);
    });
  });

  // ============================================================================
  // renameLayerIds
  // ============================================================================
  describe('renameLayerIds', () => {
    it('withBusy-t hasznalja a rename-layer-ids ID-val', async () => {
      await service.renameLayerIds(context);

      expect(psService.withBusy).toHaveBeenCalledWith('rename-layer-ids', expect.any(Function));
    });

    it('ures layer lista eseten return-ol', async () => {
      psService.getImageLayerNames.mockResolvedValue([]);

      await service.renameLayerIds(context);

      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('pontos nev matching — layer slug === normalize(person.name)', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Teszt Elek' }),
      ]);

      await service.renameLayerIds(context);

      // Nincs unmatched, nincs dialog — executeRename direktbe
      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'teszt_elek', new: 'teszt_elek---10' }],
        },
      });
    });

    it('mar helyes nev eseten nem ad hozza a rename listhoz', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---10']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Teszt Elek' }),
      ]);

      await service.renameLayerIds(context);

      // Ha az uj nev === regi nev, nincs rename → nincs executeRename hivas
      expect((window as any).electronAPI.photoshop.runJsx).not.toHaveBeenCalled();
    });

    it('ID csere — regi ID → uj ID', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek---999']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Teszt Elek' }),
      ]);

      await service.renameLayerIds(context);

      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'teszt_elek---999', new: 'teszt_elek---10' }],
        },
      });
    });

    it('nem matchelt layer eseten dialogust nyit', async () => {
      psService.getImageLayerNames.mockResolvedValue(['ismeretlen_ember']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Mas Valaki' }),
      ]);
      psService.getNamesTextContent.mockResolvedValue(new Map());

      await service.renameLayerIds(context);

      expect(service.renameDialogOpen()).toBe(true);
      expect(service.renameUnmatched().length).toBe(1);
      expect(service.renameUnmatched()[0].layerName).toBe('ismeretlen_ember');
    });

    it('fuzzy matching (levenshtein <= 2)', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_eelk']); // 1 char diff
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Teszt Elek' }),
      ]);

      await service.renameLayerIds(context);

      // Fuzzy match talalat → executeRename
      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalled();
    });

    it('Names fallback matching — text content alapjan', async () => {
      psService.getImageLayerNames.mockResolvedValue(['layer_abc']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 5, name: 'Kovacs Anna' }),
      ]);
      psService.getNamesTextContent.mockResolvedValue(
        new Map([['layer_abc', 'Kovacs Anna']]),
      );

      await service.renameLayerIds(context);

      // A fallback matching alapjan talalt → executeRename
      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'layer_abc', new: 'kovacs_anna---5' }],
        },
      });
    });

    it('mixed matched es unmatched eseten dialogust nyit', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek', 'ismeretlen']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 10, name: 'Teszt Elek' }),
      ]);
      psService.getNamesTextContent.mockResolvedValue(new Map());

      await service.renameLayerIds(context);

      expect(service.renameDialogOpen()).toBe(true);
      expect(service.renameMatched().length).toBe(1);
      expect(service.renameUnmatched().length).toBe(1);
    });

    it('ekezeteket normalizalja a matchingnel', async () => {
      psService.getImageLayerNames.mockResolvedValue(['arviz_gabor']);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 7, name: 'Árvíz Gábor' }),
      ]);

      await service.renameLayerIds(context);

      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'arviz_gabor', new: 'arviz_gabor---7' }],
        },
      });
    });

    it('projectId null eseten ures szemelylista', async () => {
      psService.getImageLayerNames.mockResolvedValue(['teszt_elek']);
      projectService.resolveProjectId.mockResolvedValue(null);

      await service.renameLayerIds(context);

      // Nincs szemely → unmatched dialog
      expect(service.renameDialogOpen()).toBe(true);
    });
  });

  // ============================================================================
  // updateUnmatchedId
  // ============================================================================
  describe('updateUnmatchedId', () => {
    it('frissiti a megadott index newId erteket', () => {
      service.renameUnmatched.set([
        { layerName: 'layer_a', newId: '' },
        { layerName: 'layer_b', newId: '' },
      ]);

      service.updateUnmatchedId(0, '42');

      expect(service.renameUnmatched()[0].newId).toBe('42');
      expect(service.renameUnmatched()[1].newId).toBe('');
    });

    it('masodik elem frissitese', () => {
      service.renameUnmatched.set([
        { layerName: 'layer_a', newId: '' },
        { layerName: 'layer_b', newId: '' },
      ]);

      service.updateUnmatchedId(1, '99');

      expect(service.renameUnmatched()[1].newId).toBe('99');
    });
  });

  // ============================================================================
  // applyRename
  // ============================================================================
  describe('applyRename', () => {
    it('matched elemeket atnevezes listahoz adja', async () => {
      service.renameMatched.set([
        { old: 'regi_nev', new: 'uj_nev---10', personName: 'Uj Nev' },
      ]);
      service.renameUnmatched.set([]);

      await service.applyRename();

      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'regi_nev', new: 'uj_nev---10' }],
        },
      });
      expect(service.renameDialogOpen()).toBe(false);
    });

    it('unmatched elemeket uj ID-val atnevezi', async () => {
      service.renameMatched.set([]);
      service.renameUnmatched.set([
        { layerName: 'layer_abc', newId: '55' },
      ]);

      await service.applyRename();

      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'layer_abc', new: 'layer_abc---55' }],
        },
      });
    });

    it('ures newId-ju unmatched elemeket kihagyja', async () => {
      service.renameMatched.set([]);
      service.renameUnmatched.set([
        { layerName: 'layer_abc', newId: '' },
        { layerName: 'layer_def', newId: '  ' },
      ]);

      await service.applyRename();

      // Nincs ervenyes rename → nem hivja runJsx-et
      expect((window as any).electronAPI.photoshop.runJsx).not.toHaveBeenCalled();
    });

    it('regi ID-t lecsipesi az unmatched layer nevbol', async () => {
      service.renameMatched.set([]);
      service.renameUnmatched.set([
        { layerName: 'layer_abc---999', newId: '42' },
      ]);

      await service.applyRename();

      expect((window as any).electronAPI.photoshop.runJsx).toHaveBeenCalledWith({
        scriptName: 'actions/rename-layers.jsx',
        jsonData: {
          renameMap: [{ old: 'layer_abc---999', new: 'layer_abc---42' }],
        },
      });
    });

    it('renameApplying true indulaskor es false vegul', async () => {
      service.renameMatched.set([]);
      service.renameUnmatched.set([]);

      let wasApplying = false;
      const origRunJsx = (window as any).electronAPI.photoshop.runJsx;
      (window as any).electronAPI.photoshop.runJsx = vi.fn().mockImplementation(async () => {
        wasApplying = service.renameApplying();
        return { success: true };
      });

      // renameMap ures, nem hivja
      await service.applyRename();
      expect(service.renameApplying()).toBe(false);
    });

    it('bezarja a dialogust a vegere', async () => {
      service.renameDialogOpen.set(true);
      service.renameMatched.set([]);
      service.renameUnmatched.set([]);

      await service.applyRename();

      expect(service.renameDialogOpen()).toBe(false);
    });
  });

  // ============================================================================
  // closeRenameDialog
  // ============================================================================
  describe('closeRenameDialog', () => {
    it('bezarja a dialogust', () => {
      service.renameDialogOpen.set(true);
      service.closeRenameDialog();
      expect(service.renameDialogOpen()).toBe(false);
    });
  });

});
