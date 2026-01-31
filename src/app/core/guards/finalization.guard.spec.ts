/**
 * FinalizationGuard Unit Tests
 *
 * Tesztek:
 * - Token nélküli hozzáférés (redirect login-ra)
 * - Kódos belépés (canFinalize: true) - átengedi
 * - Share token (canFinalize: false) - redirect /home-ra + toast
 * - Preview token (canFinalize: false) - redirect /home-ra + toast
 * - Érvénytelen session (redirect login-ra)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError, firstValueFrom, Observable, isObservable } from 'rxjs';
import { FinalizationGuard } from './finalization.guard';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('FinalizationGuard', () => {
  let guard: FinalizationGuard;
  let authServiceSpy: {
    hasToken: ReturnType<typeof vi.fn>;
    validateSession: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let toastServiceSpy: { error: ReturnType<typeof vi.fn> };
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // AuthService spy
    authServiceSpy = {
      hasToken: vi.fn(),
      validateSession: vi.fn()
    };

    // Router spy
    routerSpy = {
      navigate: vi.fn()
    };

    // ToastService spy
    toastServiceSpy = {
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        FinalizationGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });

    guard = TestBed.inject(FinalizationGuard);

    // Mock route objects
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/finalization' } as RouterStateSnapshot;
  });

  // ===========================================
  // NO TOKEN TESTS
  // ===========================================

  describe('when no token exists', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(false);
    });

    it('should redirect to login', () => {
      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not call validateSession', () => {
      guard.canActivate(mockRoute, mockState);

      expect(authServiceSpy.validateSession).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // CODE LOGIN (canFinalize: true)
  // ===========================================

  describe('when logged in with code (canFinalize: true)', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({
          valid: true,
          project: { id: 1, name: 'Test' },
          tokenType: 'code',
          canFinalize: true
        })
      );
    });

    it('should allow access to finalization', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(true);
      } else {
        expect(result).toBe(true);
      }
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // SHARE TOKEN (canFinalize: false)
  // ===========================================

  describe('when logged in with share token (canFinalize: false)', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({
          valid: true,
          project: { id: 1, name: 'Test' },
          tokenType: 'share',
          canFinalize: false
        })
      );
    });

    it('should redirect to /home', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should show error toast', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        await firstValueFrom(result as Observable<boolean>);
      }

      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        'Nincs jogosultság',
        'A véglegesítés csak belépési kóddal érhető el.'
      );
    });
  });

  // ===========================================
  // PREVIEW TOKEN (canFinalize: false)
  // ===========================================

  describe('when logged in with preview token (canFinalize: false)', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({
          valid: true,
          project: { id: 1, name: 'Test' },
          tokenType: 'preview',
          canFinalize: false
        })
      );
    });

    it('should redirect to /home', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should show error toast', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        await firstValueFrom(result as Observable<boolean>);
      }

      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        'Nincs jogosultság',
        'A véglegesítés csak belépési kóddal érhető el.'
      );
    });
  });

  // ===========================================
  // INVALID SESSION
  // ===========================================

  describe('when session is invalid', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({ valid: false, message: 'Session expired' })
      );
    });

    it('should redirect to login', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not show toast', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        await firstValueFrom(result as Observable<boolean>);
      }

      expect(toastServiceSpy.error).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // SERVER ERROR
  // ===========================================

  describe('when server returns error', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
    });

    it('should redirect to login on error', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ===========================================
  // EDGE CASES
  // ===========================================

  describe('edge cases', () => {
    it('should handle undefined canFinalize as false', async () => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({
          valid: true,
          project: { id: 1 },
          tokenType: 'share'
          // canFinalize nem definiált
        })
      );

      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should handle canFinalize: null as false', async () => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({
          valid: true,
          project: { id: 1 },
          canFinalize: null
        })
      );

      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
  });
});
