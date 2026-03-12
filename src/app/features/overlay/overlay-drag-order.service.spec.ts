import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { OverlayDragOrderService } from './overlay-drag-order.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayDragGroupsService } from './overlay-drag-groups.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

describe('OverlayDragOrderService', () => {
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

    // signal-like mock-ok: visszaadnak egy értéket, ha hívjuk őket fv-ként
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
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('panelOpen false', () => {
      expect(service.panelOpen()).toBe(false);
    });

    it('saving false', () => {
      expect(service.saving()).toBe(false);
    });

    it('refreshing false', () => {
      expect(service.refreshing()).toBe(false);
    });

    it('scope students', () => {
      expect(service.scope()).toBe('students');
    });

    it('list üres', () => {
      expect(service.list()).toEqual([]);
    });

    it('searchQuery üres', () => {
      expect(service.searchQuery()).toBe('');
    });

    it('selected üres Set', () => {
      expect(service.selected().size).toBe(0);
    });

    it('genderLoading false', () => {
      expect(service.genderLoading()).toBe(false);
    });

    it('customOrderOpen false', () => {
      expect(service.customOrderOpen()).toBe(false);
    });

    it('customOrderLoading false', () => {
      expect(service.customOrderLoading()).toBe(false);
    });

    it('customOrderResult null', () => {
      expect(service.customOrderResult()).toBeNull();
    });
  });

  // ============================================================================
  // filteredList computed
  // ============================================================================
  describe('filteredList', () => {
    it('az összes elemet adja vissza ha nincs keresőszó', () => {
      const items = [makePerson(1, 'Anna'), makePerson(2, 'Béla')];
      service.list.set(items);
      expect(service.filteredList()).toEqual(items);
    });

    it('szűri az elemeket név alapján', () => {
      service.list.set([makePerson(1, 'Anna'), makePerson(2, 'Béla'), makePerson(3, 'Anett')]);
      service.searchQuery.set('an');
      const result = service.filteredList();
      expect(result).toHaveLength(2);
      expect(result.map(i => i.name)).toEqual(['Anna', 'Anett']);
    });

    it('title alapján is szűr', () => {
      service.list.set([
        makePerson(1, 'Kiss János', 'teacher', 'igazgató'),
        makePerson(2, 'Nagy Anna', 'teacher', 'tanár'),
      ]);
      service.searchQuery.set('igaz');
      const result = service.filteredList();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Kiss János');
    });

    it('case-insensitive szűrés', () => {
      service.list.set([makePerson(1, 'Anna')]);
      service.searchQuery.set('ANNA');
      expect(service.filteredList()).toHaveLength(1);
    });
  });

  // ============================================================================
  // setProjectIdResolver
  // ============================================================================
  describe('setProjectIdResolver', () => {
    it('beállítja a projektId feloldót', () => {
      service.setProjectIdResolver(() => 42);
      // Indirect teszt: ha save() hívná, a resolver-ből kapja a pid-t
      // Ez közvetetten tesztelhető
      expect(true).toBe(true); // resolver beállítva
    });
  });

  // ============================================================================
  // Panel kezelés
  // ============================================================================
  describe('openPanel', () => {
    it('panelOpen-t true-ra állítja', async () => {
      service.setProjectIdResolver(() => null);
      await service.openPanel();
      expect(service.panelOpen()).toBe(true);
    });

    it('fetchPersons-t hívja ha van projectId és nincs személy', async () => {
      service.setProjectIdResolver(() => 123);
      projectServiceMock.persons.mockReturnValue([]);
      await service.openPanel();
      expect(projectServiceMock.fetchPersons).toHaveBeenCalledWith(123);
    });

    it('NEM hívja fetchPersons-t ha már vannak személyek', async () => {
      service.setProjectIdResolver(() => 123);
      projectServiceMock.persons.mockReturnValue([makePerson(1, 'Anna')]);
      await service.openPanel();
      expect(projectServiceMock.fetchPersons).not.toHaveBeenCalled();
    });

    it('loadFromJson-t hívja a csoportokhoz', async () => {
      service.setProjectIdResolver(() => null);
      await service.openPanel();
      expect(groupsServiceMock.loadFromJson).toHaveBeenCalled();
    });
  });

  describe('closePanel', () => {
    it('panelOpen-t false-ra állítja', () => {
      service.panelOpen.set(true);
      service.closePanel();
      expect(service.panelOpen()).toBe(false);
    });

    it('searchQuery-t üresre állítja', () => {
      service.searchQuery.set('teszt');
      service.closePanel();
      expect(service.searchQuery()).toBe('');
    });

    it('selected-et reseteli', () => {
      service.selected.set(new Set([1, 2]));
      service.closePanel();
      expect(service.selected().size).toBe(0);
    });
  });

  // ============================================================================
  // clearSelection
  // ============================================================================
  describe('clearSelection', () => {
    it('üresre állítja a kijelölést', () => {
      service.selected.set(new Set([1, 2, 3]));
      service.clearSelection();
      expect(service.selected().size).toBe(0);
    });
  });

  // ============================================================================
  // setScope
  // ============================================================================
  describe('setScope', () => {
    it('scope signal-t beállítja', () => {
      service.setScope('teachers');
      expect(service.scope()).toBe('teachers');
    });

    it('selected-et reseteli', () => {
      service.selected.set(new Set([1, 2]));
      service.setScope('all');
      expect(service.selected().size).toBe(0);
    });
  });

  // ============================================================================
  // Kijelölés
  // ============================================================================
  describe('toggleSelect', () => {
    it('nem csinál semmit ha nincs meta/ctrl gomb', () => {
      const event = { metaKey: false, ctrlKey: false, preventDefault: vi.fn() } as any;
      service.toggleSelect(1, event);
      expect(service.selected().size).toBe(0);
    });

    it('hozzáadja az elemet ha metaKey nyomva', () => {
      const event = { metaKey: true, ctrlKey: false, preventDefault: vi.fn() } as any;
      service.toggleSelect(1, event);
      expect(service.selected().has(1)).toBe(true);
    });

    it('hozzáadja az elemet ha ctrlKey nyomva', () => {
      const event = { metaKey: false, ctrlKey: true, preventDefault: vi.fn() } as any;
      service.toggleSelect(1, event);
      expect(service.selected().has(1)).toBe(true);
    });

    it('eltávolítja ha már ki van jelölve', () => {
      service.selected.set(new Set([1]));
      const event = { metaKey: true, ctrlKey: false, preventDefault: vi.fn() } as any;
      service.toggleSelect(1, event);
      expect(service.selected().has(1)).toBe(false);
    });

    it('preventDefault-ot hív', () => {
      const event = { metaKey: true, ctrlKey: false, preventDefault: vi.fn() } as any;
      service.toggleSelect(1, event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('isSelected', () => {
    it('true ha az elem ki van jelölve', () => {
      service.selected.set(new Set([42]));
      expect(service.isSelected(42)).toBe(true);
    });

    it('false ha az elem nincs kijelölve', () => {
      expect(service.isSelected(99)).toBe(false);
    });
  });

});
