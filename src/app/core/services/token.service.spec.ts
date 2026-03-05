import { TestBed } from '@angular/core/testing';
import { TokenService, TokenType } from './token.service';
import { TabloStorageService } from './tablo-storage.service';

/**
 * TokenService unit tesztek
 *
 * Token kezelés, típus, canFinalize flag tesztelése.
 */
describe('TokenService', () => {
  let service: TokenService;
  let storageMock: {
    getActiveSession: ReturnType<typeof vi.fn>;
    getCanFinalize: ReturnType<typeof vi.fn>;
    getAuthToken: ReturnType<typeof vi.fn>;
    setAuthToken: ReturnType<typeof vi.fn>;
    clearCurrentSessionAuth: ReturnType<typeof vi.fn>;
    setCanFinalize: ReturnType<typeof vi.fn>;
    getGuestSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storageMock = {
      getActiveSession: vi.fn().mockReturnValue(null),
      getCanFinalize: vi.fn().mockReturnValue(false),
      getAuthToken: vi.fn().mockReturnValue(null),
      setAuthToken: vi.fn(),
      clearCurrentSessionAuth: vi.fn(),
      setCanFinalize: vi.fn(),
      getGuestSession: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        TokenService,
        { provide: TabloStorageService, useValue: storageMock },
      ],
    });

    service = TestBed.inject(TokenService);
  });

  describe('inicializálás', () => {
    it('unknown típust és false canFinalize-t állít be ha nincs aktív session', () => {
      expect(service.getTokenType()).toBe('unknown');
      expect(service.canFinalize()).toBe(false);
    });

    it('storage-ból inicializálja az értékeket ha van aktív session', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'code' as TokenType });
      storageMock.getCanFinalize.mockReturnValue(true);

      // Újra létrehozzuk a service-t az új mock értékekkel
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TokenService,
          { provide: TabloStorageService, useValue: storageMock },
        ],
      });

      const newService = TestBed.inject(TokenService);
      expect(newService.getTokenType()).toBe('code');
      expect(newService.canFinalize()).toBe(true);
    });
  });

  describe('hasToken', () => {
    it('false-t ad vissza ha nincs token és nincs aktív session', () => {
      expect(service.hasToken()).toBe(false);
    });

    it('true-t ad vissza ha van auth token', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'code' });
      storageMock.getAuthToken.mockReturnValue('test-token');
      expect(service.hasToken()).toBe(true);
    });

    it('true-t ad vissza share session esetén guest_session token-nel', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'share' });
      storageMock.getAuthToken.mockReturnValue(null);
      storageMock.getGuestSession.mockReturnValue('guest-token');
      expect(service.hasToken()).toBe(true);
    });

    it('false-t ad vissza share session esetén ha nincs guest token sem', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'share' });
      storageMock.getAuthToken.mockReturnValue(null);
      storageMock.getGuestSession.mockReturnValue(null);
      expect(service.hasToken()).toBe(false);
    });

    it('false-t ad vissza nem-share session esetén ha nincs auth token', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'code' });
      storageMock.getAuthToken.mockReturnValue(null);
      expect(service.hasToken()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('null-t ad vissza ha nincs aktív session', () => {
      expect(service.getToken()).toBeNull();
    });

    it('visszaadja a storage-ból kapott tokent', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 1, sessionType: 'code' });
      storageMock.getAuthToken.mockReturnValue('my-jwt-token');
      expect(service.getToken()).toBe('my-jwt-token');
    });
  });

  describe('setToken', () => {
    it('meghívja a storage setAuthToken-t a megfelelő paraméterekkel', () => {
      service.setToken(42, 'share', 'new-token');
      expect(storageMock.setAuthToken).toHaveBeenCalledWith(42, 'share', 'new-token');
    });
  });

  describe('clearToken', () => {
    it('törli a session auth-ot és reseteli a signal-okat', () => {
      service.setTokenType('code');
      service.clearToken();

      expect(storageMock.clearCurrentSessionAuth).toHaveBeenCalled();
      expect(service.canFinalize()).toBe(false);
      expect(service.getTokenType()).toBe('unknown');
    });
  });

  describe('setCanFinalize', () => {
    it('beállítja a storage-ban és a signal-ban is', () => {
      service.setCanFinalize(1, 'code', true);
      expect(storageMock.setCanFinalize).toHaveBeenCalledWith(1, 'code', true);
      expect(service.canFinalize()).toBe(true);
    });
  });

  describe('setTokenType / getTokenType', () => {
    it('beállítja és visszaadja a token típust', () => {
      service.setTokenType('preview');
      expect(service.getTokenType()).toBe('preview');
    });
  });

  describe('updateTokenMetadata', () => {
    it('egyszerre frissíti a canFinalize-t és a token típust', () => {
      service.updateTokenMetadata(5, 'share', true);
      expect(service.canFinalize()).toBe(true);
      expect(service.getTokenType()).toBe('share');
      expect(storageMock.setCanFinalize).toHaveBeenCalledWith(5, 'share', true);
    });
  });

  describe('reinitialize', () => {
    it('újrainicializálja a signal-okat a storage-ból', () => {
      storageMock.getActiveSession.mockReturnValue({ projectId: 10, sessionType: 'preview' });
      storageMock.getCanFinalize.mockReturnValue(false);

      service.reinitialize();

      expect(service.getTokenType()).toBe('preview');
      expect(service.canFinalize()).toBe(false);
    });
  });

  describe('readonly signal-ok', () => {
    it('canFinalizeSignal visszaadja az aktuális értéket', () => {
      expect(service.canFinalizeSignal()).toBe(false);
      service.setCanFinalize(1, 'code', true);
      expect(service.canFinalizeSignal()).toBe(true);
    });

    it('tokenTypeSignal visszaadja az aktuális értéket', () => {
      expect(service.tokenTypeSignal()).toBe('unknown');
      service.setTokenType('code');
      expect(service.tokenTypeSignal()).toBe('code');
    });
  });
});
