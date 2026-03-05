import { TestBed } from '@angular/core/testing';
import { PokeService } from './poke.service';
import { PokePresetService } from './poke-preset.service';
import { PokeActionService } from './poke-action.service';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';

describe('PokeService (Facade)', () => {
  let service: PokeService;

  const mockPresetService = {
    presets: signal([]),
    missingCategories: signal({ voting: null, photoshoot: null, image_selection: null }),
    missingSummary: signal(null),
    loading: signal(false),
    presetsForCategory: vi.fn().mockReturnValue([]),
    loadPresets: vi.fn().mockReturnValue(of([])),
    loadMissingUsers: vi.fn().mockReturnValue(of(true)),
  };

  const mockActionService = {
    sentPokes: signal([]),
    receivedPokes: signal([]),
    dailyLimit: signal(null),
    unreadCount: signal(0),
    hasUnread: signal(false),
    hasReachedDailyLimit: signal(false),
    totalMissing: signal(0),
    newPokeNotification$: new Subject().asObservable(),
    sendPoke: vi.fn().mockReturnValue(of(null)),
    loadSentPokes: vi.fn().mockReturnValue(of([])),
    loadReceivedPokes: vi.fn().mockReturnValue(of([])),
    addReaction: vi.fn().mockReturnValue(of(null)),
    markAsRead: vi.fn().mockReturnValue(of(true)),
    markAllAsRead: vi.fn().mockReturnValue(of(0)),
    refreshUnreadCount: vi.fn().mockReturnValue(of(0)),
    refreshDailyLimit: vi.fn().mockReturnValue(of(null)),
    initialize: vi.fn().mockReturnValue(of(true)),
    subscribeToNotifications: vi.fn(),
    unsubscribeFromNotifications: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PokeService,
        { provide: PokePresetService, useValue: mockPresetService },
        { provide: PokeActionService, useValue: mockActionService },
      ],
    });
    service = TestBed.inject(PokeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sendPoke delegál', () => {
    service.sendPoke(1, 'general', 'key', 'msg');
    expect(mockActionService.sendPoke).toHaveBeenCalledWith(1, 'general', 'key', 'msg');
  });

  it('loadPresets delegál', () => {
    service.loadPresets('voting' as any);
    expect(mockPresetService.loadPresets).toHaveBeenCalledWith('voting');
  });

  it('markAllAsRead delegál', () => {
    service.markAllAsRead();
    expect(mockActionService.markAllAsRead).toHaveBeenCalled();
  });

  it('clear delegál', () => {
    service.clear();
    expect(mockActionService.clear).toHaveBeenCalled();
  });

  it('subscribeToNotifications delegál', () => {
    service.subscribeToNotifications(1, 2);
    expect(mockActionService.subscribeToNotifications).toHaveBeenCalledWith(1, 2);
  });
});
