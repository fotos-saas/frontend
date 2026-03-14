import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { VersionCheckService } from './version-check.service';
import { LoggerService } from './logger.service';

// Mock environment — production módban tesztelünk alapértelmezetten
vi.mock('../../../environments/environment', () => ({
  environment: { production: true, apiUrl: '/api' },
}));

// Mock BUILD_HASH
vi.mock('../constants/build-version', () => ({
  BUILD_HASH: 'test-hash-abc',
}));

describe('VersionCheckService', () => {
  let service: VersionCheckService;
  let httpTesting: HttpTestingController;
  let loggerMock: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Alapértelmezetten nincs Electron/Capacitor
    const win = window as unknown as Record<string, unknown>;
    delete win.electronAPI;
    delete win.Capacitor;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VersionCheckService,
        { provide: LoggerService, useValue: loggerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(VersionCheckService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopPolling();
    httpTesting.verify();
    vi.useRealTimers();
  });

  // ============================================================================
  // Alapállapot
  // ============================================================================
  describe('alapállapot', () => {
    it('updateAvailable false', () => {
      expect(service.updateAvailable()).toBe(false);
    });

    it('currentHash a BUILD_HASH értéke', () => {
      expect(service.currentHash()).toBe('test-hash-abc');
    });

    it('latestHash null', () => {
      expect(service.latestHash()).toBeNull();
    });
  });

  // ============================================================================
  // startPolling
  // ============================================================================
  describe('startPolling', () => {
    it('elindítja a pollingot és lekéri a verziót az első delay után', () => {
      service.startPolling();

      // INITIAL_DELAY_MS = 10_000
      vi.advanceTimersByTime(10_000);

      const req = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req.flush({ hash: 'test-hash-abc', timestamp: '2026-01-01', buildTime: 0, branch: 'main' });
    });

    it('nem indít duplán polling-ot', () => {
      service.startPolling();
      service.startPolling(); // Második hívás ignorálva

      vi.advanceTimersByTime(10_000);

      // Csak egy kérés legyen
      const reqs = httpTesting.match(r => r.url.startsWith('/version.json'));
      expect(reqs.length).toBe(1);
      reqs[0].flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });
    });

    it('nem indít polling-ot Electron platformon', () => {
      (window as unknown as Record<string, unknown>).electronAPI = {};

      service.startPolling();

      vi.advanceTimersByTime(10_000);
      httpTesting.expectNone(r => r.url.startsWith('/version.json'));

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Natív platform')
      );
    });

    it('nem indít polling-ot Capacitor platformon', () => {
      (window as unknown as Record<string, unknown>).Capacitor = {
        isNativePlatform: () => true,
      };

      service.startPolling();

      vi.advanceTimersByTime(10_000);
      httpTesting.expectNone(r => r.url.startsWith('/version.json'));
    });
  });

  // ============================================================================
  // Update detektálás
  // ============================================================================
  describe('update detektálás', () => {
    it('updateAvailable true-ra áll ha a szerveren más hash van', () => {
      service.startPolling();
      vi.advanceTimersByTime(10_000);

      const req = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req.flush({ hash: 'new-hash-xyz', timestamp: '', buildTime: 0, branch: 'main' });

      expect(service.updateAvailable()).toBe(true);
      expect(service.latestHash()).toBe('new-hash-xyz');
    });

    it('updateAvailable false marad ha azonos a hash', () => {
      service.startPolling();
      vi.advanceTimersByTime(10_000);

      const req = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req.flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });

      expect(service.updateAvailable()).toBe(false);
      expect(service.latestHash()).toBe('test-hash-abc');
    });

    it('hálózati hiba esetén nem dob hibát', () => {
      service.startPolling();
      vi.advanceTimersByTime(10_000);

      const req = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req.error(new ProgressEvent('error'));

      expect(service.updateAvailable()).toBe(false);
    });
  });

  // ============================================================================
  // MIN_POLL_GAP_MS (throttling)
  // ============================================================================
  describe('poll throttling', () => {
    it('nem kérdez le újra MIN_POLL_GAP_MS-en belül', () => {
      service.startPolling();

      // Első kérés (10s delay)
      vi.advanceTimersByTime(10_000);
      const req1 = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req1.flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });

      // 20s múlva — még a MIN_POLL_GAP_MS (30s)-on belül vagyunk, de az interval
      // POLL_INTERVAL_MS (5min) sem telt el, szóval nem lesz kérés
      vi.advanceTimersByTime(20_000);
      httpTesting.expectNone(r => r.url.startsWith('/version.json'));
    });
  });

  // ============================================================================
  // stopPolling
  // ============================================================================
  describe('stopPolling', () => {
    it('leállítja a polling-ot', () => {
      service.startPolling();
      service.stopPolling();

      vi.advanceTimersByTime(10_000);
      httpTesting.expectNone(r => r.url.startsWith('/version.json'));
    });

    it('stopPolling után újraindítható', () => {
      service.startPolling();
      service.stopPolling();
      service.startPolling();

      vi.advanceTimersByTime(10_000);
      const req = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req.flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });
    });
  });

  // ============================================================================
  // reloadPage
  // ============================================================================
  describe('reloadPage', () => {
    it('a metódus elérhető és meghívható', () => {
      // window.location.reload nem mock-olható jsdom-ban (non-configurable property),
      // ezért csak azt ellenőrizzük, hogy a metódus létezik és típushelyes
      expect(typeof service.reloadPage).toBe('function');
    });
  });

  // ============================================================================
  // Periodikus polling
  // ============================================================================
  describe('periodikus polling', () => {
    it('5 percenként lekérdezi a verziót', () => {
      service.startPolling();

      // Első kérés: initial delay (10s)
      vi.advanceTimersByTime(10_000);
      const req1 = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req1.flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });

      // POLL_INTERVAL_MS = 5 * 60 * 1000 = 300_000
      vi.advanceTimersByTime(300_000);
      const req2 = httpTesting.expectOne(r => r.url.startsWith('/version.json'));
      req2.flush({ hash: 'test-hash-abc', timestamp: '', buildTime: 0, branch: 'main' });
    });
  });
});

// ============================================================================
// Dev mód tesztek (külön describe, mert más environment mock kell)
// ============================================================================
describe('VersionCheckService — dev mód', () => {
  beforeEach(async () => {
    vi.useFakeTimers();

    // Felülírjuk az environment mock-ot dev módra
    const envModule = await import('../../../environments/environment');
    (envModule.environment as Record<string, unknown>).production = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('nem indít polling-ot dev módban', async () => {
    const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VersionCheckService,
        { provide: LoggerService, useValue: loggerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const devService = TestBed.inject(VersionCheckService);
    const httpCtrl = TestBed.inject(HttpTestingController);

    devService.startPolling();
    vi.advanceTimersByTime(10_000);

    httpCtrl.expectNone(r => r.url.startsWith('/version.json'));
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.stringContaining('Dev mód')
    );

    devService.stopPolling();
    httpCtrl.verify();

    // Visszaállítjuk production-re a többi teszthez
    const envModule = await import('../../../environments/environment');
    (envModule.environment as Record<string, unknown>).production = true;
  });
});
