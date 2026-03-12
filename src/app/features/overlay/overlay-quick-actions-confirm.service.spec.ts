import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OverlayQuickActionsService } from './overlay-quick-actions.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayEffectsService } from './overlay-effects.service';

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

/**
 * overlay-quick-actions.service – 2. rész
 * confirmAction, showLinkResult, delegált effekt metódusok,
 * setProjectIdResolver, link target szűrés, position-labels validáció
 */
describe('OverlayQuickActionsService – confirm & actions', () => {
  let service: OverlayQuickActionsService;
  let psService: {
    runJsx: ReturnType<typeof vi.fn>;
    getImageLayerData: ReturnType<typeof vi.fn>;
    getImageLayerNames: ReturnType<typeof vi.fn>;
  };
  let projectService: {
    persons: ReturnType<typeof vi.fn>;
    fetchPersons: ReturnType<typeof vi.fn>;
    getLastProjectId: ReturnType<typeof vi.fn>;
  };
  let settingsService: {
    nameBreakAfter: ReturnType<typeof vi.fn>;
    nameGapCm: ReturnType<typeof vi.fn>;
  };
  let sortService: {
    slugToHumanName: ReturnType<typeof vi.fn>;
  };
  let effectsService: {
    gridPanelOpen: { set: ReturnType<typeof vi.fn>; (): boolean };
    rotatePanelOpen: { set: ReturnType<typeof vi.fn>; (): boolean };
    toggleGridPanel: ReturnType<typeof vi.fn>;
    closeGridPanel: ReturnType<typeof vi.fn>;
    toggleRotatePanel: ReturnType<typeof vi.fn>;
    closeRotatePanel: ReturnType<typeof vi.fn>;
    toggleGridUnit: ReturnType<typeof vi.fn>;
    setGridGapHFromDisplay: ReturnType<typeof vi.fn>;
    setGridGapVFromDisplay: ReturnType<typeof vi.fn>;
    setGridGapFromDisplay: ReturnType<typeof vi.fn>;
    setResult: ReturnType<typeof vi.fn>;
    setRotateAngle: ReturnType<typeof vi.fn>;
    toggleRotateRandom: ReturnType<typeof vi.fn>;
    setBorderRadius: ReturnType<typeof vi.fn>;
    applyRotateSelected: ReturnType<typeof vi.fn>;
    applyBorderRadiusSelected: ReturnType<typeof vi.fn>;
    alignTopOnly: ReturnType<typeof vi.fn>;
    measureGridGaps: ReturnType<typeof vi.fn>;
    executeCenterSelected: ReturnType<typeof vi.fn>;
    executeEqualizeGrid: ReturnType<typeof vi.fn>;
    executeGridArrange: ReturnType<typeof vi.fn>;
    executeBorderRadius: ReturnType<typeof vi.fn>;
    configure: ReturnType<typeof vi.fn>;
    result: ReturnType<typeof vi.fn>;
    gridGapPx: ReturnType<typeof vi.fn>;
    gridAlignTop: ReturnType<typeof vi.fn>;
    gridLayerCount: ReturnType<typeof vi.fn>;
    gridUnit: ReturnType<typeof vi.fn>;
    gridCols: ReturnType<typeof vi.fn>;
    gridRows: ReturnType<typeof vi.fn>;
    gridGapH: ReturnType<typeof vi.fn>;
    gridGapV: ReturnType<typeof vi.fn>;
    gridAlign: ReturnType<typeof vi.fn>;
    imagesOnly: ReturnType<typeof vi.fn>;
    gridGapDisplay: ReturnType<typeof vi.fn>;
    gridGapHDisplay: ReturnType<typeof vi.fn>;
    gridGapVDisplay: ReturnType<typeof vi.fn>;
    rotateAngle: ReturnType<typeof vi.fn>;
    rotateRandom: ReturnType<typeof vi.fn>;
    borderRadius: ReturnType<typeof vi.fn>;
    borderRadiusUseSelected: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    psService = {
      runJsx: vi.fn().mockResolvedValue(null),
      getImageLayerData: vi.fn().mockResolvedValue({ names: [], students: [], teachers: [] }),
      getImageLayerNames: vi.fn().mockResolvedValue([]),
    };
    projectService = {
      persons: vi.fn().mockReturnValue([]),
      fetchPersons: vi.fn().mockResolvedValue([]),
      getLastProjectId: vi.fn().mockReturnValue(null),
    };
    settingsService = {
      nameBreakAfter: vi.fn().mockReturnValue(1),
      nameGapCm: vi.fn().mockReturnValue(0.5),
    };
    sortService = {
      slugToHumanName: vi.fn().mockImplementation((slug: string) => {
        return slug.replace(/---\d+$/, '').split(/[-_]/).filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }),
    };
    const createSignalMock = (initial: any) => {
      const fn = vi.fn().mockReturnValue(initial);
      fn.set = vi.fn();
      fn.update = vi.fn();
      return fn;
    };

    effectsService = {
      gridPanelOpen: createSignalMock(false) as any,
      rotatePanelOpen: createSignalMock(false) as any,
      toggleGridPanel: vi.fn(),
      closeGridPanel: vi.fn(),
      toggleRotatePanel: vi.fn(),
      closeRotatePanel: vi.fn(),
      toggleGridUnit: vi.fn(),
      setGridGapHFromDisplay: vi.fn(),
      setGridGapVFromDisplay: vi.fn(),
      setGridGapFromDisplay: vi.fn(),
      setResult: vi.fn(),
      setRotateAngle: vi.fn(),
      toggleRotateRandom: vi.fn(),
      setBorderRadius: vi.fn(),
      applyRotateSelected: vi.fn().mockResolvedValue(undefined),
      applyBorderRadiusSelected: vi.fn().mockResolvedValue(undefined),
      alignTopOnly: vi.fn().mockResolvedValue(undefined),
      measureGridGaps: vi.fn().mockResolvedValue(undefined),
      executeCenterSelected: vi.fn().mockResolvedValue(undefined),
      executeEqualizeGrid: vi.fn().mockResolvedValue(undefined),
      executeGridArrange: vi.fn().mockResolvedValue(undefined),
      executeBorderRadius: vi.fn().mockResolvedValue(undefined),
      configure: vi.fn(),
      result: vi.fn().mockReturnValue(null),
      gridGapPx: vi.fn().mockReturnValue(null),
      gridAlignTop: vi.fn().mockReturnValue(false),
      gridLayerCount: vi.fn().mockReturnValue(0),
      gridUnit: vi.fn().mockReturnValue('cm'),
      gridCols: vi.fn().mockReturnValue(5),
      gridRows: vi.fn().mockReturnValue(0),
      gridGapH: vi.fn().mockReturnValue(2),
      gridGapV: vi.fn().mockReturnValue(3),
      gridAlign: vi.fn().mockReturnValue('center'),
      imagesOnly: vi.fn().mockReturnValue(false),
      gridGapDisplay: vi.fn().mockReturnValue(null),
      gridGapHDisplay: vi.fn().mockReturnValue(2),
      gridGapVDisplay: vi.fn().mockReturnValue(3),
      rotateAngle: vi.fn().mockReturnValue(2),
      rotateRandom: vi.fn().mockReturnValue(true),
      borderRadius: vi.fn().mockReturnValue(30),
      borderRadiusUseSelected: vi.fn().mockReturnValue(false),
      loading: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        OverlayQuickActionsService,
        { provide: OverlayPhotoshopService, useValue: psService },
        { provide: OverlayProjectService, useValue: projectService },
        { provide: OverlaySettingsService, useValue: settingsService },
        { provide: OverlaySortService, useValue: sortService },
        { provide: OverlayEffectsService, useValue: effectsService },
      ],
    });

    service = TestBed.inject(OverlayQuickActionsService);
  });

  // ============================================================================
  describe('confirmAction', () => {
    it('nincs confirm eseten ne csinaljon semmit', async () => {
      await service.confirmAction();
      expect(psService.runJsx).not.toHaveBeenCalled();
    });

    it('loading kozbeni hivas nem fut le', async () => {
      service.loading.set(true);
      service.onAction('link', 'all');

      await service.confirmAction();

      expect(psService.runJsx).not.toHaveBeenCalled();
    });

    it('link akcio futtatja az executeLink-et', async () => {
      psService.getImageLayerData.mockResolvedValue({
        names: ['teszt_elek---1'],
        students: ['teszt_elek---1'],
        teachers: [],
      });
      psService.runJsx.mockResolvedValue({ output: '{"linked": 1, "names": ["teszt"]}' });
      service.onAction('link', 'all');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'link-layers',
        'actions/link-selected.jsx',
        { LAYER_NAMES: 'teszt_elek---1' },
      );
    });

    it('position-labels akcio futtatja az arrange-t', async () => {
      psService.runJsx.mockResolvedValue({ output: '{"arranged": 5}' });
      service.onAction('position-labels', 'all');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'arrange-names',
        'actions/arrange-names-selected.jsx',
        expect.objectContaining({ TEXT_ALIGN: 'center' }),
      );
    });

    it('refresh-labels akcio futtatja a refresh-et', async () => {
      projectService.getLastProjectId.mockReturnValue(10);
      projectService.fetchPersons.mockResolvedValue([
        createPerson({ id: 1, name: 'Teszt Elek' }),
      ]);
      psService.getImageLayerData.mockResolvedValue({
        names: ['teszt_elek---1'],
        students: ['teszt_elek---1'],
        teachers: [],
      });
      psService.runJsx.mockResolvedValue({ output: '{"refreshed": 1, "nameMapCount": 1, "total": 1}' });
      service.onAction('refresh-labels', 'all');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalled();
    });

    it('equalize-grid delegalja az effects service-nek', async () => {
      service.onAction('equalize-grid', 'all');

      await service.confirmAction();

      expect(effectsService.executeEqualizeGrid).toHaveBeenCalled();
    });

    it('grid-arrange delegalja az effects service-nek', async () => {
      service.onAction('grid-arrange', 'all');

      await service.confirmAction();

      expect(effectsService.executeGridArrange).toHaveBeenCalled();
    });

    it('border-radius delegalja az effects service-nek', async () => {
      service.onAction('border-radius', 'all');

      await service.confirmAction();

      expect(effectsService.executeBorderRadius).toHaveBeenCalled();
    });

    it('loading true-ra all indulaskor es false-ra vegul', async () => {
      service.onAction('reposition-to-image', 'all');
      psService.runJsx.mockResolvedValue({ output: '{"moved": 3}' });

      await service.confirmAction();

      expect(service.loading()).toBe(false);
    });

    it('confirm null-ra all a confirmAction elejen', async () => {
      service.onAction('link', 'all');
      psService.getImageLayerData.mockResolvedValue({ names: [], students: [], teachers: [] });

      await service.confirmAction();

      expect(service.confirm()).toBeNull();
    });
  });

  // ============================================================================
  describe('showLinkResult', () => {
    it('null result eseten hibauzenet', () => {
      service.showLinkResult(null, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Nincs válasz a Photoshoptól');
    });

    it('ures output eseten hibauzenet', () => {
      service.showLinkResult({ output: '' }, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Nincs válasz a Photoshoptól');
    });

    it('nem JSON output eseten hibauzenet', () => {
      service.showLinkResult({ output: 'not json' }, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Érvénytelen válasz');
    });

    it('JSON error mezo eseten hibauzenet', () => {
      service.showLinkResult({ output: '{"error": "PS hiba"}' }, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'PS hiba');
    });

    it('0 linked layer eseten hibauzenet', () => {
      service.showLinkResult({ output: '{"linked": 0, "names": []}' }, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Nem találtam linkelhető layereket');
    });

    it('sikeres link eredmeny', () => {
      service.showLinkResult(
        { output: '{"linked": 3, "unlinked": 0, "names": ["a", "b", "c"]}' },
        'link',
      );
      expect(effectsService.setResult).toHaveBeenCalledWith(true, '3 layer linkelve (3 név)');
    });

    it('sikeres unlink eredmeny', () => {
      service.showLinkResult(
        { output: '{"linked": 0, "unlinked": 2, "names": ["a", "b"]}' },
        'unlink',
      );
      expect(effectsService.setResult).toHaveBeenCalledWith(true, '2 layer szétlinkelve (2 név)');
    });

    it('parse hiba eseten hibauzenet', () => {
      service.showLinkResult({ output: '{invalid json' }, 'link');
      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Hiba a válasz feldolgozásában');
    });
  });

  // ============================================================================
  describe('delegalt effekt metodusok', () => {
    it('setRotateAngle delegalja', () => {
      service.setRotateAngle(5);
      expect(effectsService.setRotateAngle).toHaveBeenCalledWith(5);
    });

    it('toggleRotateRandom delegalja', () => {
      service.toggleRotateRandom();
      expect(effectsService.toggleRotateRandom).toHaveBeenCalled();
    });

    it('setBorderRadius delegalja', () => {
      service.setBorderRadius(20);
      expect(effectsService.setBorderRadius).toHaveBeenCalledWith(20);
    });

    it('applyRotateSelected delegalja', async () => {
      await service.applyRotateSelected();
      expect(effectsService.applyRotateSelected).toHaveBeenCalled();
    });

    it('applyBorderRadiusSelected delegalja', async () => {
      await service.applyBorderRadiusSelected();
      expect(effectsService.applyBorderRadiusSelected).toHaveBeenCalled();
    });

    it('alignTopOnly delegalja', async () => {
      await service.alignTopOnly();
      expect(effectsService.alignTopOnly).toHaveBeenCalled();
    });

    it('measureGridGaps delegalja', async () => {
      await service.measureGridGaps();
      expect(effectsService.measureGridGaps).toHaveBeenCalled();
    });

    it('executeCenterSelected delegalja', async () => {
      await service.executeCenterSelected();
      expect(effectsService.executeCenterSelected).toHaveBeenCalled();
    });

    it('toggleGridUnit delegalja', () => {
      service.toggleGridUnit();
      expect(effectsService.toggleGridUnit).toHaveBeenCalled();
    });

    it('setGridGapHFromDisplay delegalja', () => {
      service.setGridGapHFromDisplay(5);
      expect(effectsService.setGridGapHFromDisplay).toHaveBeenCalledWith(5);
    });

    it('setGridGapVFromDisplay delegalja', () => {
      service.setGridGapVFromDisplay(3);
      expect(effectsService.setGridGapVFromDisplay).toHaveBeenCalledWith(3);
    });

    it('setGridGapFromDisplay delegalja', () => {
      service.setGridGapFromDisplay(10);
      expect(effectsService.setGridGapFromDisplay).toHaveBeenCalledWith(10);
    });
  });

  // ============================================================================
  describe('setProjectIdResolver', () => {
    it('beallitja a project ID resolver-t amit a forceRefreshPersons hasznal', async () => {
      service.setProjectIdResolver(() => 99);
      projectService.getLastProjectId.mockReturnValue(null);
      projectService.fetchPersons.mockResolvedValue([createPerson()]);

      service.onAction('refresh-labels', 'all');
      await service.confirmAction();

      expect(projectService.fetchPersons).toHaveBeenCalledWith(99);
    });
  });

  // ============================================================================
  describe('link akcio target szurese', () => {
    it('all target eseten az osszes nevet hasznalja', async () => {
      psService.getImageLayerData.mockResolvedValue({
        names: ['a---1', 'b---2'],
        students: ['a---1'],
        teachers: ['b---2'],
      });
      psService.runJsx.mockResolvedValue({ output: '{"linked": 2, "names": ["a","b"]}' });
      service.onAction('link', 'all');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'link-layers',
        'actions/link-selected.jsx',
        { LAYER_NAMES: 'a---1|b---2' },
      );
    });

    it('teachers target eseten csak a tanarokat hasznalja', async () => {
      psService.getImageLayerData.mockResolvedValue({
        names: ['a---1', 'b---2'],
        students: ['a---1'],
        teachers: ['b---2'],
      });
      psService.runJsx.mockResolvedValue({ output: '{"linked": 1, "names": ["b"]}' });
      service.onAction('link', 'teachers');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'link-layers',
        'actions/link-selected.jsx',
        { LAYER_NAMES: 'b---2' },
      );
    });

    it('students target eseten csak a diakokat hasznalja', async () => {
      psService.getImageLayerData.mockResolvedValue({
        names: ['a---1', 'b---2'],
        students: ['a---1'],
        teachers: ['b---2'],
      });
      psService.runJsx.mockResolvedValue({ output: '{"linked": 1, "names": ["a"]}' });
      service.onAction('link', 'students');

      await service.confirmAction();

      expect(psService.runJsx).toHaveBeenCalledWith(
        'link-layers',
        'actions/link-selected.jsx',
        { LAYER_NAMES: 'a---1' },
      );
    });

    it('ures layerek eseten hibauzenet', async () => {
      psService.getImageLayerData.mockResolvedValue({ names: [], students: [], teachers: [] });
      service.onAction('link', 'all');

      await service.confirmAction();

      expect(effectsService.setResult).toHaveBeenCalledWith(false, expect.stringContaining('layerek'));
    });
  });

  // ============================================================================
  describe('position-labels tipus validacio', () => {
    it('sem nevek sem poziciok kivalasztva eseten hibauzenet', async () => {
      service.positionNames.set(false);
      service.positionPositions.set(false);
      service.onAction('position-labels', 'all');

      await service.confirmAction();

      expect(effectsService.setResult).toHaveBeenCalledWith(false, 'Válassz típust (Nevek és/vagy Pozíciók)');
    });
  });
});
