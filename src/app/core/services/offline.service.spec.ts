import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OfflineService, CACHE_KEYS, CACHE_TTL } from './offline.service';
import { ElectronService } from './electron.service';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import { of, Subject } from 'rxjs';

describe('OfflineService', () => {
  let service: OfflineService;

  const mockElectronService = {
    isElectron: false,
    isOnline: true,
    onlineStatusChanges: new Subject<boolean>().asObservable(),
    getQueuedRequests: vi.fn().mockResolvedValue([]),
    getLastSync: vi.fn().mockResolvedValue(null),
    queueRequest: vi.fn().mockResolvedValue('req-id'),
    removeQueuedRequest: vi.fn().mockResolvedValue(true),
    clearRequestQueue: vi.fn().mockResolvedValue(true),
    setLastSync: vi.fn().mockResolvedValue(true),
    cacheSet: vi.fn().mockResolvedValue(true),
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheDelete: vi.fn().mockResolvedValue(true),
    cacheClear: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ElectronService, useValue: mockElectronService },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } },
      ],
    });
    service = TestBed.inject(OfflineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('alapértelmezett állapotok', () => {
      expect(service.isOnline()).toBe(true);
      expect(service.isOffline()).toBe(false);
      expect(service.isSyncing()).toBe(false);
      expect(service.pendingRequests()).toBe(0);
    });
  });

  describe('syncStatus', () => {
    it('computed signal helyes értékekkel', () => {
      const status = service.syncStatus();
      expect(status.pendingRequests).toBe(0);
      expect(status.isSyncing).toBe(false);
    });
  });

  describe('queueRequest', () => {
    it('delegál az electronService-re', async () => {
      const result = await service.queueRequest({
        method: 'POST', url: '/api/test', body: { data: 1 },
      });
      expect(result).toBe('req-id');
      expect(mockElectronService.queueRequest).toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('üríti a queue-t', async () => {
      await service.clearQueue();
      expect(mockElectronService.clearRequestQueue).toHaveBeenCalled();
    });
  });

  describe('cache API', () => {
    it('cache delegál az electronService-re', async () => {
      await service.cache('key', { data: 1 }, 5000);
      expect(mockElectronService.cacheSet).toHaveBeenCalledWith('key', { data: 1 }, 5000);
    });

    it('getCached delegál', async () => {
      await service.getCached('key');
      expect(mockElectronService.cacheGet).toHaveBeenCalledWith('key');
    });

    it('clearCache kulccsal delegál', async () => {
      await service.clearCache('key');
      expect(mockElectronService.cacheDelete).toHaveBeenCalledWith('key');
    });

    it('clearCache kulcs nélkül mindent töröl', async () => {
      await service.clearCache();
      expect(mockElectronService.cacheClear).toHaveBeenCalled();
    });
  });

  describe('specifikus cache módszerek', () => {
    it('cacheUserProfile a helyes kulccsal ment', async () => {
      await service.cacheUserProfile({ name: 'Test' });
      expect(mockElectronService.cacheSet).toHaveBeenCalledWith(
        CACHE_KEYS.USER_PROFILE, { name: 'Test' }, CACHE_TTL.USER_PROFILE
      );
    });

    it('cacheProjectList a helyes kulccsal ment', async () => {
      await service.cacheProjectList([{ id: 1 }]);
      expect(mockElectronService.cacheSet).toHaveBeenCalledWith(
        CACHE_KEYS.PROJECT_LIST, [{ id: 1 }], CACHE_TTL.PROJECT_LIST
      );
    });
  });

  describe('CACHE konstansok', () => {
    it('kulcsok definiálva', () => {
      expect(CACHE_KEYS.USER_PROFILE).toBe('userProfile');
      expect(CACHE_KEYS.PROJECT_LIST).toBe('projectList');
    });

    it('TTL értékek', () => {
      expect(CACHE_TTL.USER_PROFILE).toBe(24 * 60 * 60 * 1000);
      expect(CACHE_TTL.PROJECT_LIST).toBe(30 * 60 * 1000);
    });
  });
});
