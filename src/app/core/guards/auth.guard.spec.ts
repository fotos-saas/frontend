/**
 * AuthGuard Unit Tests
 *
 * Tesztek:
 * - Token nélküli hozzáférés (redirect login-ra)
 * - Érvényes token (átengedi)
 * - Lejárt/érvénytelen token (redirect login-ra)
 * - Szerverhiba esetén (redirect login-ra)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError, firstValueFrom, Observable, isObservable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: {
    hasToken: ReturnType<typeof vi.fn>;
    validateSession: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
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

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);

    // Mock route objects
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
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
  // VALID TOKEN TESTS
  // ===========================================

  describe('when valid token exists', () => {
    beforeEach(() => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        of({ valid: true, project: { id: 1, name: 'Test' } })
      );
    });

    it('should allow access', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(true);
      } else {
        expect(result).toBe(true);
      }
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should call validateSession', async () => {
      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        await firstValueFrom(result as Observable<boolean>);
      }

      expect(authServiceSpy.validateSession).toHaveBeenCalled();
    });
  });

  // ===========================================
  // INVALID SESSION TESTS
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
  });

  // ===========================================
  // SERVER ERROR TESTS
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
    it('should handle 401 unauthorized', async () => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      const result = guard.canActivate(mockRoute, mockState);

      if (isObservable(result)) {
        const value = await firstValueFrom(result as Observable<boolean>);
        expect(value).toBe(false);
      } else {
        expect(result).toBe(false);
      }
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle network errors', async () => {
      authServiceSpy.hasToken.mockReturnValue(true);
      authServiceSpy.validateSession.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

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
});
