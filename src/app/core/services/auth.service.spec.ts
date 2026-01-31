import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, type LoginResponse } from './auth.service';
import { TabloStorageService } from './tablo-storage.service';

/**
 * AuthService unit tesztek
 *
 * Tesztelendő:
 * - isGuest() computed signal: true ha tokenType === 'share'
 * - hasFullAccess() computed signal: true ha tokenType === 'code' VAGY 'preview'
 * - isPreview() computed signal: true ha tokenType === 'preview'
 */
describe('AuthService - Guest User System', () => {
  let service: AuthService;
  let storageService: TabloStorageService;

  const mockProject = {
    id: 1,
    name: 'Tesztprojekt',
    schoolName: 'Teszt Iskola',
    className: null,
    classYear: null,
  };

  beforeEach(() => {
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService, TabloStorageService],
    });

    service = TestBed.inject(AuthService);
    storageService = TestBed.inject(TabloStorageService);
  });

  // ============ isGuest() Signal Tests ============

  describe('isGuest() computed signal', () => {
    it('true legyen ha tokenType === "share"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Guest User', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token-123',
        tokenType: 'share',
        canFinalize: false,
      };

      // Act
      service['storeAuthData'](loginResponse, 'share');

      // Assert
      expect(service.isGuest()).toBe(true);
    });

    it('false legyen ha tokenType === "code"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Full Access User', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token-456',
        tokenType: 'code',
        canFinalize: true,
      };

      // Act
      service['storeAuthData'](loginResponse, 'code');

      // Assert
      expect(service.isGuest()).toBe(false);
    });

    it('false legyen ha tokenType === "preview"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token-789',
        tokenType: 'preview',
        canFinalize: false,
      };

      // Act
      service['storeAuthData'](loginResponse, 'preview');

      // Assert
      expect(service.isGuest()).toBe(false);
    });
  });

  // ============ hasFullAccess() Signal Tests ============

  describe('hasFullAccess() computed signal', () => {
    it('true legyen ha tokenType === "code"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Full Access User', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token-123',
        tokenType: 'code',
        canFinalize: true,
      };

      // Act
      service['storeAuthData'](loginResponse, 'code');

      // Assert
      expect(service.hasFullAccess()).toBe(true);
    });

    it('false legyen ha tokenType === "share"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Guest User', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token-456',
        tokenType: 'share',
        canFinalize: false,
      };

      // Act
      service['storeAuthData'](loginResponse, 'share');

      // Assert
      expect(service.hasFullAccess()).toBe(false);
    });

    it('true legyen ha tokenType === "preview" (admin előnézet)', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Admin Preview', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token-789',
        tokenType: 'preview',
        canFinalize: false,
      };

      // Act
      service['storeAuthData'](loginResponse, 'preview');

      // Assert - preview is full access (admin előnézet)
      expect(service.hasFullAccess()).toBe(true);
    });
  });

  // ============ isPreview() Signal Tests ============

  describe('isPreview() computed signal', () => {
    it('true legyen ha tokenType === "preview"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token-123',
        tokenType: 'preview',
        canFinalize: false,
      };

      // Act
      service['storeAuthData'](loginResponse, 'preview');

      // Assert
      expect(service.isPreview()).toBe(true);
    });

    it('false legyen ha tokenType === "code"', () => {
      // Arrange
      const loginResponse: LoginResponse = {
        user: { id: 1, name: 'Full Access', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token-456',
        tokenType: 'code',
        canFinalize: true,
      };

      // Act
      service['storeAuthData'](loginResponse, 'code');

      // Assert
      expect(service.isPreview()).toBe(false);
    });
  });

  // ============ Integration Tests ============

  describe('Signal interaction (exclusive states)', () => {
    it('csak egy signal lehet true egy időben (share)', () => {
      // Arrange
      const shareResponse: LoginResponse = {
        user: { id: 1, name: 'Guest', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token',
        tokenType: 'share',
      };

      // Act
      service['storeAuthData'](shareResponse, 'share');

      // Assert - csak isGuest legyen true
      expect(service.isGuest()).toBe(true);
      expect(service.hasFullAccess()).toBe(false);
      expect(service.isPreview()).toBe(false);
    });

    it('csak egy signal lehet true egy időben (code)', () => {
      // Arrange
      const codeResponse: LoginResponse = {
        user: { id: 1, name: 'Full', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token',
        tokenType: 'code',
      };

      // Act
      service['storeAuthData'](codeResponse, 'code');

      // Assert - csak hasFullAccess legyen true
      expect(service.isGuest()).toBe(false);
      expect(service.hasFullAccess()).toBe(true);
      expect(service.isPreview()).toBe(false);
    });

    it('preview esetén isPreview és hasFullAccess is true (admin előnézet)', () => {
      // Arrange
      const previewResponse: LoginResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token',
        tokenType: 'preview',
      };

      // Act
      service['storeAuthData'](previewResponse, 'preview');

      // Assert - preview esetén mind isPreview MIND hasFullAccess true
      // (admin előnézet = teljes hozzáférés)
      expect(service.isGuest()).toBe(false);
      expect(service.hasFullAccess()).toBe(true);
      expect(service.isPreview()).toBe(true);
    });
  });
});
