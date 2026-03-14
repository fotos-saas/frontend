import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartnerNotificationService, PartnerNotification } from './partner-notification.service';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('PartnerNotificationService', () => {
  let service: PartnerNotificationService;
  let httpTesting: HttpTestingController;
  let authServiceMock: {
    isPrintShop: ReturnType<typeof vi.fn>;
    getMarketerToken: ReturnType<typeof vi.fn>;
  };
  let loggerMock: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  const mockNotification: PartnerNotification = {
    id: 1,
    type: 'project_created',
    title: 'Új projekt létrehozva',
    message: 'Teszt projekt',
    emoji: '🎉',
    action_url: '/projects/1',
    metadata: null,
    is_read: false,
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockNotification2: PartnerNotification = {
    id: 2,
    type: 'order_completed',
    title: 'Rendelés teljesítve',
    message: null,
    emoji: '✅',
    action_url: null,
    metadata: { order_id: 42 },
    is_read: true,
    read_at: '2026-01-01T12:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
  };

  const baseUrl = `${environment.apiUrl}/partner/notifications`;

  beforeEach(() => {
    vi.useFakeTimers();

    authServiceMock = {
      isPrintShop: vi.fn().mockReturnValue(false),
      getMarketerToken: vi.fn().mockReturnValue('valid-token'),
    };
    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PartnerNotificationService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(PartnerNotificationService);
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
    it('üres értesítés lista', () => {
      expect(service.notifications()).toEqual([]);
    });

    it('0 olvasatlan szám', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('loading false', () => {
      expect(service.loading()).toBe(false);
    });

    it('hasUnread false', () => {
      expect(service.hasUnread()).toBe(false);
    });
  });

  // ============================================================================
  // hasUnread computed
  // ============================================================================
  describe('hasUnread computed', () => {
    it('true ha van olvasatlan', () => {
      service.unreadCount.set(3);
      expect(service.hasUnread()).toBe(true);
    });

    it('false ha nincs olvasatlan', () => {
      service.unreadCount.set(0);
      expect(service.hasUnread()).toBe(false);
    });
  });

  // ============================================================================
  // baseUrl — partner vs print-shop prefix
  // ============================================================================
  describe('baseUrl prefix', () => {
    it('partner prefix-et használ alapértelmezetten', () => {
      service.refreshUnreadCount();

      const req = httpTesting.expectOne(r =>
        r.url === `${environment.apiUrl}/partner/notifications/unread-count`
      );
      req.flush({ success: true, data: { unread_count: 0 } });
    });

    it('print-shop prefix-et használ ha isPrintShop true', () => {
      authServiceMock.isPrintShop.mockReturnValue(true);

      service.refreshUnreadCount();

      const req = httpTesting.expectOne(r =>
        r.url === `${environment.apiUrl}/print-shop/notifications/unread-count`
      );
      req.flush({ success: true, data: { unread_count: 0 } });
    });
  });

  // ============================================================================
  // startPolling
  // ============================================================================
  describe('startPolling', () => {
    it('azonnal lekéri az olvasatlan számot', () => {
      service.startPolling();

      const req = httpTesting.expectOne(r =>
        r.url === `${baseUrl}/unread-count`
      );
      req.flush({ success: true, data: { unread_count: 5 } });

      expect(service.unreadCount()).toBe(5);
    });

    it('60 másodpercenként lekérdezi az unread count-ot', () => {
      service.startPolling();

      // Első kérés (azonnali)
      const req1 = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req1.flush({ success: true, data: { unread_count: 2 } });

      // 60s múlva
      vi.advanceTimersByTime(60_000);
      const req2 = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req2.flush({ success: true, data: { unread_count: 3 } });

      expect(service.unreadCount()).toBe(3);
    });

    it('nem indít duplán polling-ot', () => {
      service.startPolling();
      service.startPolling();

      // Csak egy kérés legyen
      const reqs = httpTesting.match(r => r.url === `${baseUrl}/unread-count`);
      expect(reqs.length).toBe(1);
      reqs[0].flush({ success: true, data: { unread_count: 0 } });
    });

    it('nem indít polling-ot ha nincs marketer token', () => {
      authServiceMock.getMarketerToken.mockReturnValue(null);

      service.startPolling();

      httpTesting.expectNone(r => r.url === `${baseUrl}/unread-count`);
    });

    it('nem indít polling-ot ha pollingStopped (clear() után)', () => {
      service.clear();

      service.startPolling();

      httpTesting.expectNone(r => r.url === `${baseUrl}/unread-count`);
    });
  });

  // ============================================================================
  // stopPolling
  // ============================================================================
  describe('stopPolling', () => {
    it('leállítja a periodikus lekérdezést', () => {
      service.startPolling();

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req.flush({ success: true, data: { unread_count: 0 } });

      service.stopPolling();

      vi.advanceTimersByTime(60_000);
      httpTesting.expectNone(r => r.url === `${baseUrl}/unread-count`);
    });
  });

  // ============================================================================
  // refreshUnreadCount
  // ============================================================================
  describe('refreshUnreadCount', () => {
    it('frissíti az olvasatlan számot', () => {
      service.refreshUnreadCount();

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req.flush({ success: true, data: { unread_count: 7 } });

      expect(service.unreadCount()).toBe(7);
    });

    it('nem frissít ha success false', () => {
      service.unreadCount.set(5);
      service.refreshUnreadCount();

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req.flush({ success: false, data: { unread_count: 0 } });

      expect(service.unreadCount()).toBe(5);
    });

    it('clear-t hív ha nincs marketer token', () => {
      authServiceMock.getMarketerToken.mockReturnValue(null);
      service.unreadCount.set(5);
      service.notifications.set([mockNotification]);

      service.refreshUnreadCount();

      httpTesting.expectNone(r => r.url.includes('unread-count'));
      expect(service.unreadCount()).toBe(0);
      expect(service.notifications()).toEqual([]);
    });

    it('401 hiba esetén clear-t hív', () => {
      service.startPolling();
      const req1 = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req1.flush({ success: true, data: { unread_count: 3 } });

      service.unreadCount.set(3);

      // Következő poll 401-et ad
      vi.advanceTimersByTime(60_000);
      const req2 = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req2.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(service.unreadCount()).toBe(0);
    });
  });

  // ============================================================================
  // loadNotifications
  // ============================================================================
  describe('loadNotifications', () => {
    it('betölti az értesítéseket', () => {
      service.loadNotifications();

      expect(service.loading()).toBe(true);

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('limit')).toBe('10');

      req.flush({
        success: true,
        data: { notifications: [mockNotification, mockNotification2], unread_count: 1 },
      });

      expect(service.notifications()).toEqual([mockNotification, mockNotification2]);
      expect(service.unreadCount()).toBe(1);
      expect(service.loading()).toBe(false);
    });

    it('egyéni limit-et használ', () => {
      service.loadNotifications(25);

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('limit')).toBe('25');
      req.flush({ success: true, data: { notifications: [], unread_count: 0 } });
    });

    it('hiba esetén loading false-ra áll', () => {
      service.loadNotifications();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.error(new ProgressEvent('error'));

      expect(service.loading()).toBe(false);
    });

    it('success false esetén nem frissíti a state-et', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(5);

      service.loadNotifications();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush({ success: false, data: { notifications: [], unread_count: 0 } });

      expect(service.notifications()).toEqual([mockNotification]);
      expect(service.unreadCount()).toBe(5);
      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // markAsRead
  // ============================================================================
  describe('markAsRead', () => {
    it('optimistic update: azonnal olvasottnak jelöli', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(1);

      service.markAsRead(1);

      // Optimistic update azonnal érvényes
      expect(service.notifications()[0].is_read).toBe(true);
      expect(service.notifications()[0].read_at).toBeTruthy();
      expect(service.unreadCount()).toBe(0);

      const req = httpTesting.expectOne(`${baseUrl}/1/read`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('már olvasott értesítés nem csökkenti az unread count-ot', () => {
      service.notifications.set([mockNotification2]); // is_read: true
      service.unreadCount.set(0);

      service.markAsRead(2);

      expect(service.unreadCount()).toBe(0);

      const req = httpTesting.expectOne(`${baseUrl}/2/read`);
      req.flush({ success: true });
    });

    it('unread count nem megy 0 alá', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(0);

      service.markAsRead(1);

      expect(service.unreadCount()).toBe(0);

      const req = httpTesting.expectOne(`${baseUrl}/1/read`);
      req.flush({ success: true });
    });

    it('hiba esetén visszaállítja az eredeti state-et', () => {
      const originalNotifications = [{ ...mockNotification }];
      service.notifications.set(originalNotifications);
      service.unreadCount.set(1);

      service.markAsRead(1);

      const req = httpTesting.expectOne(`${baseUrl}/1/read`);
      req.error(new ProgressEvent('error'));

      // Rollback
      expect(service.notifications()[0].is_read).toBe(false);
      expect(service.unreadCount()).toBe(1);
    });

    it('nem létező értesítés esetén nem csökkenti az unread count-ot', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(1);

      service.markAsRead(999);

      expect(service.unreadCount()).toBe(1);

      const req = httpTesting.expectOne(`${baseUrl}/999/read`);
      req.flush({ success: true });
    });
  });

  // ============================================================================
  // markAllAsRead
  // ============================================================================
  describe('markAllAsRead', () => {
    it('optimistic update: mindent olvasottnak jelöl', () => {
      service.notifications.set([mockNotification, { ...mockNotification, id: 3 }]);
      service.unreadCount.set(2);

      service.markAllAsRead();

      expect(service.notifications().every(n => n.is_read)).toBe(true);
      expect(service.notifications().every(n => n.read_at !== null)).toBe(true);
      expect(service.unreadCount()).toBe(0);

      const req = httpTesting.expectOne(`${baseUrl}/read-all`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('hiba esetén visszaállítja az eredeti state-et', () => {
      const original = [{ ...mockNotification }];
      service.notifications.set(original);
      service.unreadCount.set(1);

      service.markAllAsRead();

      const req = httpTesting.expectOne(`${baseUrl}/read-all`);
      req.error(new ProgressEvent('error'));

      // Rollback
      expect(service.notifications()[0].is_read).toBe(false);
      expect(service.unreadCount()).toBe(1);
    });
  });

  // ============================================================================
  // clear
  // ============================================================================
  describe('clear', () => {
    it('törli az összes state-et', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(5);

      service.clear();

      expect(service.notifications()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
    });

    it('leállítja a polling-ot', () => {
      service.startPolling();

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/unread-count`);
      req.flush({ success: true, data: { unread_count: 0 } });

      service.clear();

      vi.advanceTimersByTime(60_000);
      httpTesting.expectNone(r => r.url.includes('unread-count'));
    });

    it('megakadályozza a polling újraindítását', () => {
      service.clear();

      service.startPolling();

      httpTesting.expectNone(r => r.url.includes('notifications'));
    });
  });
});
