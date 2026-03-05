import { TestBed } from '@angular/core/testing';
import { ElectronSyncService } from './electron-sync.service';
import { LoggerService } from './logger.service';

describe('ElectronSyncService', () => {
  let service: ElectronSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(ElectronSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('alapértelmezett állapot (böngészőben)', () => {
    it('disabled állapotban indul', () => {
      expect(service.syncState()).toBe('disabled');
      expect(service.syncEnabled()).toBe(false);
    });

    it('nincs peer', () => {
      expect(service.discoveredPeers()).toEqual([]);
      expect(service.pairedPeers()).toEqual([]);
    });

    it('computed signals helyesek', () => {
      expect(service.isSyncing()).toBe(false);
      expect(service.isSearching()).toBe(false);
      expect(service.isConnected()).toBe(false);
      expect(service.hasError()).toBe(false);
    });
  });

  describe('böngésző fallback', () => {
    it('enable false', async () => {
      expect(await service.enable('user', '/path')).toBe(false);
    });

    it('disable false', async () => {
      expect(await service.disable()).toBe(false);
    });

    it('generatePairingCode null', async () => {
      expect(await service.generatePairingCode()).toBeNull();
    });

    it('forceSync false', async () => {
      expect(await service.forceSync()).toBe(false);
    });

    it('getSettings null', async () => {
      expect(await service.getSettings()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('nullázza a hibaüzenetet', () => {
      service.clearError();
      expect(service.lastError()).toBeNull();
    });
  });
});
