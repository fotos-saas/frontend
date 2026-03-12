import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { SidebarRouteService } from './sidebar-route.service';
import { SidebarStateService } from './sidebar-state.service';
import { MenuConfigService } from './menu-config.service';

describe('SidebarRouteService', () => {
  let service: SidebarRouteService;
  let routerEvents$: Subject<any>;
  let sidebarStateMock: { expandSection: ReturnType<typeof vi.fn> };
  let menuConfigMock: { findParentByRoute: ReturnType<typeof vi.fn> };
  let routerMock: { events: Subject<any>; url: string };

  beforeEach(() => {
    routerEvents$ = new Subject();

    routerMock = {
      events: routerEvents$,
      url: '/home',
    };

    sidebarStateMock = {
      expandSection: vi.fn(),
    };

    menuConfigMock = {
      findParentByRoute: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        SidebarRouteService,
        { provide: Router, useValue: routerMock },
        { provide: SidebarStateService, useValue: sidebarStateMock },
        { provide: MenuConfigService, useValue: menuConfigMock },
      ],
    });

    service = TestBed.inject(SidebarRouteService);
  });

  // ============================================================================
  // Inicializáció
  // ============================================================================
  describe('inicializáció', () => {
    it('service létrehozható', () => {
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // Route változás figyelése
  // ============================================================================
  describe('route változás figyelése', () => {
    it('NavigationEnd eseményre kibontja a szülő szekciót', () => {
      menuConfigMock.findParentByRoute.mockReturnValue({ id: 'tablo', label: 'Tabló' });

      routerEvents$.next(new NavigationEnd(1, '/samples', '/samples'));

      expect(menuConfigMock.findParentByRoute).toHaveBeenCalledWith('/samples');
      expect(sidebarStateMock.expandSection).toHaveBeenCalledWith('tablo');
    });

    it('nem bont ki semmit ha nincs szülő szekció', () => {
      menuConfigMock.findParentByRoute.mockReturnValue(null);

      routerEvents$.next(new NavigationEnd(1, '/home', '/home'));

      expect(sidebarStateMock.expandSection).not.toHaveBeenCalled();
    });

    it('urlAfterRedirects-t használja (nem az eredeti URL-t)', () => {
      menuConfigMock.findParentByRoute.mockReturnValue(null);

      routerEvents$.next(new NavigationEnd(1, '/old-path', '/redirected-path'));

      expect(menuConfigMock.findParentByRoute).toHaveBeenCalledWith('/redirected-path');
    });

    it('query paramétereket levágja', () => {
      menuConfigMock.findParentByRoute.mockReturnValue(null);

      routerEvents$.next(new NavigationEnd(1, '/samples?page=2', '/samples?page=2'));

      expect(menuConfigMock.findParentByRoute).toHaveBeenCalledWith('/samples');
    });

    it('többszöri navigáció mindegyikére reagál', () => {
      menuConfigMock.findParentByRoute
        .mockReturnValueOnce({ id: 'tablo', label: 'Tabló' })
        .mockReturnValueOnce({ id: 'order', label: 'Rendelés' });

      routerEvents$.next(new NavigationEnd(1, '/samples', '/samples'));
      routerEvents$.next(new NavigationEnd(2, '/order-data', '/order-data'));

      expect(sidebarStateMock.expandSection).toHaveBeenCalledTimes(2);
      expect(sidebarStateMock.expandSection).toHaveBeenNthCalledWith(1, 'tablo');
      expect(sidebarStateMock.expandSection).toHaveBeenNthCalledWith(2, 'order');
    });

    it('nem-NavigationEnd eseményt figyelmen kívül hagyja', () => {
      routerEvents$.next({ id: 1, url: '/test' }); // random event

      expect(menuConfigMock.findParentByRoute).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // syncWithCurrentRoute
  // ============================================================================
  describe('syncWithCurrentRoute', () => {
    it('az aktuális router.url alapján kibontja a szekciót', () => {
      routerMock.url = '/samples';
      menuConfigMock.findParentByRoute.mockReturnValue({ id: 'tablo', label: 'Tabló' });

      service.syncWithCurrentRoute();

      expect(menuConfigMock.findParentByRoute).toHaveBeenCalledWith('/samples');
      expect(sidebarStateMock.expandSection).toHaveBeenCalledWith('tablo');
    });

    it('query paramokat levágja a router.url-ből is', () => {
      routerMock.url = '/voting?id=5';
      menuConfigMock.findParentByRoute.mockReturnValue(null);

      service.syncWithCurrentRoute();

      expect(menuConfigMock.findParentByRoute).toHaveBeenCalledWith('/voting');
    });

    it('nem bont ki semmit ha nincs szülő', () => {
      routerMock.url = '/home';
      menuConfigMock.findParentByRoute.mockReturnValue(null);

      service.syncWithCurrentRoute();

      expect(sidebarStateMock.expandSection).not.toHaveBeenCalled();
    });
  });
});
