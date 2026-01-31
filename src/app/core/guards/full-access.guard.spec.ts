import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { fullAccessGuard } from './full-access.guard';
import { AuthService, LoginResponse, TokenType } from '../services/auth.service';

/**
 * fullAccessGuard unit tesztek
 *
 * Tesztelendő:
 * - Átengedi ha hasFullAccess() === true
 * - Redirect-el /samples-re ha hasFullAccess() === false
 */
describe('fullAccessGuard', () => {
  let authService: AuthService;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  /**
   * Helper - LoginResponse létrehozása
   */
  const createMockResponse = (tokenType: TokenType): LoginResponse => ({
    user: { id: 1, name: 'Test User', email: null, type: 'tablo-guest' as const },
    project: {
      id: 1,
      name: 'Tesztprojekt',
      schoolName: 'Teszt Iskola',
      className: null,
      classYear: null,
    },
    token: `${tokenType}-token`,
    tokenType,
  });

  beforeEach(() => {
    // LocalStorage mock
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

    // Router spy
    routerSpy = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  // ============ Guard Pass Tests ============

  describe('Guard allows access (hasFullAccess === true)', () => {
    it('átengedi ha tokenType === "code"', () => {
      // Arrange
      const response = createMockResponse('code');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).storeAuthData(response, 'code');

      // Act
      const result = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  // ============ Guard Block Tests ============

  describe('Guard blocks access (hasFullAccess === false)', () => {
    it('redirect-el /samples-re ha tokenType === "share"', () => {
      // Arrange
      const response = createMockResponse('share');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).storeAuthData(response, 'share');

      // Act
      const result = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/samples']);
    });

    // NOTE: preview token HAS full access (admin előnézet), nem block-ol
    // Lásd: AuthService.hasFullAccess = tokenType === 'code' || tokenType === 'preview'

    it('redirect-el /samples-re ha nincs bejelentkezve', () => {
      // Arrange: nem történik login

      // Act
      const result = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/samples']);
    });

    it('redirect-el /samples-re ha tokenType === "unknown"', () => {
      // Arrange: nincs explicit bejelentkezés, tokenType 'unknown' marad

      // Act
      const result = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/samples']);
    });
  });

  // ============ Redirect Target Tests ============

  describe('Guard redirect target', () => {
    it('mindig /samples-re redirect-el, nem más route-ra', () => {
      // Arrange
      const response = createMockResponse('share');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).storeAuthData(response, 'share');

      // Act
      TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      const calls = routerSpy.navigate.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toEqual(['/samples']);
    });
  });

  // ============ Multiple Calls Tests ============

  describe('Multiple guard calls', () => {
    it('egymás után többször hívható a guard', () => {
      // Arrange
      const response = createMockResponse('code');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (authService as any).storeAuthData(response, 'code');

      // Act
      const result1 = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));
      const result2 = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));
      const result3 = TestBed.runInInjectionContext(() => fullAccessGuard({} as any, {} as any));

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });
});
