import { TestBed } from '@angular/core/testing';
import { ElectronService } from './electron.service';
import { LoggerService } from './logger.service';
import { ElectronNotificationService } from './electron-notification.service';
import { ElectronCacheService } from './electron-cache.service';
import { ElectronPaymentService } from './electron-payment.service';
import { ElectronDragService } from './electron-drag.service';
import { ElectronPortraitService } from './electron-portrait.service';
import { ElectronSyncService } from './electron-sync.service';
import { signal } from '@angular/core';

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ElectronService', () => {
  let service: ElectronService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: ElectronNotificationService, useValue: {
          showNotification: vi.fn(), onNotificationClicked: vi.fn(),
          onNotificationReply: vi.fn(), onNotificationAction: vi.fn(),
          setBadgeCount: vi.fn(), setBadgeString: vi.fn(), clearBadge: vi.fn(),
          bounceDock: vi.fn(), cancelDockBounce: vi.fn(), onDockMenuAction: vi.fn(),
        }},
        { provide: ElectronCacheService, useValue: {
          cacheGet: vi.fn(), cacheSet: vi.fn(), cacheDelete: vi.fn(), cacheClear: vi.fn(),
          queueRequest: vi.fn(), getQueuedRequests: vi.fn(), removeQueuedRequest: vi.fn(),
          clearRequestQueue: vi.fn(), setLastSync: vi.fn(), getLastSync: vi.fn(),
        }},
        { provide: ElectronPaymentService, useValue: {
          openStripeCheckout: vi.fn(), openStripePortal: vi.fn(),
          onDeepLink: vi.fn(), onPaymentSuccess: vi.fn(), onPaymentCancelled: vi.fn(),
        }},
        { provide: ElectronDragService, useValue: {
          prepareDragFiles: vi.fn(), startNativeDrag: vi.fn(), getDragTempDir: vi.fn(),
          cleanupDragFiles: vi.fn(), prepareAndStartDrag: vi.fn(), hasTouchBar: false,
          setTouchBarContext: vi.fn(), setTouchBarItems: vi.fn(), clearTouchBar: vi.fn(),
          onTouchBarAction: vi.fn(),
        }},
        { provide: ElectronPortraitService, useValue: {
          pythonAvailable: signal(null), checkPython: vi.fn(), isPythonAvailable: vi.fn(),
          processSingle: vi.fn(), processBatch: vi.fn(), downloadBackground: vi.fn(),
          getTempDir: vi.fn(), cleanupTemp: vi.fn(),
        }},
        { provide: ElectronSyncService, useValue: {
          syncState: signal('disabled'), syncEnabled: signal(false),
        }},
      ],
    });
    service = TestBed.inject(ElectronService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('platform detection', () => {
    it('isElectron false böngészőben', () => {
      expect(service.isElectron).toBe(false);
    });

    it('platform "browser" böngészőben', () => {
      expect(service.platform).toBe('browser');
    });

    it('isMac false böngészőben', () => {
      expect(service.isMac).toBe(false);
    });

    it('isWindows false böngészőben', () => {
      expect(service.isWindows).toBe(false);
    });
  });

  describe('credential store', () => {
    it('storeCredentials false böngészőben', async () => {
      expect(await service.storeCredentials('u', 'p')).toBe(false);
    });

    it('getCredentials null böngészőben', async () => {
      expect(await service.getCredentials()).toBeNull();
    });

    it('deleteCredentials false böngészőben', async () => {
      expect(await service.deleteCredentials()).toBe(false);
    });

    it('hasCredentials false böngészőben', async () => {
      expect(await service.hasCredentials()).toBe(false);
    });
  });

  describe('app info', () => {
    it('getAppInfo null böngészőben', async () => {
      expect(await service.getAppInfo()).toBeNull();
    });
  });
});
