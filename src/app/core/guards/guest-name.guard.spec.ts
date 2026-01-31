import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { GuestNameGuard } from './guest-name.guard';
import { AuthService } from '../services/auth.service';
import { GuestService } from '../services/guest.service';

describe('GuestNameGuard', () => {
  let guard: GuestNameGuard;
  let authServiceMock: {
    isGuest: ReturnType<typeof vi.fn>;
  };
  let guestServiceMock: {
    hasRegisteredSession: ReturnType<typeof vi.fn>;
    isSessionPending: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      isGuest: vi.fn()
    };
    guestServiceMock = {
      hasRegisteredSession: vi.fn(),
      isSessionPending: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        GuestNameGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: GuestService, useValue: guestServiceMock }
      ]
    });
    guard = TestBed.inject(GuestNameGuard);
  });

  // ============================================================================
  // canActivate
  // ============================================================================
  describe('canActivate', () => {
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    it('should return true for non-guest users', () => {
      authServiceMock.isGuest.mockReturnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should return true for guest with registered and verified session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should return true for guest without session (component handles onboarding)', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      // Guard engedélyez, a komponens kezeli az onboarding-ot
      expect(result).toBe(true);
    });

    it('should return true for guest with pending session (component handles it)', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      // Guard engedélyez, a komponens kezeli a pending állapotot
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // needsOnboarding
  // ============================================================================
  describe('needsOnboarding', () => {
    it('should return false for non-guest users', () => {
      authServiceMock.isGuest.mockReturnValue(false);

      expect(guard.needsOnboarding()).toBe(false);
    });

    it('should return true for guest without registered session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(false);

      expect(guard.needsOnboarding()).toBe(true);
    });

    it('should return false for guest with registered session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);

      expect(guard.needsOnboarding()).toBe(false);
    });
  });

  // ============================================================================
  // needsGuestName (deprecated)
  // ============================================================================
  describe('needsGuestName (deprecated)', () => {
    it('should call needsOnboarding', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(false);

      expect(guard.needsGuestName()).toBe(guard.needsOnboarding());
    });
  });

  // ============================================================================
  // isPendingVerification
  // ============================================================================
  describe('isPendingVerification', () => {
    it('should return false for non-guest users', () => {
      authServiceMock.isGuest.mockReturnValue(false);

      expect(guard.isPendingVerification()).toBe(false);
    });

    it('should return false for guest without registered session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(false);

      expect(guard.isPendingVerification()).toBe(false);
    });

    it('should return false for guest with verified session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(false);

      expect(guard.isPendingVerification()).toBe(false);
    });

    it('should return true for guest with pending session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(true);

      expect(guard.isPendingVerification()).toBe(true);
    });
  });

  // ============================================================================
  // isVerified
  // ============================================================================
  describe('isVerified', () => {
    it('should return true for non-guest users', () => {
      authServiceMock.isGuest.mockReturnValue(false);

      expect(guard.isVerified()).toBe(true);
    });

    it('should return false for guest needing onboarding', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(false);

      expect(guard.isVerified()).toBe(false);
    });

    it('should return false for guest with pending verification', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(true);

      expect(guard.isVerified()).toBe(false);
    });

    it('should return true for guest with verified session', () => {
      authServiceMock.isGuest.mockReturnValue(true);
      guestServiceMock.hasRegisteredSession.mockReturnValue(true);
      guestServiceMock.isSessionPending.mockReturnValue(false);

      expect(guard.isVerified()).toBe(true);
    });
  });
});
