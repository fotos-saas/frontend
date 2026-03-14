import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
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

describe('OverlayQuickActionsService', () => {
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
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('panelOpen false', () => {
      expect(service.panelOpen()).toBe(false);
    });

    it('refreshNames true, refreshPositions false', () => {
      expect(service.refreshNames()).toBe(true);
      expect(service.refreshPositions()).toBe(false);
    });

    it('positionNames true, positionPositions false', () => {
      expect(service.positionNames()).toBe(true);
      expect(service.positionPositions()).toBe(false);
    });

    it('confirm null', () => {
      expect(service.confirm()).toBeNull();
    });

    it('loading false', () => {
      expect(service.loading()).toBe(false);
    });

    it('reorderTarget all', () => {
      expect(service.reorderTarget()).toBe('all');
    });

    it('specPanelOpen false', () => {
      expect(service.specPanelOpen()).toBe(false);
    });
  });

  // ============================================================================
  // Panel kezeles
  // ============================================================================
  describe('panel kezeles', () => {
    it('togglePanel megforditja a panelOpen-t', () => {
      expect(service.panelOpen()).toBe(false);
      service.togglePanel();
      expect(service.panelOpen()).toBe(true);
      service.togglePanel();
      expect(service.panelOpen()).toBe(false);
    });

    it('togglePanel bezarja a gridPanel-t es rotatePanel-t', () => {
      service.togglePanel();
      expect(effectsService.gridPanelOpen.set).toHaveBeenCalledWith(false);
      expect(effectsService.rotatePanelOpen.set).toHaveBeenCalledWith(false);
    });

    it('closePanel false-ra allitja a panelOpen-t', () => {
      service.panelOpen.set(true);
      service.closePanel();
      expect(service.panelOpen()).toBe(false);
    });

    it('toggleSpecPanel megforditja a specPanelOpen-t', () => {
      expect(service.specPanelOpen()).toBe(false);
      service.toggleSpecPanel();
      expect(service.specPanelOpen()).toBe(true);
    });

    it('toggleSpecPanel bezarja a tobbi panelt', () => {
      service.panelOpen.set(true);
      service.toggleSpecPanel();
      expect(service.panelOpen()).toBe(false);
    });

    it('closeSpecPanel false-ra allitja', () => {
      service.specPanelOpen.set(true);
      service.closeSpecPanel();
      expect(service.specPanelOpen()).toBe(false);
    });

    it('toggleGridPanel delegalja az effects service-nek', () => {
      service.toggleGridPanel();
      expect(effectsService.toggleGridPanel).toHaveBeenCalled();
    });

    it('closeGridPanel delegalja az effects service-nek', () => {
      service.closeGridPanel();
      expect(effectsService.closeGridPanel).toHaveBeenCalled();
    });

    it('toggleRotatePanel delegalja az effects service-nek', () => {
      service.toggleRotatePanel();
      expect(effectsService.toggleRotatePanel).toHaveBeenCalled();
    });

    it('closeRotatePanel delegalja az effects service-nek', () => {
      service.closeRotatePanel();
      expect(effectsService.closeRotatePanel).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // toggleType
  // ============================================================================
  describe('toggleType', () => {
    it('refresh names toggle', () => {
      expect(service.refreshNames()).toBe(true);
      service.toggleType('refresh', 'names');
      expect(service.refreshNames()).toBe(false);
    });

    it('refresh positions toggle', () => {
      expect(service.refreshPositions()).toBe(false);
      service.toggleType('refresh', 'positions');
      expect(service.refreshPositions()).toBe(true);
    });

    it('position names toggle', () => {
      expect(service.positionNames()).toBe(true);
      service.toggleType('position', 'names');
      expect(service.positionNames()).toBe(false);
    });

    it('position positions toggle', () => {
      expect(service.positionPositions()).toBe(false);
      service.toggleType('position', 'positions');
      expect(service.positionPositions()).toBe(true);
    });
  });

  // ============================================================================
  // onAction / cancelAction
  // ============================================================================
  describe('onAction / cancelAction', () => {
    it('onAction beallitja a confirm signal-t', () => {
      service.onAction('link', 'all');
      expect(service.confirm()).toEqual({ action: 'link', target: 'all' });
    });

    it('cancelAction null-ra allitja a confirm-ot', () => {
      service.onAction('link', 'all');
      service.cancelAction();
      expect(service.confirm()).toBeNull();
    });
  });

});
