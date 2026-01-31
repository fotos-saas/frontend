import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { SamplesGuard } from './samples.guard';
import { AuthService } from '../services/auth.service';
import { ProjectModeService } from '../services/project-mode.service';
import { ToastService } from '../services/toast.service';

describe('SamplesGuard', () => {
  let guard: SamplesGuard;
  let authServiceMock: {
    hasToken: ReturnType<typeof vi.fn>;
    validateSession: ReturnType<typeof vi.fn>;
    getProject: ReturnType<typeof vi.fn>;
  };
  let projectModeServiceMock: {
    showSamples: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    error: ReturnType<typeof vi.fn>;
  };

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      hasToken: vi.fn(),
      validateSession: vi.fn(),
      getProject: vi.fn()
    };
    projectModeServiceMock = {
      showSamples: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };
    toastServiceMock = {
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        SamplesGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: ProjectModeService, useValue: projectModeServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });
    guard = TestBed.inject(SamplesGuard);
  });

  // ============================================================================
  // canActivate - No token
  // ============================================================================
  describe('canActivate - no token', () => {
    it('should return false and redirect to login when no token', () => {
      authServiceMock.hasToken.mockReturnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ============================================================================
  // canActivate - With token
  // ============================================================================
  describe('canActivate - with token', () => {
    beforeEach(() => {
      authServiceMock.hasToken.mockReturnValue(true);
    });

    it('should return false and redirect to login when session is invalid', async () => {
      authServiceMock.validateSession.mockReturnValue(of({ valid: false }));

      const result$ = guard.canActivate(mockRoute, mockState) as Observable<boolean>;
      const result = await firstValueFrom(result$);

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return false and redirect to home when no samples available', async () => {
      const mockProject = { id: 1, name: 'Test Project' };
      authServiceMock.validateSession.mockReturnValue(of({ valid: true }));
      authServiceMock.getProject.mockReturnValue(mockProject);
      projectModeServiceMock.showSamples.mockReturnValue(false);

      const result$ = guard.canActivate(mockRoute, mockState) as Observable<boolean>;
      const result = await firstValueFrom(result$);

      expect(result).toBe(false);
      expect(toastServiceMock.error).toHaveBeenCalledWith(
        'Nincs minta',
        'Még nincsenek mintaképek ehhez a projekthez.'
      );
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should return true when session is valid and samples are available', async () => {
      const mockProject = { id: 1, name: 'Test Project', samplesCount: 5 };
      authServiceMock.validateSession.mockReturnValue(of({ valid: true }));
      authServiceMock.getProject.mockReturnValue(mockProject);
      projectModeServiceMock.showSamples.mockReturnValue(true);

      const result$ = guard.canActivate(mockRoute, mockState) as Observable<boolean>;
      const result = await firstValueFrom(result$);

      expect(result).toBe(true);
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should return false and redirect to login on validation error', async () => {
      authServiceMock.validateSession.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      const result$ = guard.canActivate(mockRoute, mockState) as Observable<boolean>;
      const result = await firstValueFrom(result$);

      expect(result).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
