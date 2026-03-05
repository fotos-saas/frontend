import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService, Notification } from './notification.service';
import { WebsocketService } from './websocket.service';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

/**
 * NotificationService unit tesztek
 *
 * Értesítések betöltése, olvasottnak jelölés, helyi state kezelés.
 */
describe('NotificationService', () => {
  let service: NotificationService;
  let httpTesting: HttpTestingController;
  let wsMock: { private: ReturnType<typeof vi.fn>; leave: ReturnType<typeof vi.fn> };
  let loggerMock: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let toastMock: { info: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const mockNotification: Notification = {
    id: 1,
    type: 'mention',
    title: 'Teszt értesítés',
    body: 'Teszt szöveg',
    data: {},
    action_url: '/test',
    is_read: false,
    read_at: null,
    created_at: '2025-01-01T00:00:00Z',
  };

  const mockNotification2: Notification = {
    id: 2,
    type: 'reply',
    title: 'Második értesítés',
    body: 'Második szöveg',
    data: {},
    action_url: null,
    is_read: true,
    read_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T01:00:00Z',
  };

  beforeEach(() => {
    wsMock = { private: vi.fn(), leave: vi.fn() };
    loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    toastMock = { info: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationService,
        { provide: WebsocketService, useValue: wsMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });

    service = TestBed.inject(NotificationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('alapállapot', () => {
    it('üres értesítés lista és 0 olvasatlan', () => {
      expect(service.notifications()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
      expect(service.loading()).toBe(false);
      expect(service.hasUnread()).toBe(false);
      expect(service.recentNotifications()).toEqual([]);
    });
  });

  describe('loadNotifications', () => {
    it('betölti az értesítéseket és frissíti a state-et', () => {
      service.loadNotifications(1).subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/notifications`
      );
      expect(req.request.params.get('limit')).toBe('50');
      expect(req.request.params.has('unread_only')).toBe(false);

      req.flush({
        success: true,
        data: { notifications: [mockNotification], unread_count: 1 },
      });

      expect(service.notifications()).toEqual([mockNotification]);
      expect(service.unreadCount()).toBe(1);
      expect(service.loading()).toBe(false);
    });

    it('unreadOnly paraméterrel szűr', () => {
      service.loadNotifications(1, true).subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/notifications`
      );
      expect(req.request.params.get('unread_only')).toBe('true');
      req.flush({ success: true, data: { notifications: [], unread_count: 0 } });
    });

    it('hiba esetén loading false-ra állítódik', () => {
      service.loadNotifications(1).subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url === `${environment.apiUrl}/tablo-frontend/notifications`
      );
      req.error(new ProgressEvent('error'));

      expect(service.loading()).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('olvasottnak jelöli az értesítést és frissíti a helyi state-et', () => {
      // Először betöltünk értesítéseket
      service.notifications.set([mockNotification, mockNotification2]);
      service.unreadCount.set(1);

      service.markAsRead(1, 1).subscribe();

      const req = httpTesting.expectOne(
        `${environment.apiUrl}/tablo-frontend/notifications/1/read`
      );
      expect(req.request.method).toBe('POST');
      req.flush(null);

      const updated = service.notifications();
      expect(updated[0].is_read).toBe(true);
      expect(updated[0].read_at).toBeTruthy();
      expect(service.unreadCount()).toBe(0);
    });

    it('unread count nem megy 0 alá', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(0);

      service.markAsRead(1, 1).subscribe();

      const req = httpTesting.expectOne(
        `${environment.apiUrl}/tablo-frontend/notifications/1/read`
      );
      req.flush(null);

      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('minden értesítést olvasottnak jelöl', () => {
      service.notifications.set([mockNotification, mockNotification2]);
      service.unreadCount.set(2);

      service.markAllAsRead(1).subscribe();

      const req = httpTesting.expectOne(
        `${environment.apiUrl}/tablo-frontend/notifications/read-all`
      );
      expect(req.request.method).toBe('POST');
      req.flush(null);

      const updated = service.notifications();
      expect(updated.every((n) => n.is_read)).toBe(true);
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('addLocalNotification', () => {
    it('hozzáadja az értesítést a lista elejére', () => {
      service.notifications.set([mockNotification2]);
      service.unreadCount.set(0);

      service.addLocalNotification(mockNotification);

      expect(service.notifications().length).toBe(2);
      expect(service.notifications()[0]).toBe(mockNotification);
      expect(service.unreadCount()).toBe(1);
    });

    it('olvasott értesítés nem növeli az unread count-ot', () => {
      service.unreadCount.set(0);
      service.addLocalNotification(mockNotification2); // is_read: true
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('törli az értesítéseket és az unread count-ot', () => {
      service.notifications.set([mockNotification]);
      service.unreadCount.set(5);

      service.clear();

      expect(service.notifications()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
    });
  });

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

  describe('recentNotifications computed', () => {
    it('az első 5 értesítést adja vissza', () => {
      const notifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockNotification,
        id: i + 1,
      }));
      service.notifications.set(notifications);

      const recent = service.recentNotifications();
      expect(recent.length).toBe(5);
      expect(recent[0].id).toBe(1);
      expect(recent[4].id).toBe(5);
    });

    it('kevesebb mint 5 értesítés esetén mindegyiket visszaadja', () => {
      service.notifications.set([mockNotification]);
      expect(service.recentNotifications().length).toBe(1);
    });
  });

  describe('subscribeToNotifications', () => {
    it('feliratkozik a websocket csatornára', () => {
      const channelMock = {
        listen: vi.fn().mockReturnThis(),
        error: vi.fn().mockReturnThis(),
      };
      wsMock.private.mockReturnValue(channelMock);

      service.subscribeToNotifications(1, 'contact', 42);

      expect(wsMock.private).toHaveBeenCalledWith('notifications.1.contact.42');
      expect(channelMock.listen).toHaveBeenCalledWith('.new.notification', expect.any(Function));
    });

    it('nem iratkozik fel ha a channel null', () => {
      wsMock.private.mockReturnValue(null);

      service.subscribeToNotifications(1, 'contact', 42);

      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('unsubscribeFromNotifications', () => {
    it('leiratkozik a websocket csatornáról', () => {
      service.unsubscribeFromNotifications(1, 'guest', 10);

      expect(wsMock.leave).toHaveBeenCalledWith('notifications.1.guest.10');
    });
  });

  describe('refreshUnreadCount', () => {
    it('frissíti az olvasatlan számot', () => {
      service.refreshUnreadCount(1);

      const req = httpTesting.expectOne(
        `${environment.apiUrl}/tablo-frontend/notifications/unread-count`
      );
      req.flush({ success: true, data: { unread_count: 7 } });

      expect(service.unreadCount()).toBe(7);
    });
  });
});
