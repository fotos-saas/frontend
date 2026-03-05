import { TestBed } from '@angular/core/testing';
import { ElectronNotificationService } from './electron-notification.service';

describe('ElectronNotificationService', () => {
  let service: ElectronNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectronNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('böngésző fallback', () => {
    it('showNotification fallback (permission needed)', async () => {
      const result = await service.showNotification('Test', 'body');
      // Notification permission nem granted böngészőben teszt környezetben
      expect(result).toEqual({ success: false, id: null });
    });

    it('onNotificationClicked nem dob hibát', () => {
      expect(() => service.onNotificationClicked(vi.fn())).not.toThrow();
    });

    it('onNotificationReply nem dob hibát', () => {
      expect(() => service.onNotificationReply(vi.fn())).not.toThrow();
    });

    it('onNotificationAction nem dob hibát', () => {
      expect(() => service.onNotificationAction(vi.fn())).not.toThrow();
    });

    it('setBadgeCount false', async () => {
      expect(await service.setBadgeCount(5)).toBe(false);
    });

    it('setBadgeString false', async () => {
      expect(await service.setBadgeString('99+')).toBe(false);
    });

    it('clearBadge false', async () => {
      expect(await service.clearBadge()).toBe(false);
    });

    it('bounceDock -1', async () => {
      expect(await service.bounceDock()).toBe(-1);
    });

    it('cancelDockBounce false', async () => {
      expect(await service.cancelDockBounce(1)).toBe(false);
    });

    it('onDockMenuAction nem dob hibát', () => {
      expect(() => service.onDockMenuAction(vi.fn())).not.toThrow();
    });
  });
});
