import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PokeActionService } from './poke-action.service';
import { GuestService } from './guest.service';
import { LoggerService } from './logger.service';
import { WebsocketService } from './websocket.service';
import { ToastService } from './toast.service';
import { PokePresetService } from './poke-preset.service';
import { HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';

describe('PokeActionService', () => {
  let service: PokeActionService;
  let httpMock: HttpTestingController;

  const mockGuestService = {
    getGuestSessionHeader: vi.fn().mockReturnValue(new HttpHeaders()),
  };
  const mockPresetService = {
    presets: signal([]),
    missingSummary: signal(null),
    loading: signal(false),
    loadPresets: vi.fn().mockReturnValue(of([])),
    loadMissingUsers: vi.fn().mockReturnValue(of(true)),
    clearPresets: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestService, useValue: mockGuestService },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: WebsocketService, useValue: { private: vi.fn(), leave: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } },
        { provide: PokePresetService, useValue: mockPresetService },
      ],
    });
    service = TestBed.inject(PokeActionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('alapértelmezett állapotok helyesek', () => {
      expect(service.sentPokes()).toEqual([]);
      expect(service.receivedPokes()).toEqual([]);
      expect(service.dailyLimit()).toBeNull();
      expect(service.unreadCount()).toBe(0);
      expect(service.hasUnread()).toBe(false);
      expect(service.hasReachedDailyLimit()).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('POST kérést küld és nullázza az unread-et', async () => {
      service.unreadCount.set(5);
      const promise = firstValueFrom(service.markAllAsRead());
      const req = httpMock.expectOne((r) => r.url.includes('/pokes/read-all'));
      req.flush({ success: true, data: { marked_count: 3 } });

      const count = await promise;
      expect(count).toBe(3);
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('refreshUnreadCount', () => {
    it('olvasatlan számot frissíti', async () => {
      const promise = firstValueFrom(service.refreshUnreadCount());
      const req = httpMock.expectOne((r) => r.url.includes('/pokes/unread-count'));
      req.flush({ success: true, data: { unread_count: 7 } });

      const count = await promise;
      expect(count).toBe(7);
      expect(service.unreadCount()).toBe(7);
    });
  });

  describe('clear', () => {
    it('összes state-et reseteli', () => {
      service.sentPokes.set([{ id: 1 } as any]);
      service.unreadCount.set(3);
      service.clear();
      expect(service.sentPokes()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
      expect(mockPresetService.clearPresets).toHaveBeenCalled();
    });
  });
});
