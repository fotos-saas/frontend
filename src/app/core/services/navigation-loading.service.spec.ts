import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationLoadingService } from './navigation-loading.service';

/**
 * NavigationLoadingService unit tesztek
 *
 * Router esemény tracking, navigáció állapot, pending route.
 */
describe('NavigationLoadingService', () => {
  let service: NavigationLoadingService;
  let routerEvents$: Subject<unknown>;

  beforeEach(() => {
    routerEvents$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        NavigationLoadingService,
        {
          provide: Router,
          useValue: { events: routerEvents$.asObservable() },
        },
      ],
    });

    service = TestBed.inject(NavigationLoadingService);
  });

  describe('alapállapot', () => {
    it('nincs navigáció folyamatban', () => {
      expect(service.isNavigating()).toBe(false);
      expect(service.pendingRoute()).toBeNull();
      expect(service.navigationStartTime()).toBe(0);
    });
  });

  describe('NavigationStart', () => {
    it('beállítja a navigáció állapotot', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));

      expect(service.isNavigating()).toBe(true);
      expect(service.pendingRoute()).toBe('/dashboard');
      expect(service.navigationStartTime()).toBeGreaterThan(0);
    });
  });

  describe('NavigationEnd', () => {
    it('visszaállítja a navigáció állapotot', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      routerEvents$.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      expect(service.isNavigating()).toBe(false);
      expect(service.pendingRoute()).toBeNull();
      expect(service.navigationStartTime()).toBe(0);
    });
  });

  describe('NavigationCancel', () => {
    it('visszaállítja a navigáció állapotot', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      routerEvents$.next(new NavigationCancel(1, '/dashboard', ''));

      expect(service.isNavigating()).toBe(false);
      expect(service.pendingRoute()).toBeNull();
    });
  });

  describe('NavigationError', () => {
    it('visszaállítja a navigáció állapotot', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      routerEvents$.next(new NavigationError(1, '/dashboard', new Error('test')));

      expect(service.isNavigating()).toBe(false);
      expect(service.pendingRoute()).toBeNull();
    });
  });

  describe('isPendingRoute', () => {
    it('true ha a route megegyezik a pending route-tal', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      expect(service.isPendingRoute('/dashboard')).toBe(true);
    });

    it('true ha child route (prefix egyezés)', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard/settings'));
      expect(service.isPendingRoute('/dashboard')).toBe(true);
    });

    it('false ha nem egyezik', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      expect(service.isPendingRoute('/settings')).toBe(false);
    });

    it('false ha nincs pending route', () => {
      expect(service.isPendingRoute('/dashboard')).toBe(false);
    });

    it('normalizálja a / prefix-et', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      expect(service.isPendingRoute('dashboard')).toBe(true);
    });

    it('nem egyezik hasonló nevű route-okkal', () => {
      routerEvents$.next(new NavigationStart(1, '/dashboard'));
      expect(service.isPendingRoute('/dashboards')).toBe(false);
    });
  });
});
