import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

// Mock Capacitor before import
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capgo/capacitor-updater', () => ({
  CapacitorUpdater: {
    notifyAppReady: vi.fn(),
    current: vi.fn(),
    getLatest: vi.fn(),
    download: vi.fn(),
    set: vi.fn(),
    reload: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    reset: vi.fn(),
    addListener: vi.fn(),
  },
}));

import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  let service: AppUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(AppUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('alapértelmezett állapotok', () => {
      expect(service.updateAvailable()).toBe(false);
      expect(service.downloading()).toBe(false);
      expect(service.downloadProgress()).toBe(0);
      expect(service.currentVersion()).toBeNull();
      expect(service.latestVersion()).toBeNull();
    });
  });

  describe('nem natív platformon', () => {
    it('checkForUpdate false', async () => {
      expect(await service.checkForUpdate()).toBe(false);
    });

    it('downloadAndInstall false', async () => {
      expect(await service.downloadAndInstall()).toBe(false);
    });

    it('getDownloadedBundles üres tömb', async () => {
      expect(await service.getDownloadedBundles()).toEqual([]);
    });

    it('deleteBundle false', async () => {
      expect(await service.deleteBundle('id')).toBe(false);
    });

    it('resetToBuiltin false', async () => {
      expect(await service.resetToBuiltin()).toBe(false);
    });
  });
});
