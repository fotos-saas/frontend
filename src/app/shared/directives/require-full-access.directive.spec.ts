import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RequireFullAccessDirective } from './require-full-access.directive';
import { AuthService } from '../../core/services/auth.service';

/**
 * RequireFullAccessDirective unit tesztek
 *
 * A direktíva a canFinalize$ observable-t használja, NEM a hasFullAccess() signalt!
 * - canFinalize alapértelmezés: tokenType === 'code' esetén true
 * - Preview token esetén canFinalize = false (ha nincs explicit beállítva)
 * - Share token esetén canFinalize = false
 */

@Component({
  selector: 'app-test-require-full-access',
  template: `
    <div *appRequireFullAccess class="full-access-content">
      <button>Teljes jogú funkció</button>
    </div>
  `,
  standalone: true,
  imports: [RequireFullAccessDirective],
})
class TestComponent {}

describe('RequireFullAccessDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let authService: AuthService;
  let localStorageMock: Record<string, string>;

  const mockProject = {
    id: 1,
    name: 'Tesztprojekt',
    schoolName: 'Teszt Iskola',
    className: null,
    classYear: null,
  };

  beforeEach(() => {
    // LocalStorage mock
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => localStorageMock[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => { localStorageMock[key] = value; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete localStorageMock[key]; });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => { localStorageMock = {}; });

    TestBed.configureTestingModule({
      imports: [TestComponent, RequireFullAccessDirective, HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ Visibility Tests ============

  describe('Directive visibility (canFinalize$)', () => {
    it('element megjelenik ha canFinalize === true (code token)', () => {
      // Arrange
      const codeResponse = {
        user: { id: 1, name: 'Full', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token',
        tokenType: 'code',
        // canFinalize nincs explicit megadva → default: tokenType === 'code' → true
      };

      // Act - bejelentkezés code tokennel
      authService['storeAuthData'](codeResponse, 'code');
      fixture.detectChanges();

      // Assert - elem látható legyen
      const content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeTruthy();
    });

    it('element elrejtve ha canFinalize === false (share token)', () => {
      // Arrange
      const shareResponse = {
        user: { id: 1, name: 'Guest', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token',
        tokenType: 'share',
        // canFinalize nincs explicit megadva → default: tokenType === 'code' → false
      };

      // Act - bejelentkezés share tokennel
      authService['storeAuthData'](shareResponse, 'share');
      fixture.detectChanges();

      // Assert - elem rejtett legyen
      const content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeFalsy();
    });

    it('element elrejtve ha canFinalize === false (preview token - admin előnézet olvasási joggal)', () => {
      // Arrange
      // FONTOS: A RequireFullAccessDirective canFinalize$-t használ, NEM hasFullAccess()-t!
      // Preview tokennel canFinalize alapértelmezetten false (csak code esetén true)
      // A preview token csak olvasási előnézet, NEM véglegesítési jog
      const previewResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token',
        tokenType: 'preview',
        // canFinalize nincs explicit megadva → default: tokenType === 'code' → false
      };

      // Act - bejelentkezés preview tokennel
      authService['storeAuthData'](previewResponse, 'preview');
      fixture.detectChanges();

      // Assert - elem REJTETT legyen (preview != canFinalize)
      const content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeFalsy();
    });

    it('element megjelenik ha preview token explicit canFinalize: true-val', () => {
      // Arrange
      // Ha az API explicit canFinalize: true-t küld preview tokenhez
      const previewWithFinalizeResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token',
        tokenType: 'preview',
        canFinalize: true, // Explicit beállítva
      };

      // Act - bejelentkezés preview tokennel és canFinalize: true
      authService['storeAuthData'](previewWithFinalizeResponse, 'preview');
      fixture.detectChanges();

      // Assert - elem látható legyen (explicit canFinalize = true)
      const content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeTruthy();
    });

    it('element elrejtve ha nincs bejelentkezve', () => {
      // Arrange: nem történik login

      // Act
      fixture.detectChanges();

      // Assert - elem rejtett legyen
      const content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeFalsy();
    });
  });

  // ============ Dynamic Toggle Tests ============

  describe('Dynamic element toggle', () => {
    it('reactive: elem megjelenik/eltűnik tokenType változáskor', () => {
      // Arrange
      const shareResponse = {
        user: { id: 1, name: 'Guest', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token',
        tokenType: 'share',
      };

      const codeResponse = {
        user: { id: 1, name: 'Full', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token',
        tokenType: 'code',
      };

      // Act 1 - Share bejelentkezés (rejtett)
      authService['storeAuthData'](shareResponse, 'share');
      fixture.detectChanges();

      let content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeFalsy();

      // Act 2 - Code bejelentkezés (látható)
      authService['storeAuthData'](codeResponse, 'code');
      fixture.detectChanges();

      content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeTruthy();
    });

    it('reactive: elem eltűnik amikor clearAuth() hívódik', () => {
      // Arrange
      const codeResponse = {
        user: { id: 1, name: 'Full', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token',
        tokenType: 'code',
      };

      // Act 1 - Bejelentkezés
      authService['storeAuthData'](codeResponse, 'code');
      fixture.detectChanges();

      let content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeTruthy();

      // Act 2 - Kijelentkezés
      authService.clearAuth();
      fixture.detectChanges();

      content = fixture.debugElement.query(By.css('.full-access-content'));
      expect(content).toBeFalsy();
    });
  });

});
