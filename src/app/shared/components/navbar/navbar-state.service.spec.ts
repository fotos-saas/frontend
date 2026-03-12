import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { NavbarStateService } from './navbar-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { ProjectModeService } from '../../../core/services/project-mode.service';
import { PokeService } from '../../../core/services/poke.service';
import type { NavbarProjectInfo } from './navbar.component';

describe('NavbarStateService', () => {
  let service: NavbarStateService;

  // Mock subjects
  const canFinalize$ = new Subject<boolean>();
  const tokenType$ = new Subject<string>();
  const project$ = new Subject<any>();
  const guestSession$ = new Subject<any>();

  const mockAuthService = {
    canFinalize$,
    tokenType$,
    project$,
    logout: vi.fn(),
    updateContact: vi.fn(),
  };

  const mockGuestService = {
    guestSession$,
    updateGuestInfo: vi.fn(),
  };

  const mockProjectModeService = {
    showSamples: vi.fn(),
    showOrderData: vi.fn(),
    showTemplateChooser: vi.fn(),
    showMissingPersons: vi.fn(),
    canShowFinalization: vi.fn(),
    showVoting: vi.fn(),
  };

  const mockPokeService = {
    unreadCount: vi.fn(() => 3),
    refreshUnreadCount: vi.fn().mockReturnValue(of(undefined)),
  };

  const mockDestroyRef = {
    onDestroy: vi.fn((cb: () => void) => cb),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        NavbarStateService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: ProjectModeService, useValue: mockProjectModeService },
        { provide: PokeService, useValue: mockPokeService },
        { provide: DestroyRef, useValue: mockDestroyRef },
      ],
    });
    service = TestBed.inject(NavbarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('canFinalize kezdetben false', () => {
      expect(service.canFinalize()).toBe(false);
    });

    it('isGuest kezdetben false', () => {
      expect(service.isGuest()).toBe(false);
    });

    it('isPreview kezdetben false', () => {
      expect(service.isPreview()).toBe(false);
    });

    it('isCode kezdetben false', () => {
      expect(service.isCode()).toBe(false);
    });

    it('primaryContact kezdetben null', () => {
      expect(service.primaryContact()).toBeNull();
    });

    it('hasGuestSession kezdetben false', () => {
      expect(service.hasGuestSession()).toBe(false);
    });

    it('guestName kezdetben null', () => {
      expect(service.guestName()).toBeNull();
    });

    it('guestEmail kezdetben null', () => {
      expect(service.guestEmail()).toBeNull();
    });

    it('showEditDialog kezdetben false', () => {
      expect(service.showEditDialog()).toBe(false);
    });

    it('showContactEditDialog kezdetben false', () => {
      expect(service.showContactEditDialog()).toBe(false);
    });

    it('loggingOut kezdetben false', () => {
      expect(service.loggingOut).toBe(false);
    });
  });

  // ============================================================================
  // Computed értékek
  // ============================================================================
  describe('computed értékek', () => {
    it('displayName visszaadja a guestName-et', () => {
      service.guestName.set('Teszt Vendég');
      expect(service.displayName()).toBe('Teszt Vendég');
    });

    it('displayName null ha nincs guestName', () => {
      expect(service.displayName()).toBeNull();
    });

    it('contactDisplayName visszaadja a contact nevét', () => {
      service.primaryContact.set({ id: 1, name: 'Kiss Péter', email: null, phone: null });
      expect(service.contactDisplayName()).toBe('Kiss Péter');
    });

    it('contactDisplayName null ha nincs contact', () => {
      expect(service.contactDisplayName()).toBeNull();
    });

    it('pokeUnreadCount a pokeService unreadCount-ját adja', () => {
      expect(service.pokeUnreadCount).toBe(mockPokeService.unreadCount);
    });
  });

  // ============================================================================
  // initSubscriptions
  // ============================================================================
  describe('initSubscriptions', () => {
    it('canFinalize$ frissíti a canFinalize signal-t', () => {
      service.initSubscriptions();

      canFinalize$.next(true);
      expect(service.canFinalize()).toBe(true);

      canFinalize$.next(false);
      expect(service.canFinalize()).toBe(false);
    });

    it('tokenType$ share → isGuest true', () => {
      service.initSubscriptions();

      tokenType$.next('share');
      expect(service.isGuest()).toBe(true);
      expect(service.isPreview()).toBe(false);
      expect(service.isCode()).toBe(false);
    });

    it('tokenType$ preview → isPreview true', () => {
      service.initSubscriptions();

      tokenType$.next('preview');
      expect(service.isGuest()).toBe(false);
      expect(service.isPreview()).toBe(true);
      expect(service.isCode()).toBe(false);
    });

    it('tokenType$ code → isCode true', () => {
      service.initSubscriptions();

      tokenType$.next('code');
      expect(service.isGuest()).toBe(false);
      expect(service.isPreview()).toBe(false);
      expect(service.isCode()).toBe(true);
    });

    it('project$ beállítja a primaryContact-ot', () => {
      service.initSubscriptions();

      const contact = { id: 10, name: 'Teszt', email: 'test@test.hu', phone: null };
      project$.next({ contacts: [contact] });

      expect(service.primaryContact()).toEqual(contact);
    });

    it('project$ null contacts esetén null primaryContact', () => {
      service.initSubscriptions();

      project$.next({ contacts: null });
      expect(service.primaryContact()).toBeNull();
    });

    it('project$ üres contacts tömb esetén null primaryContact', () => {
      service.initSubscriptions();

      project$.next({ contacts: [] });
      expect(service.primaryContact()).toBeNull();
    });

    it('guestSession$ beállítja a guest adatokat', () => {
      service.initSubscriptions();

      guestSession$.next({
        guestName: 'Vendég Béla',
        guestEmail: 'vend@test.hu',
      });

      expect(service.hasGuestSession()).toBe(true);
      expect(service.guestName()).toBe('Vendég Béla');
      expect(service.guestEmail()).toBe('vend@test.hu');
    });

    it('guestSession$ null session: hasGuestSession false', () => {
      service.initSubscriptions();

      guestSession$.next(null);

      expect(service.hasGuestSession()).toBe(false);
      expect(service.guestName()).toBeNull();
      expect(service.guestEmail()).toBeNull();
    });

    it('guestSession$ meglévő session esetén refreshUnreadCount-ot hív', () => {
      service.initSubscriptions();

      guestSession$.next({ guestName: 'Test', guestEmail: null });

      expect(mockPokeService.refreshUnreadCount).toHaveBeenCalled();
    });

    it('guestSession$ null session esetén NEM hív refreshUnreadCount-ot', () => {
      service.initSubscriptions();

      guestSession$.next(null);

      expect(mockPokeService.refreshUnreadCount).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // getStatusBadgeClasses
  // ============================================================================
  describe('getStatusBadgeClasses', () => {
    it('tabloStatus szín alapján generálja az osztályokat', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
        tabloStatus: { name: 'Nyomtatásra vár', color: 'blue' },
      };

      expect(service.getStatusBadgeClasses(info)).toBe('bg-blue-100 text-blue-700');
    });

    it('userStatusColor-t használja ha nincs tabloStatus', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
        userStatusColor: 'green',
      };

      expect(service.getStatusBadgeClasses(info)).toBe('bg-green-100 text-green-700');
    });

    it('gray fallback ha nincs szín', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
      };

      expect(service.getStatusBadgeClasses(info)).toBe('bg-gray-100 text-gray-700');
    });

    it('gray fallback ha ismeretlen szín', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
        tabloStatus: { name: 'Teszt', color: 'pink' },
      };

      expect(service.getStatusBadgeClasses(info)).toBe('bg-gray-100 text-gray-700');
    });

    it('null projectInfo: gray fallback', () => {
      expect(service.getStatusBadgeClasses(null)).toBe('bg-gray-100 text-gray-700');
    });

    it('minden szín helyes mapelése', () => {
      const colors = ['gray', 'blue', 'amber', 'green', 'purple', 'red'] as const;
      for (const color of colors) {
        const info: NavbarProjectInfo = {
          schoolName: null, className: null, classYear: null,
          tabloStatus: { name: 'T', color },
        };
        expect(service.getStatusBadgeClasses(info)).toBe(`bg-${color}-100 text-${color}-700`);
      }
    });
  });

});
