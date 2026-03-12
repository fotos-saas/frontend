import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { OverlayDragGroupsService, DragOrderGroup, GROUP_COLORS } from './overlay-drag-groups.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySortService } from './overlay-sort.service';
import { LoggerService } from '../../core/services/logger.service';
import { PersonItem } from './overlay-project.service';

describe('OverlayDragGroupsService', () => {
  let service: OverlayDragGroupsService;
  let pollingMock: { activeDoc: ReturnType<typeof vi.fn> };
  let sortServiceMock: { slugToHumanName: ReturnType<typeof vi.fn> };
  let loggerMock: { error: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
  let flatList: PersonItem[];
  let personSlugMap: Map<number, string>;

  const makePerson = (id: number, name: string, type: 'student' | 'teacher' = 'student'): PersonItem => ({
    id, name, title: null, type, hasPhoto: false, photoThumbUrl: null, photoUrl: null, archiveId: null, linkedGroup: null,
  });

  beforeEach(() => {
    flatList = [];
    personSlugMap = new Map();

    pollingMock = {
      activeDoc: vi.fn().mockReturnValue({ name: null, path: null, dir: null }),
    };
    sortServiceMock = {
      slugToHumanName: vi.fn((slug: string) => slug),
    };
    loggerMock = { error: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        OverlayDragGroupsService,
        { provide: OverlayPollingService, useValue: pollingMock },
        { provide: OverlaySortService, useValue: sortServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(OverlayDragGroupsService);

    // Configure a service-t (ahogy az OverlayDragOrderService csinálja)
    service.configure({
      personSlugMap,
      listSetter: items => { flatList = items; },
      listGetter: () => flatList,
      scopeGetter: () => 'students',
    });
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('groups üres tömb', () => {
      expect(service.groups()).toEqual([]);
    });

    it('ungrouped üres tömb', () => {
      expect(service.ungrouped()).toEqual([]);
    });

    it('hasGroups false', () => {
      expect(service.hasGroups()).toBe(false);
    });
  });

  // ============================================================================
  // GROUP_COLORS
  // ============================================================================
  describe('GROUP_COLORS', () => {
    it('8 szín van definiálva', () => {
      expect(GROUP_COLORS).toHaveLength(8);
    });

    it('minden szín # jellel kezdődik', () => {
      GROUP_COLORS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    });
  });

  // ============================================================================
  // buildFlatList
  // ============================================================================
  describe('buildFlatList', () => {
    it('csoportok + ungrouped elemeket adja vissza sorrendben', () => {
      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      const p3 = makePerson(3, 'Csaba');

      service.groups.set([{ id: 'g1', name: 'Csoport1', colorIndex: 0, collapsed: false, items: [p1] }]);
      service.ungrouped.set([p2, p3]);

      const flat = service.buildFlatList();
      expect(flat).toEqual([p1, p2, p3]);
    });

    it('üres lista ha nincs elem', () => {
      expect(service.buildFlatList()).toEqual([]);
    });
  });

  // ============================================================================
  // rebuildFlatList
  // ============================================================================
  describe('rebuildFlatList', () => {
    it('a listSetter-t hívja a flat listával', () => {
      const p1 = makePerson(1, 'Anna');
      service.ungrouped.set([p1]);

      service.rebuildFlatList();
      expect(flatList).toEqual([p1]);
    });
  });

  // ============================================================================
  // createGroup
  // ============================================================================
  describe('createGroup', () => {
    it('új üres csoportot hoz létre', () => {
      service.createGroup('Teszt Csoport');
      expect(service.groups()).toHaveLength(1);
      expect(service.groups()[0].name).toBe('Teszt Csoport');
      expect(service.groups()[0].items).toEqual([]);
      expect(service.groups()[0].collapsed).toBe(false);
    });

    it('hasGroups true-ra vált', () => {
      service.createGroup('Teszt');
      expect(service.hasGroups()).toBe(true);
    });

    it('colorIndex-et növeli ciklikusan', () => {
      service.createGroup('A');
      service.createGroup('B');
      expect(service.groups()[0].colorIndex).toBe(0);
      expect(service.groups()[1].colorIndex).toBe(1);
    });
  });

  // ============================================================================
  // createGroupFromSelection
  // ============================================================================
  describe('createGroupFromSelection', () => {
    it('kijelölt elemeket áthelyezi az új csoportba', () => {
      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      const p3 = makePerson(3, 'Csaba');
      service.ungrouped.set([p1, p2, p3]);

      service.createGroupFromSelection('Új Csoport', new Set([1, 3]));

      expect(service.groups()).toHaveLength(1);
      expect(service.groups()[0].items.map(i => i.name)).toEqual(['Anna', 'Csaba']);
      expect(service.ungrouped().map(i => i.name)).toEqual(['Béla']);
    });

    it('nem csinál semmit üres szelekciónál', () => {
      service.ungrouped.set([makePerson(1, 'Anna')]);
      service.createGroupFromSelection('Teszt', new Set());
      expect(service.groups()).toHaveLength(0);
    });

    it('csoportokból is kiemeli az elemeket', () => {
      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      service.groups.set([{ id: 'g1', name: 'Régi', colorIndex: 0, collapsed: false, items: [p1, p2] }]);

      service.createGroupFromSelection('Új', new Set([1]));
      expect(service.groups()).toHaveLength(2);
      expect(service.groups()[0].items.map(i => i.name)).toEqual(['Béla']);
      expect(service.groups()[1].items.map(i => i.name)).toEqual(['Anna']);
    });
  });

  // ============================================================================
  // removeGroup
  // ============================================================================
  describe('removeGroup', () => {
    it('elemeket visszateszi az ungrouped-ba', () => {
      const p1 = makePerson(1, 'Anna');
      service.groups.set([{ id: 'g1', name: 'Teszt', colorIndex: 0, collapsed: false, items: [p1] }]);

      service.removeGroup('g1');
      expect(service.groups()).toHaveLength(0);
      expect(service.ungrouped().map(i => i.name)).toContain('Anna');
    });

    it('nem csinál semmit nem létező id-nál', () => {
      service.groups.set([{ id: 'g1', name: 'Teszt', colorIndex: 0, collapsed: false, items: [] }]);
      service.removeGroup('g99');
      expect(service.groups()).toHaveLength(1);
    });
  });

  // ============================================================================
  // renameGroup
  // ============================================================================
  describe('renameGroup', () => {
    it('csoport nevét módosítja', () => {
      service.groups.set([{ id: 'g1', name: 'Régi', colorIndex: 0, collapsed: false, items: [] }]);
      service.renameGroup('g1', 'Új Név');
      expect(service.groups()[0].name).toBe('Új Név');
    });
  });

  // ============================================================================
  // toggleGroupCollapse
  // ============================================================================
  describe('toggleGroupCollapse', () => {
    it('collapsed állapotot toggle-öli', () => {
      service.groups.set([{ id: 'g1', name: 'T', colorIndex: 0, collapsed: false, items: [] }]);
      service.toggleGroupCollapse('g1');
      expect(service.groups()[0].collapsed).toBe(true);
      service.toggleGroupCollapse('g1');
      expect(service.groups()[0].collapsed).toBe(false);
    });
  });

  // ============================================================================
  // moveGroup
  // ============================================================================
  describe('moveGroup', () => {
    it('csoportot felfelé mozgatja', () => {
      service.groups.set([
        { id: 'g1', name: 'Első', colorIndex: 0, collapsed: false, items: [] },
        { id: 'g2', name: 'Második', colorIndex: 1, collapsed: false, items: [] },
      ]);
      service.moveGroup('g2', -1);
      expect(service.groups()[0].id).toBe('g2');
      expect(service.groups()[1].id).toBe('g1');
    });

    it('csoportot lefelé mozgatja', () => {
      service.groups.set([
        { id: 'g1', name: 'Első', colorIndex: 0, collapsed: false, items: [] },
        { id: 'g2', name: 'Második', colorIndex: 1, collapsed: false, items: [] },
      ]);
      service.moveGroup('g1', 1);
      expect(service.groups()[0].id).toBe('g2');
      expect(service.groups()[1].id).toBe('g1');
    });

    it('nem mozgat ha a határ szélen van (felfelé az elsőt)', () => {
      service.groups.set([
        { id: 'g1', name: 'Első', colorIndex: 0, collapsed: false, items: [] },
        { id: 'g2', name: 'Második', colorIndex: 1, collapsed: false, items: [] },
      ]);
      service.moveGroup('g1', -1);
      expect(service.groups()[0].id).toBe('g1');
    });

    it('nem mozgat ha nem létező csoport', () => {
      service.groups.set([{ id: 'g1', name: 'E', colorIndex: 0, collapsed: false, items: [] }]);
      service.moveGroup('g99', 1);
      expect(service.groups()[0].id).toBe('g1');
    });
  });

  // ============================================================================
  // sortItems
  // ============================================================================
  describe('sortItems', () => {
    it('csoportokon belül és ungrouped-ban is rendez', () => {
      const p1 = makePerson(1, 'Csaba');
      const p2 = makePerson(2, 'Anna');
      const p3 = makePerson(3, 'Béla');
      const p4 = makePerson(4, 'Dani');
      service.groups.set([{ id: 'g1', name: 'G', colorIndex: 0, collapsed: false, items: [p1, p2] }]);
      service.ungrouped.set([p4, p3]);

      service.sortItems((a, b) => a.name.localeCompare(b.name, 'hu'));

      expect(service.groups()[0].items.map(i => i.name)).toEqual(['Anna', 'Csaba']);
      expect(service.ungrouped().map(i => i.name)).toEqual(['Béla', 'Dani']);
    });
  });

  // ============================================================================
  // applyReorderedItems
  // ============================================================================
  describe('applyReorderedItems', () => {
    it('csoportokat törli és minden elemet ungrouped-ba tesz', () => {
      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      service.groups.set([{ id: 'g1', name: 'G', colorIndex: 0, collapsed: false, items: [p1] }]);
      service.ungrouped.set([p2]);

      service.applyReorderedItems([p2, p1]);

      expect(service.groups()).toEqual([]);
      expect(service.ungrouped().map(i => i.name)).toEqual(['Béla', 'Anna']);
    });
  });

  // ============================================================================
  // loadFromJson
  // ============================================================================
  describe('loadFromJson', () => {
    it('ha nincs electronAPI, mindent ungrouped-ba tesz', async () => {
      delete (window as any).electronAPI;
      const items = [makePerson(1, 'Anna'), makePerson(2, 'Béla')];

      await service.loadFromJson(items);
      expect(service.ungrouped()).toHaveLength(2);
      expect(service.groups()).toHaveLength(0);
    });

    it('ha nincs psdPath, mindent ungrouped-ba tesz', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: null, path: null, dir: null });
      const items = [makePerson(1, 'Anna')];

      await service.loadFromJson(items);
      expect(service.ungrouped()).toHaveLength(1);
      expect(service.groups()).toHaveLength(0);
    });

    it('ha electronAPI elérhető de load nem sikerül, ungrouped-ba tesz', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' });
      (window as any).electronAPI = {
        photoshop: {
          loadDragOrder: vi.fn().mockResolvedValue({ success: false }),
        },
      };

      const items = [makePerson(1, 'Anna')];
      await service.loadFromJson(items);

      expect(service.ungrouped()).toHaveLength(1);
      expect(service.groups()).toHaveLength(0);
    });

    it('helyes JSON-ból visszaállítja a csoportokat', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' });

      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      const p3 = makePerson(3, 'Csaba');
      personSlugMap.set(1, 'anna---1');
      personSlugMap.set(2, 'bela---2');
      personSlugMap.set(3, 'csaba---3');

      (window as any).electronAPI = {
        photoshop: {
          loadDragOrder: vi.fn().mockResolvedValue({
            success: true,
            data: {
              version: 1,
              scope: 'students',
              groups: [{ id: 'g1', name: 'Csoport', colorIndex: 2, items: ['anna---1', 'bela---2'] }],
              ungrouped: ['csaba---3'],
            },
          }),
        },
      };

      await service.loadFromJson([p1, p2, p3]);

      expect(service.groups()).toHaveLength(1);
      expect(service.groups()[0].name).toBe('Csoport');
      expect(service.groups()[0].colorIndex).toBe(2);
      expect(service.groups()[0].items.map(i => i.name)).toEqual(['Anna', 'Béla']);
      expect(service.ungrouped().map(i => i.name)).toEqual(['Csaba']);
    });

    it('hiányzó elemeket (nem a slug map-ben) ungrouped végére teszi', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' });

      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      personSlugMap.set(1, 'anna---1');
      // p2-nek NINCS slug

      (window as any).electronAPI = {
        photoshop: {
          loadDragOrder: vi.fn().mockResolvedValue({
            success: true,
            data: {
              version: 1,
              scope: 'students',
              groups: [{ id: 'g1', name: 'G', colorIndex: 0, items: ['anna---1'] }],
              ungrouped: [],
            },
          }),
        },
      };

      await service.loadFromJson([p1, p2]);
      // p2-nek nincs slugja, tehát nem kerülhet csoportba, ungrouped végére kerül
      expect(service.ungrouped().map(i => i.name)).toContain('Béla');
    });
  });

  // ============================================================================
  // saveToJson
  // ============================================================================
  describe('saveToJson', () => {
    it('nem ment ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      await service.saveToJson(); // nem dob hibát
    });

    it('nem ment ha nincs psdPath', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: null, path: null, dir: null });
      (window as any).electronAPI = { photoshop: { saveDragOrder: vi.fn() } };

      await service.saveToJson();
      expect((window as any).electronAPI.photoshop.saveDragOrder).not.toHaveBeenCalled();
    });

    it('helyes JSON struktúrát ment', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' });

      const saveMock = vi.fn().mockResolvedValue({ success: true });
      (window as any).electronAPI = { photoshop: { saveDragOrder: saveMock } };

      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      personSlugMap.set(1, 'anna---1');
      personSlugMap.set(2, 'bela---2');

      service.groups.set([{ id: 'g1', name: 'Csoport', colorIndex: 0, collapsed: false, items: [p1] }]);
      service.ungrouped.set([p2]);

      await service.saveToJson();

      expect(saveMock).toHaveBeenCalledWith({
        psdPath: '/tmp/test.psd',
        dragOrderData: {
          version: 1,
          scope: 'students',
          groups: [{ id: 'g1', name: 'Csoport', colorIndex: 0, items: ['anna---1'] }],
          ungrouped: ['bela---2'],
        },
      });
    });

    it('hiba esetén logol de nem dob', async () => {
      pollingMock.activeDoc.mockReturnValue({ name: 'test.psd', path: '/tmp/test.psd', dir: '/tmp' });
      (window as any).electronAPI = {
        photoshop: { saveDragOrder: vi.fn().mockRejectedValue(new Error('save error')) },
      };

      await service.saveToJson();
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // onDropToUngrouped — egyszerű eset (same container, single item)
  // ============================================================================
  describe('onDropToUngrouped', () => {
    it('same container single item reorder', () => {
      const p1 = makePerson(1, 'Anna');
      const p2 = makePerson(2, 'Béla');
      const p3 = makePerson(3, 'Csaba');
      service.ungrouped.set([p1, p2, p3]);

      // Szimuláljuk a CDK drag drop event-et
      const mockContainer = { id: 'drag-group-ungrouped' } as any;
      const event = {
        previousContainer: mockContainer,
        container: mockContainer,
        previousIndex: 0,
        currentIndex: 2,
        item: { data: p1 },
      } as any;

      service.onDropToUngrouped(event, new Set());

      const names = service.ungrouped().map(i => i.name);
      expect(names[0]).toBe('Béla');
      expect(names[2]).toBe('Anna');
    });
  });
});
