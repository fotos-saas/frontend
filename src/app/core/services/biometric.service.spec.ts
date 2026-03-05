import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

// Mock Capacitor - must be before import
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('capacitor-native-biometric', () => ({
  NativeBiometric: {
    isAvailable: vi.fn(),
    verifyIdentity: vi.fn(),
    setCredentials: vi.fn(),
    getCredentials: vi.fn(),
    deleteCredentials: vi.fn(),
  },
  BiometryType: { NONE: 0, TOUCH_ID: 1, FACE_ID: 2, FINGERPRINT: 3, FACE_AUTHENTICATION: 4, IRIS_AUTHENTICATION: 5, MULTIPLE: 6 },
}));

// Import after mocking
import { BiometricService } from './biometric.service';

describe('BiometricService', () => {
  let service: BiometricService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(BiometricService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('nem natív platformon', () => {
    it('isAvailable false', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('authenticate false', async () => {
      expect(await service.authenticate()).toBe(false);
    });

    it('storeCredentials false', async () => {
      expect(await service.storeCredentials('u', 'p')).toBe(false);
    });

    it('getCredentials null', async () => {
      expect(await service.getCredentials()).toBeNull();
    });

    it('deleteCredentials false', async () => {
      expect(await service.deleteCredentials()).toBe(false);
    });

    it('biometricLogin null', async () => {
      expect(await service.biometricLogin()).toBeNull();
    });

    it('hasStoredCredentials false', async () => {
      expect(await service.hasStoredCredentials()).toBe(false);
    });
  });

  describe('computed signals', () => {
    it('biometryName default', () => {
      expect(service.biometryName()).toBe('Biometrikus azonosítás');
    });

    it('biometryIcon default', () => {
      expect(service.biometryIcon()).toBe('shield-check');
    });
  });
});
