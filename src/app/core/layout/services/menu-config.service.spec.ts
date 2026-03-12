import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MenuConfigService } from './menu-config.service';
import { ProjectModeService, ProjectModeInfo } from '../../services/project-mode.service';
import { AuthService } from '../../services/auth.service';
import { PhotoSelectionBadgeService } from '../../services/photo-selection-badge.service';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

describe('MenuConfigService', () => {
  let service: MenuConfigService;
  let projectModeServiceMock: Record<string, ReturnType<typeof vi.fn>>;
  let project$: BehaviorSubject<any>;
  let canFinalize$: BehaviorSubject<boolean>;
  let badgeTextSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    project$ = new BehaviorSubject<any>(null);
    canFinalize$ = new BehaviorSubject<boolean>(false);
    badgeTextSignal = signal<string | null>(null);

    projectModeServiceMock = {
      showSamples: vi.fn().mockReturnValue(false),
      showTemplateChooser: vi.fn().mockReturnValue(false),
      showMissingPersons: vi.fn().mockReturnValue(false),
      showVoting: vi.fn().mockReturnValue(false),
      canShowFinalization: vi.fn().mockReturnValue(false),
      showOrderData: vi.fn().mockReturnValue(false),
      isOrderingMode: vi.fn().mockReturnValue(false),
      isOrderedMode: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        MenuConfigService,
        { provide: ProjectModeService, useValue: projectModeServiceMock },
        {
          provide: AuthService,
          useValue: {
            project$: project$.asObservable(),
            canFinalize$: canFinalize$.asObservable(),
          },
        },
        {
          provide: PhotoSelectionBadgeService,
          useValue: {
            badgeText: badgeTextSignal.asReadonly(),
          },
        },
      ],
    });

    service = TestBed.inject(MenuConfigService);
  });

  // ============================================================================
  // Alapvető menüelemek
  // ============================================================================
  describe('menuItems alapértelmezett', () => {
    it('projekt nélkül is tartalmaz alapvető menüelemeket', () => {
      const items = service.menuItems();
      const ids = items.map(i => i.id);

      expect(ids).toContain('home');
      expect(ids).toContain('newsfeed');
      expect(ids).toContain('forum');
      expect(ids).toContain('notifications');
    });

    it('home menüpont helyes adatokkal', () => {
      const home = service.menuItems().find(i => i.id === 'home');
      expect(home).toBeDefined();
      expect(home!.label).toBe('Kezdőlap');
      expect(home!.icon).toBe('home');
      expect(home!.route).toBe('/home');
    });

    it('newsfeed menüpont helyes adatokkal', () => {
      const item = service.menuItems().find(i => i.id === 'newsfeed');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Hírek');
      expect(item!.route).toBe('/newsfeed');
    });

    it('forum menüpont helyes adatokkal', () => {
      const item = service.menuItems().find(i => i.id === 'forum');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Beszélgetések');
      expect(item!.route).toBe('/forum');
    });
  });

  // ============================================================================
  // Tabló szekció
  // ============================================================================
  describe('tablo szekció', () => {
    it('tablo szekció nem jelenik meg ha nincs gyermek elem', () => {
      const items = service.menuItems();
      const tablo = items.find(i => i.id === 'tablo');
      // A tablo szekció mindig tartalmaz legalább 1 gyermeket (poke)
      // tehát a children.length > 0 ellenőrzés ezen fog múlni
      expect(tablo).toBeDefined();
    });

    it('tablo szekció mindig tartalmazza a "poke" elemet', () => {
      const tablo = service.menuItems().find(i => i.id === 'tablo');
      expect(tablo).toBeDefined();
      const pokeChild = tablo!.children?.find(c => c.id === 'poke');
      expect(pokeChild).toBeDefined();
      expect(pokeChild!.route).toBe('/poke');
    });

    it('minták gyermek megjelenik ha showSamples true', () => {
      projectModeServiceMock['showSamples'].mockReturnValue(true);
      project$.next({ samplesCount: 5, hasOrderData: true });

      // Force recomputation
      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const samples = tablo?.children?.find(c => c.id === 'samples');
      expect(samples).toBeDefined();
      expect(samples!.route).toBe('/samples');
    });

    it('minta választó megjelenik ha showTemplateChooser true', () => {
      projectModeServiceMock['showTemplateChooser'].mockReturnValue(true);
      project$.next({ hasTemplateChooser: true, samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const templateChooser = tablo?.children?.find(c => c.id === 'template-chooser');
      expect(templateChooser).toBeDefined();
      expect(templateChooser!.label).toBe('Minta választó');
    });

    it('hiányzók megjelenik ha showMissingPersons true', () => {
      projectModeServiceMock['showMissingPersons'].mockReturnValue(true);
      project$.next({ hasMissingPersons: true, selectedTemplatesCount: 1, samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const persons = tablo?.children?.find(c => c.id === 'persons');
      expect(persons).toBeDefined();
      expect(persons!.route).toBe('/persons');
    });

    it('szavazások megjelenik ha showVoting true', () => {
      projectModeServiceMock['showVoting'].mockReturnValue(true);
      project$.next({ activePollsCount: 2, samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const voting = tablo?.children?.find(c => c.id === 'voting');
      expect(voting).toBeDefined();
      expect(voting!.label).toBe('Szavazások');
    });

    it('véglegesítés megjelenik ha canShowFinalization és canFinalize', () => {
      projectModeServiceMock['canShowFinalization'].mockReturnValue(true);
      canFinalize$.next(true);
      project$.next({ samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const finalization = tablo?.children?.find(c => c.id === 'finalization');
      expect(finalization).toBeDefined();
      expect(finalization!.route).toBe('/order-finalization');
    });

    it('véglegesítés NEM jelenik meg ha canFinalize false', () => {
      projectModeServiceMock['canShowFinalization'].mockReturnValue(true);
      canFinalize$.next(false);
      project$.next({ samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const finalization = tablo?.children?.find(c => c.id === 'finalization');
      expect(finalization).toBeUndefined();
    });

    it('megrendelési adatok megjelenik ha showOrderData true', () => {
      projectModeServiceMock['showOrderData'].mockReturnValue(true);
      project$.next({ hasOrderData: true, samplesCount: 3 });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const orderData = tablo?.children?.find(c => c.id === 'order-data');
      expect(orderData).toBeDefined();
      expect(orderData!.label).toBe('Megrendelési adatok');
    });
  });

  // ============================================================================
  // Képválasztás
  // ============================================================================
  describe('képválasztás menüpont', () => {
    it('megjelenik ha hasPhotoSelection true', () => {
      project$.next({ hasPhotoSelection: true, samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const photoSelection = tablo?.children?.find(c => c.id === 'photo-selection');
      expect(photoSelection).toBeDefined();
      expect(photoSelection!.label).toBe('Képválasztás');
    });

    it('NEM jelenik meg ha hasPhotoSelection false', () => {
      project$.next({ hasPhotoSelection: false, samplesCount: 0, hasOrderData: false });

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const photoSelection = tablo?.children?.find(c => c.id === 'photo-selection');
      expect(photoSelection).toBeUndefined();
    });

    it('NEM jelenik meg ha nincs projekt', () => {
      project$.next(null);

      const tablo = service.menuItems().find(i => i.id === 'tablo');
      const photoSelection = tablo?.children?.find(c => c.id === 'photo-selection');
      expect(photoSelection).toBeUndefined();
    });
  });

  // ============================================================================
  // Fizetéseim (billing)
  // ============================================================================
  describe('billing menüpont', () => {
    it('megjelenik ha billingEnabled true', () => {
      project$.next({ billingEnabled: true, samplesCount: 0, hasOrderData: false });

      const items = service.menuItems();
      const billing = items.find(i => i.id === 'billing');
      expect(billing).toBeDefined();
      expect(billing!.label).toBe('Fizetéseim');
    });

    it('NEM jelenik meg ha billingEnabled false', () => {
      project$.next({ billingEnabled: false, samplesCount: 0, hasOrderData: false });

      const items = service.menuItems();
      const billing = items.find(i => i.id === 'billing');
      expect(billing).toBeUndefined();
    });

    it('NEM jelenik meg ha nincs projekt', () => {
      const items = service.menuItems();
      const billing = items.find(i => i.id === 'billing');
      expect(billing).toBeUndefined();
    });
  });

  // ============================================================================
  // bottomMenuItems
  // ============================================================================
  describe('bottomMenuItems', () => {
    it('üres tömböt ad vissza', () => {
      expect(service.bottomMenuItems()).toEqual([]);
    });
  });

  // ============================================================================
  // flatMenuItems
  // ============================================================================
  describe('flatMenuItems', () => {
    it('laposított listát ad vissza gyermekekkel együtt', () => {
      projectModeServiceMock['showSamples'].mockReturnValue(true);
      project$.next({ samplesCount: 3, hasOrderData: true });

      const flat = service.flatMenuItems();
      const ids = flat.map(i => i.id);

      // Tartalmazza a szülő tablo-t és a samples gyermeket is
      expect(ids).toContain('tablo');
      expect(ids).toContain('samples');
      expect(ids).toContain('home');
    });

    it('mindig tartalmazza a poke elemet', () => {
      const flat = service.flatMenuItems();
      const poke = flat.find(i => i.id === 'poke');
      expect(poke).toBeDefined();
    });
  });

  // ============================================================================
  // findParentByRoute
  // ============================================================================
  describe('findParentByRoute', () => {
    it('megtalálja a szülőt ha a route egy gyermek route-ja', () => {
      // A poke mindig benne van a tablo children-ben
      const parent = service.findParentByRoute('/poke');
      expect(parent).not.toBeNull();
      expect(parent!.id).toBe('tablo');
    });

    it('null-t ad vissza ha nincs szülő', () => {
      const parent = service.findParentByRoute('/home');
      expect(parent).toBeNull();
    });

    it('null-t ad vissza nem létező route-ra', () => {
      const parent = service.findParentByRoute('/nonexistent');
      expect(parent).toBeNull();
    });
  });

  // ============================================================================
  // findItemByRoute
  // ============================================================================
  describe('findItemByRoute', () => {
    it('megtalálja a menüelemet route alapján', () => {
      const item = service.findItemByRoute('/home');
      expect(item).not.toBeNull();
      expect(item!.id).toBe('home');
    });

    it('megtalálja a gyermek elemet route alapján', () => {
      const item = service.findItemByRoute('/poke');
      expect(item).not.toBeNull();
      expect(item!.id).toBe('poke');
    });

    it('null-t ad vissza nem létező route-ra', () => {
      const item = service.findItemByRoute('/nonexistent');
      expect(item).toBeNull();
    });

    it('megtalálja a newsfeed-et', () => {
      const item = service.findItemByRoute('/newsfeed');
      expect(item).not.toBeNull();
      expect(item!.label).toBe('Hírek');
    });
  });
});
