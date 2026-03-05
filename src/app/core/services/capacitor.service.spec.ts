import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { Router } from '@angular/router';

// Mock all Capacitor plugins before import
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false,
  },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(), exitApp: vi.fn() },
}));

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: vi.fn(), setBackgroundColor: vi.fn() },
  Style: { Dark: 'DARK', Light: 'LIGHT' },
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: vi.fn() },
}));

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: { setResizeMode: vi.fn(), addListener: vi.fn(), hide: vi.fn() },
  KeyboardResize: { Body: 'body' },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn(), notification: vi.fn() },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

vi.mock('@capacitor/network', () => ({
  Network: { getStatus: vi.fn().mockResolvedValue({ connected: true, connectionType: 'wifi' }), addListener: vi.fn() },
}));

vi.mock('@capacitor/device', () => ({
  Device: { getInfo: vi.fn().mockResolvedValue({}) },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: { requestPermissions: vi.fn(), register: vi.fn(), addListener: vi.fn() },
}));

import { CapacitorService } from './capacitor.service';

// Mock navigator.clipboard for jsdom
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn() },
    writable: true,
  });
}

describe('CapacitorService', () => {
  let service: CapacitorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(CapacitorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('platform detection', () => {
    it('isNative false web-en', () => {
      expect(service.isNative()).toBe(false);
    });

    it('platform web', () => {
      expect(service.platform()).toBe('web');
    });

    it('isIOS false', () => {
      expect(service.isIOS()).toBe(false);
    });

    it('isAndroid false', () => {
      expect(service.isAndroid()).toBe(false);
    });
  });

  describe('haptics (web fallback)', () => {
    it('hapticLight nem dob hibát', async () => {
      await expect(service.hapticLight()).resolves.toBeUndefined();
    });

    it('hapticSuccess nem dob hibát', async () => {
      await expect(service.hapticSuccess()).resolves.toBeUndefined();
    });
  });

  describe('share', () => {
    it('web-en clipboard-re másol ha van URL', async () => {
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      const result = await service.share({ url: 'https://test.com' });
      expect(result).toBe(true);
      clipboardSpy.mockRestore();
    });

    it('false ha nincs URL web-en', async () => {
      const result = await service.share({ title: 'Test' });
      expect(result).toBe(false);
    });
  });

  describe('isPluginAvailable', () => {
    it('false web-en', () => {
      expect(service.isPluginAvailable('Camera')).toBe(false);
    });
  });

  describe('getSafeAreaInsets', () => {
    it('alapértelmezett insets', () => {
      const insets = service.getSafeAreaInsets();
      expect(insets).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    });
  });

  describe('onDeepLink', () => {
    it('callback regisztrálható', () => {
      expect(() => service.onDeepLink(vi.fn())).not.toThrow();
    });
  });
});
