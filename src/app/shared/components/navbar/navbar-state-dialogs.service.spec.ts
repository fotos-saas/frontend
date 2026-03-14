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

/**
 * navbar-state.service – 2. rész
 * getStatusName, navigáció, guest edit dialog, contact edit dialog, logout
 */
describe('NavbarStateService – dialogs & navigation', () => {
  let service: NavbarStateService;

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

  // ============================================================================
  // getStatusName
  // ============================================================================
  describe('getStatusName', () => {
    it('tabloStatus.name-et adja ha van', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
        tabloStatus: { name: 'Aktív', color: 'green' },
        userStatus: 'Nem aktív',
      };
      expect(service.getStatusName(info)).toBe('Aktív');
    });

    it('userStatus-t adja ha nincs tabloStatus', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
        userStatus: 'Vendég',
      };
      expect(service.getStatusName(info)).toBe('Vendég');
    });

    it('null ha nincs sem tabloStatus sem userStatus', () => {
      const info: NavbarProjectInfo = {
        schoolName: null, className: null, classYear: null,
      };
      expect(service.getStatusName(info)).toBeNull();
    });

    it('null ha projectInfo null', () => {
      expect(service.getStatusName(null)).toBeNull();
    });
  });

  // ============================================================================
  // Navigációs menüpont láthatóság
  // ============================================================================
  describe('navigációs menüpont láthatóság', () => {
    const mockInfo: NavbarProjectInfo = {
      schoolName: null, className: null, classYear: null,
    };

    it('showSamples delegál a projectModeService-nek', () => {
      mockProjectModeService.showSamples.mockReturnValue(true);
      expect(service.showSamples(mockInfo)).toBe(true);
      expect(mockProjectModeService.showSamples).toHaveBeenCalledWith(mockInfo);
    });

    it('showOrderData delegál a projectModeService-nek', () => {
      mockProjectModeService.showOrderData.mockReturnValue(false);
      expect(service.showOrderData(mockInfo)).toBe(false);
      expect(mockProjectModeService.showOrderData).toHaveBeenCalledWith(mockInfo);
    });

    it('showTemplateChooser delegál a projectModeService-nek', () => {
      mockProjectModeService.showTemplateChooser.mockReturnValue(true);
      expect(service.showTemplateChooser(mockInfo)).toBe(true);
      expect(mockProjectModeService.showTemplateChooser).toHaveBeenCalledWith(mockInfo);
    });

    it('showPersons delegál a projectModeService showMissingPersons-nak', () => {
      mockProjectModeService.showMissingPersons.mockReturnValue(true);
      expect(service.showPersons(mockInfo)).toBe(true);
      expect(mockProjectModeService.showMissingPersons).toHaveBeenCalledWith(mockInfo);
    });

    it('showVoting delegál a projectModeService-nek', () => {
      mockProjectModeService.showVoting.mockReturnValue(false);
      expect(service.showVoting(mockInfo)).toBe(false);
      expect(mockProjectModeService.showVoting).toHaveBeenCalledWith(mockInfo);
    });

    it('showFinalization: false ha canShowFinalization false', () => {
      mockProjectModeService.canShowFinalization.mockReturnValue(false);
      expect(service.showFinalization(mockInfo)).toBe(false);
    });

    it('showFinalization: false ha canShowFinalization true de canFinalize false', () => {
      mockProjectModeService.canShowFinalization.mockReturnValue(true);
      service.canFinalize.set(false);
      expect(service.showFinalization(mockInfo)).toBe(false);
    });

    it('showFinalization: true ha mindkettő true', () => {
      mockProjectModeService.canShowFinalization.mockReturnValue(true);
      service.canFinalize.set(true);
      expect(service.showFinalization(mockInfo)).toBe(true);
    });
  });

  // ============================================================================
  // Guest edit dialog
  // ============================================================================
  describe('guest edit dialog', () => {
    it('openEditDialog megnyitja a dialógust és törli az error-t', () => {
      service.updateError.set('régi hiba');

      service.openEditDialog();

      expect(service.showEditDialog()).toBe(true);
      expect(service.updateError()).toBeNull();
    });

    it('closeEditDialog bezárja a dialógust és törli az error-t', () => {
      service.showEditDialog.set(true);
      service.updateError.set('hiba');

      service.closeEditDialog();

      expect(service.showEditDialog()).toBe(false);
      expect(service.updateError()).toBeNull();
    });

    it('onEditDialogResult close: bezárja a dialógust', () => {
      service.showEditDialog.set(true);

      service.onEditDialogResult({ action: 'close' });

      expect(service.showEditDialog()).toBe(false);
    });

    it('onEditDialogResult submit: sikeres mentés', () => {
      mockGuestService.updateGuestInfo.mockReturnValue(of(undefined));

      service.onEditDialogResult({ action: 'submit', name: 'Új Név', email: 'uj@test.hu' });

      expect(service.isUpdating()).toBe(false);
      expect(service.showEditDialog()).toBe(false);
      expect(mockGuestService.updateGuestInfo).toHaveBeenCalledWith('Új Név', 'uj@test.hu');
    });

    it('onEditDialogResult submit: isUpdating true közben', () => {
      const subject = new Subject<void>();
      mockGuestService.updateGuestInfo.mockReturnValue(subject.asObservable());

      service.onEditDialogResult({ action: 'submit', name: 'Név' });

      expect(service.isUpdating()).toBe(true);
      expect(service.updateError()).toBeNull();

      subject.next();
      subject.complete();

      expect(service.isUpdating()).toBe(false);
    });

    it('onEditDialogResult submit: hiba kezelés', () => {
      mockGuestService.updateGuestInfo.mockReturnValue(
        throwError(() => new Error('Szerverhiba'))
      );

      service.onEditDialogResult({ action: 'submit', name: 'Név' });

      expect(service.isUpdating()).toBe(false);
      expect(service.updateError()).toBe('Szerverhiba');
    });

    it('onEditDialogResult submit: hiba message nélkül default szöveg', () => {
      mockGuestService.updateGuestInfo.mockReturnValue(
        throwError(() => new Error(''))
      );

      service.onEditDialogResult({ action: 'submit', name: 'Név' });

      expect(service.updateError()).toBe('Hiba tortent a mentes soran');
    });
  });

  // ============================================================================
  // Contact edit dialog
  // ============================================================================
  describe('contact edit dialog', () => {
    it('openContactEditDialog kitölti a contactEditData-t a primaryContact-ból', () => {
      service.primaryContact.set({ id: 1, name: 'Kiss Péter', email: 'peter@test.hu', phone: '+36301234567' });

      service.openContactEditDialog();

      expect(service.showContactEditDialog()).toBe(true);
      expect(service.contactEditData()).toEqual({
        name: 'Kiss Péter',
        email: 'peter@test.hu',
        phone: '+36301234567',
      });
      expect(service.contactUpdateError()).toBeNull();
    });

    it('openContactEditDialog üres adatokkal ha nincs primaryContact', () => {
      service.primaryContact.set(null);

      service.openContactEditDialog();

      expect(service.contactEditData()).toEqual({ name: '', email: '', phone: '' });
    });

    it('closeContactEditDialog bezárja és törli az error-t', () => {
      service.showContactEditDialog.set(true);
      service.contactUpdateError.set('hiba');

      service.closeContactEditDialog();

      expect(service.showContactEditDialog()).toBe(false);
      expect(service.contactUpdateError()).toBeNull();
    });

    it('onContactEditResult close: bezárja a dialógust', () => {
      service.showContactEditDialog.set(true);

      service.onContactEditResult({ action: 'close' });

      expect(service.showContactEditDialog()).toBe(false);
    });

    it('onContactEditResult save: sikeres mentés', () => {
      mockAuthService.updateContact.mockReturnValue(of({ success: true, data: {} }));

      service.onContactEditResult({
        action: 'save',
        data: { name: 'Új Név', email: 'uj@test.hu', phone: '+36301111111' },
      });

      expect(service.isContactUpdating()).toBe(false);
      expect(service.showContactEditDialog()).toBe(false);
      expect(mockAuthService.updateContact).toHaveBeenCalledWith({
        name: 'Új Név',
        email: 'uj@test.hu',
        phone: '+36301111111',
      });
    });

    it('onContactEditResult save: üres email/phone null-ként küldve', () => {
      mockAuthService.updateContact.mockReturnValue(of({ success: true, data: {} }));

      service.onContactEditResult({
        action: 'save',
        data: { name: 'Név', email: '', phone: '' },
      });

      expect(mockAuthService.updateContact).toHaveBeenCalledWith({
        name: 'Név',
        email: null,
        phone: null,
      });
    });

    it('onContactEditResult save: isContactUpdating true közben', () => {
      const subject = new Subject<any>();
      mockAuthService.updateContact.mockReturnValue(subject.asObservable());

      service.onContactEditResult({
        action: 'save',
        data: { name: 'Név', email: '', phone: '' },
      });

      expect(service.isContactUpdating()).toBe(true);

      subject.next({ success: true, data: {} });
      subject.complete();

      expect(service.isContactUpdating()).toBe(false);
    });

    it('onContactEditResult save: hiba kezelés', () => {
      mockAuthService.updateContact.mockReturnValue(
        throwError(() => new Error('Validációs hiba'))
      );

      service.onContactEditResult({
        action: 'save',
        data: { name: 'Név', email: '', phone: '' },
      });

      expect(service.isContactUpdating()).toBe(false);
      expect(service.contactUpdateError()).toBe('Validációs hiba');
    });

    it('onContactEditResult save: hiba message nélkül default szöveg', () => {
      mockAuthService.updateContact.mockReturnValue(
        throwError(() => new Error(''))
      );

      service.onContactEditResult({
        action: 'save',
        data: { name: 'Név', email: '', phone: '' },
      });

      expect(service.contactUpdateError()).toBe('Hiba tortent a mentes soran');
    });
  });

  // ============================================================================
  // logout
  // ============================================================================
  describe('logout', () => {
    it('hívja az authService.logout-ot és a menuClose callbacket', () => {
      mockAuthService.logout.mockReturnValue(of(undefined));
      const menuClose = vi.fn();

      service.logout(menuClose);

      expect(menuClose).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(service.loggingOut).toBe(true);
    });

    it('nem hívja kétszer ha loggingOut true', () => {
      mockAuthService.logout.mockReturnValue(of(undefined));
      const menuClose = vi.fn();

      service.logout(menuClose);
      service.logout(menuClose);

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(menuClose).toHaveBeenCalledTimes(1);
    });

    it('hiba esetén loggingOut visszaáll false-ra', () => {
      mockAuthService.logout.mockReturnValue(
        throwError(() => new Error('Hiba'))
      );
      const menuClose = vi.fn();

      service.logout(menuClose);

      expect(service.loggingOut).toBe(false);
    });
  });
});
