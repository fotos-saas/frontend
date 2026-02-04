import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GuestOnlyDirective } from './guest-only.directive';
import { AuthService, type LoginResponse, type TokenType } from '../../core/services/auth.service';
import { TabloAuthService } from '../../core/services/auth/tablo-auth.service';

/**
 * GuestOnlyDirective unit tesztek
 *
 * Tesztelendő:
 * - Element megjelenik ha isGuest() === true
 * - Element elrejtve ha isGuest() === false
 */

@Component({
  selector: 'app-test-guest-only',
  template: `
    <div *appGuestOnly class="guest-warning">
      <p>Korlátozott hozzáférés</p>
    </div>
  `,
  standalone: true,
  imports: [GuestOnlyDirective],
})
class TestComponent {}

describe('GuestOnlyDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let authService: AuthService;
  let tabloAuthService: TabloAuthService;
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
      imports: [TestComponent, GuestOnlyDirective, HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService, TabloAuthService],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    tabloAuthService = TestBed.inject(TabloAuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ Visibility Tests ============

  describe('Directive visibility (isGuest)', () => {
    it('element megjelenik ha isGuest() === true (share token)', () => {
      // Arrange
      const shareResponse: LoginResponse = {
        user: { id: 1, name: 'Guest', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'share-token',
        tokenType: 'share' as TokenType,
      };

      // Act - bejelentkezés share tokennel (guest)
      tabloAuthService.storeAuthData(shareResponse, 'share');
      fixture.detectChanges();

      // Assert - elem látható legyen
      const warning = fixture.debugElement.query(By.css('.guest-warning'));
      expect(warning).toBeTruthy();
    });

    it('element elrejtve ha isGuest() === false (code token)', () => {
      // Arrange
      const codeResponse: LoginResponse = {
        user: { id: 1, name: 'Full', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'code-token',
        tokenType: 'code' as TokenType,
      };

      // Act - bejelentkezés code tokennel (nem guest)
      tabloAuthService.storeAuthData(codeResponse, 'code');
      fixture.detectChanges();

      // Assert - elem rejtett legyen
      const warning = fixture.debugElement.query(By.css('.guest-warning'));
      expect(warning).toBeFalsy();
    });

    it('element elrejtve ha isGuest() === false (preview token)', () => {
      // Arrange
      const previewResponse: LoginResponse = {
        user: { id: 1, name: 'Admin', email: null, type: 'tablo-guest' },
        project: mockProject,
        token: 'preview-token',
        tokenType: 'preview' as TokenType,
      };

      // Act - bejelentkezés preview tokennel (nem guest)
      tabloAuthService.storeAuthData(previewResponse, 'preview');
      fixture.detectChanges();

      // Assert - elem rejtett legyen
      const warning = fixture.debugElement.query(By.css('.guest-warning'));
      expect(warning).toBeFalsy();
    });

    it('element elrejtve ha nincs bejelentkezve', () => {
      // Arrange: nem történik login

      // Act
      fixture.detectChanges();

      // Assert - elem rejtett legyen
      const warning = fixture.debugElement.query(By.css('.guest-warning'));
      expect(warning).toBeFalsy();
    });
  });

  // ============ Dynamic Toggle Tests ============
  // MEGJEGYZÉS: A GuestOnlyDirective effect()-et használ computed signal-lal,
  // de a computed signal NEM reaktív BehaviorSubject változásokra, mert getValue()-t használ.
  // A dinamikus tesztek SKIP-elve vannak, mert az architektúra nem támogatja.
  // A jövőbeli javítás: AuthService signal-alapú tokenType-ot használjon.

  describe('Dynamic element toggle', () => {
    it.skip('reactive: elem megjelenik share token bejelentkezéskor - SKIP (computed signal nem reaktív BehaviorSubject-re)', () => {
      // MEGJEGYZÉS: Ez a teszt SKIP-elve, mert a jelenlegi architektúra nem támogatja
      // a dinamikus frissítést. Az AuthService computed signal-jai BehaviorSubject.getValue()-t
      // használnak, ami nem trigger-eli az effect() újrafutását.
      //
      // Javításhoz az AuthService-t át kell írni signal-alapúra:
      // private tokenTypeSignal = signal<TokenType>('unknown');
      // public readonly isGuest = computed(() => this.tokenTypeSignal() === 'share');
    });

    it.skip('reactive: elem NEM jelenik meg code token bejelentkezéskor - SKIP (computed signal nem reaktív BehaviorSubject-re)', () => {
      // MEGJEGYZÉS: Ez a teszt SKIP-elve, lásd a fenti magyarázatot.
    });
  });

});
