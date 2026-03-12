import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OverlayDragOrderService } from './overlay-drag-order.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayDragGroupsService } from './overlay-drag-groups.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

/**
 * overlay-drag-order.service – 2. rész
 * Rendezés, drag & drop, csoportok, mentés, egyedi sorrend, refreshFromDb
 */
describe('OverlayDragOrderService – actions', () => {
  let service: OverlayDragOrderService;
  let httpTesting: HttpTestingController;

  let projectServiceMock: {
    persons: ReturnType<typeof vi.fn>;
    fetchPersons: ReturnType<typeof vi.fn>;
  };
  let psServiceMock: {
    getImageDataCombined: ReturnType<typeof vi.fn>;
    getPositionsTextContent: ReturnType<typeof vi.fn>;
  };
  let sortServiceMock: {
    reorderLayersByNamesScoped: ReturnType<typeof vi.fn>;
    slugToHumanName: ReturnType<typeof vi.fn>;
  };
  let pollingMock: { activeDoc: ReturnType<typeof vi.fn> };
  let loggerMock: { error: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
  let groupsServiceMock: {
    groups: ReturnType<typeof vi.fn>;
    ungrouped: ReturnType<typeof vi.fn>;
    hasGroups: ReturnType<typeof vi.fn>;
    configure: ReturnType<typeof vi.fn>;
    loadFromJson: ReturnType<typeof vi.fn>;
    saveToJson: ReturnType<typeof vi.fn>;
    buildFlatList: ReturnType<typeof vi.fn>;
    sortItems: ReturnType<typeof vi.fn>;
    applyReorderedItems: ReturnType<typeof vi.fn>;
    rebuildFlatList: ReturnType<typeof vi.fn>;
    createGroup: ReturnType<typeof vi.fn>;
    createGroupFromSelection: ReturnType<typeof vi.fn>;
    removeGroup: ReturnType<typeof vi.fn>;
    renameGroup: ReturnType<typeof vi.fn>;
    toggleGroupCollapse: ReturnType<typeof vi.fn>;
    moveGroup: ReturnType<typeof vi.fn>;
    onDropToGroup: ReturnType<typeof vi.fn>;
    onDropToUngrouped: ReturnType<typeof vi.fn>;
  };

  const makePerson = (id: number, name: string, type: 'student' | 'teacher' = 'student', title: string | null = null): PersonItem => ({
    id, name, title, type, hasPhoto: false, photoThumbUrl: null, photoUrl: null, archiveId: null, linkedGroup: null,
  });

  beforeEach(() => {
    projectServiceMock = {
      persons: vi.fn().mockReturnValue([]),
      fetchPersons: vi.fn().mockResolvedValue([]),
    };
    psServiceMock = {
      getImageDataCombined: vi.fn().mockResolvedValue({
        names: [], studentNames: [], teacherNames: [], students: [], teachers: [],
      }),
      getPositionsTextContent: vi.fn().mockResolvedValue(new Map()),
    };
    sortServiceMock = {
      reorderLayersByNamesScoped: vi.fn().mockResolvedValue(null),
      slugToHumanName: vi.fn((slug: string) => {
        const withoutId = slug.replace(/---\d+$/, '');
        return withoutId.split(/[-_]/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }),
    };
    pollingMock = {
      activeDoc: vi.fn().mockReturnValue({ name: null, path: null, dir: null }),
    };
    loggerMock = { error: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn() };

    const groupsSignal = vi.fn().mockReturnValue([]);
    const ungroupedSignal = vi.fn().mockReturnValue([]);
    const hasGroupsSignal = vi.fn().mockReturnValue(false);

    groupsServiceMock = {
      groups: Object.assign(groupsSignal, { set: vi.fn() }),
      ungrouped: Object.assign(ungroupedSignal, { set: vi.fn() }),
      hasGroups: hasGroupsSignal,
      configure: vi.fn(),
      loadFromJson: vi.fn().mockResolvedValue(undefined),
      saveToJson: vi.fn().mockResolvedValue(undefined),
      buildFlatList: vi.fn().mockReturnValue([]),
      sortItems: vi.fn(),
      applyReorderedItems: vi.fn(),
      rebuildFlatList: vi.fn(),
      createGroup: vi.fn(),
      createGroupFromSelection: vi.fn(),
      removeGroup: vi.fn(),
      renameGroup: vi.fn(),
      toggleGroupCollapse: vi.fn(),
      moveGroup: vi.fn(),
      onDropToGroup: vi.fn(),
      onDropToUngrouped: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OverlayDragOrderService,
        { provide: OverlayProjectService, useValue: projectServiceMock },
        { provide: OverlayPhotoshopService, useValue: psServiceMock },
        { provide: OverlaySortService, useValue: sortServiceMock },
        { provide: OverlayPollingService, useValue: pollingMock },
        { provide: OverlayDragGroupsService, useValue: groupsServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(OverlayDragOrderService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ============================================================================
  // Rendezés: sortAbc
  // ============================================================================
  describe('sortAbc', () => {
    it('groupsService.sortItems-et hívja', () => {
      service.sortAbc();
      expect(groupsServiceMock.sortItems).toHaveBeenCalledOnce();
    });
  });

  // ============================================================================
  // Rendezés: sortLeadership
  // ============================================================================
  describe('sortLeadership', () => {
    it('groupsService.sortItems-et hívja vezetői prioritással', () => {
      service.sortLeadership();
      expect(groupsServiceMock.sortItems).toHaveBeenCalledOnce();
    });
  });

  // ============================================================================
  // Rendezés: sortClassTeachersLast
  // ============================================================================
  describe('sortClassTeachersLast', () => {
    it('groupsService.sortItems-et hívja', () => {
      service.sortClassTeachersLast();
      expect(groupsServiceMock.sortItems).toHaveBeenCalledOnce();
    });
  });

  // ============================================================================
  // Rendezés: sortGender
  // ============================================================================
  describe('sortGender', () => {
    it('nem fut le ha kevesebb mint 2 elem van', async () => {
      groupsServiceMock.buildFlatList.mockReturnValue([makePerson(1, 'Anna')]);
      await service.sortGender();
      expect(service.genderLoading()).toBe(false);
    });

    it('nem fut le ha genderLoading true', async () => {
      service.genderLoading.set(true);
      groupsServiceMock.buildFlatList.mockReturnValue([makePerson(1, 'A'), makePerson(2, 'B')]);
      await service.sortGender();
      httpTesting.expectNone(`${environment.apiUrl}/partner/ai/classify-name-genders`);
    });

    it('HTTP hívást indít és rendezi a neveket', async () => {
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
        makePerson(3, 'Csilla'),
        makePerson(4, 'Dávid'),
      ]);
      groupsServiceMock.groups.mockReturnValue([]);
      groupsServiceMock.ungrouped.mockReturnValue([
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
        makePerson(3, 'Csilla'),
        makePerson(4, 'Dávid'),
      ]);

      const promise = service.sortGender();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/ai/classify-name-genders`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.names).toEqual(['Anna', 'Béla', 'Csilla', 'Dávid']);
      req.flush({
        success: true,
        classifications: [
          { name: 'Anna', gender: 'girl' },
          { name: 'Béla', gender: 'boy' },
          { name: 'Csilla', gender: 'girl' },
          { name: 'Dávid', gender: 'boy' },
        ],
      });

      await promise;
      expect(service.genderLoading()).toBe(false);
    });
  });

  // ============================================================================
  // Drag & Drop: onDrop (flat lista)
  // ============================================================================
  describe('onDrop', () => {
    it('egyetlen elem áthelyezése', () => {
      const items = [makePerson(1, 'Anna'), makePerson(2, 'Béla'), makePerson(3, 'Csaba')];
      service.list.set(items);

      const event = { previousIndex: 0, currentIndex: 2, item: { data: items[0] } } as any;
      service.onDrop(event);

      const names = service.list().map(i => i.name);
      expect(names).toEqual(['Béla', 'Csaba', 'Anna']);
    });

    it('multi-select drag: kijelölt elemeket együtt mozgatja', () => {
      const items = [
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
        makePerson(3, 'Csaba'),
        makePerson(4, 'Dani'),
      ];
      service.list.set(items);
      service.selected.set(new Set([1, 3]));

      const event = { previousIndex: 0, currentIndex: 3, item: { data: items[0] } } as any;
      service.onDrop(event);

      const names = service.list().map(i => i.name);
      expect(names[0]).toBe('Béla');
      expect(names[1]).toBe('Dani');
      expect(names).toContain('Anna');
      expect(names).toContain('Csaba');
    });
  });

  // ============================================================================
  // Csoport delegálás
  // ============================================================================
  describe('csoport delegálás', () => {
    it('createGroup delegál groupsService-hez', () => {
      service.createGroup('Teszt');
      expect(groupsServiceMock.createGroup).toHaveBeenCalledWith('Teszt');
    });

    it('createGroupFromSelection delegál és reseteli selected-et', () => {
      service.selected.set(new Set([1, 2]));
      service.createGroupFromSelection('G');
      expect(groupsServiceMock.createGroupFromSelection).toHaveBeenCalledWith('G', new Set([1, 2]));
      expect(service.selected().size).toBe(0);
    });

    it('removeGroup delegál', () => {
      service.removeGroup('g1');
      expect(groupsServiceMock.removeGroup).toHaveBeenCalledWith('g1');
    });

    it('renameGroup delegál', () => {
      service.renameGroup('g1', 'Új Név');
      expect(groupsServiceMock.renameGroup).toHaveBeenCalledWith('g1', 'Új Név');
    });

    it('toggleGroupCollapse delegál', () => {
      service.toggleGroupCollapse('g1');
      expect(groupsServiceMock.toggleGroupCollapse).toHaveBeenCalledWith('g1');
    });

    it('moveGroup delegál', () => {
      service.moveGroup('g1', -1);
      expect(groupsServiceMock.moveGroup).toHaveBeenCalledWith('g1', -1);
    });
  });

  // ============================================================================
  // Mentés (save)
  // ============================================================================
  describe('save', () => {
    it('nem csinál semmit ha nincs projectId', async () => {
      service.setProjectIdResolver(() => null);
      await service.save();
      expect(service.saving()).toBe(false);
    });

    it('nem csinál semmit ha üres lista', async () => {
      service.setProjectIdResolver(() => 123);
      groupsServiceMock.buildFlatList.mockReturnValue([]);
      await service.save();
      expect(service.saving()).toBe(false);
    });

    it('HTTP PATCH hívást küld a pozíciókkal', async () => {
      service.setProjectIdResolver(() => 123);
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
      ]);

      const promise = service.save();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/projects/123/persons/reorder`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.positions).toEqual([
        { id: 1, position: 1 },
        { id: 2, position: 2 },
      ]);
      req.flush({ success: true });

      await promise;
      expect(service.panelOpen()).toBe(false);
    });

    it('negatív id-jú (placeholder) elemeket kihagyja a HTTP hívásból', async () => {
      service.setProjectIdResolver(() => 123);
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(-1, 'Placeholder'),
        makePerson(1, 'Anna'),
      ]);

      const promise = service.save();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/projects/123/persons/reorder`);
      expect(req.request.body.positions).toEqual([{ id: 1, position: 1 }]);
      req.flush({ success: true });

      await promise;
    });
  });

  // ============================================================================
  // Egyedi sorrend (custom order)
  // ============================================================================
  describe('toggleCustomOrder', () => {
    it('toggleCustomOrder nyit és zár', () => {
      expect(service.customOrderOpen()).toBe(false);
      service.toggleCustomOrder();
      expect(service.customOrderOpen()).toBe(true);
      service.toggleCustomOrder();
      expect(service.customOrderOpen()).toBe(false);
    });

    it('bezáráskor reseteli a result-ot', () => {
      service.customOrderOpen.set(true);
      service.customOrderResult.set({ success: true, message: 'ok' });
      service.toggleCustomOrder();
      expect(service.customOrderResult()).toBeNull();
    });
  });

  describe('closeCustomOrder', () => {
    it('bezárja és reseteli a result-ot', () => {
      service.customOrderOpen.set(true);
      service.customOrderResult.set({ success: true, message: 'ok' });
      service.closeCustomOrder();
      expect(service.customOrderOpen()).toBe(false);
      expect(service.customOrderResult()).toBeNull();
    });
  });

  describe('submitCustomOrder', () => {
    it('nem csinál semmit ha üres szöveg', async () => {
      service.customOrderText.set('   ');
      await service.submitCustomOrder();
      expect(service.customOrderLoading()).toBe(false);
    });

    it('nem csinál semmit ha customOrderLoading true', async () => {
      service.customOrderText.set('valami');
      service.customOrderLoading.set(true);
      await service.submitCustomOrder();
      httpTesting.expectNone(`${environment.apiUrl}/partner/ai/match-custom-order`);
    });

    it('hibaüzenetet ad ha kevesebb mint 2 elem', async () => {
      service.customOrderText.set('test text');
      groupsServiceMock.buildFlatList.mockReturnValue([makePerson(1, 'Anna')]);
      await service.submitCustomOrder();
      const result = service.customOrderResult();
      expect(result?.success).toBe(false);
      expect(result?.message).toContain('2 személy');
    });

    it('sikeres API hívás után rendez', async () => {
      service.customOrderText.set('Béla, Anna');
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
      ]);

      const promise = service.submitCustomOrder();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, ordered_names: ['Béla', 'Anna'], unmatched: [] });

      await promise;
      expect(groupsServiceMock.applyReorderedItems).toHaveBeenCalled();
      expect(service.customOrderResult()?.success).toBe(true);
      expect(service.customOrderLoading()).toBe(false);
    });

    it('API hiba esetén hibaüzenetet ad', async () => {
      service.customOrderText.set('test');
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(1, 'A'),
        makePerson(2, 'B'),
      ]);

      const promise = service.submitCustomOrder();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.error(new ProgressEvent('error'));

      await promise;
      expect(service.customOrderResult()?.success).toBe(false);
      expect(service.customOrderLoading()).toBe(false);
    });

    it('unmatched nevek száma megjelenik az üzenetben', async () => {
      service.customOrderText.set('test');
      groupsServiceMock.buildFlatList.mockReturnValue([
        makePerson(1, 'Anna'),
        makePerson(2, 'Béla'),
      ]);

      const promise = service.submitCustomOrder();

      const req = httpTesting.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.flush({ success: true, ordered_names: ['Anna'], unmatched: ['Ismeretlen'] });

      await promise;
      expect(service.customOrderResult()?.message).toContain('1 nem párosított');
    });
  });

  // ============================================================================
  // refreshFromDb
  // ============================================================================
  describe('refreshFromDb', () => {
    it('nem csinál semmit ha nincs projectId', async () => {
      service.setProjectIdResolver(() => null);
      await service.refreshFromDb();
      expect(projectServiceMock.fetchPersons).not.toHaveBeenCalled();
    });

    it('refreshing state-et kezeli', async () => {
      service.setProjectIdResolver(() => 123);
      let wasTrueWhileRunning = false;
      projectServiceMock.fetchPersons.mockImplementation(async () => {
        wasTrueWhileRunning = service.refreshing();
        return [];
      });

      await service.refreshFromDb();
      expect(wasTrueWhileRunning).toBe(true);
      expect(service.refreshing()).toBe(false);
    });
  });
});
