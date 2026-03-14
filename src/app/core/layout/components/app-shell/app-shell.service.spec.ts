import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, of, EMPTY } from 'rxjs';
import { AppShellService } from './app-shell.service';
import { AuthService } from '../../../services/auth.service';
import { GuestService } from '../../../services/guest.service';
import { ToastService } from '../../../services/toast.service';
import { WebsocketService } from '../../../services/websocket.service';
import { NotificationService } from '../../../services/notification.service';
import { LoggerService } from '../../../services/logger.service';
import { PhotoSelectionReminderService } from '../../../services/photo-selection-reminder.service';

describe('AppShellService', () => {
  let service: AppShellService;

  // Mock subjects
  const project$ = new Subject<any>();
  const canFinalize$ = new Subject<boolean>();
  const sessionInvalidated$ = new Subject<{ reason: string; message: string }>();
  const routerEvents$ = new Subject<any>();

  // Mock services
  const mockAuthService = {
    project$,
    canFinalize$,
    getProject: vi.fn(),
    getToken: vi.fn(),
    isGuest: vi.fn(),
    canFinalize: vi.fn(),
    clearAuth: vi.fn(),
  };

  const mockGuestService = {
    sessionInvalidated$,
    hasRegisteredSession: vi.fn(),
    startSessionPolling: vi.fn(),
    stopSessionPolling: vi.fn(),
    getSessionToken: vi.fn(),
    getGuestId: vi.fn(),
  };

  const mockToastService = {
    error: vi.fn(),
    info: vi.fn(),
  };

  const mockWsService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockNotificationService = {
    subscribeToNotifications: vi.fn(),
    unsubscribeFromNotifications: vi.fn(),
    loadNotifications: vi.fn().mockReturnValue(of(undefined)),
  };

  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockRouter = {
    url: '/home',
    events: routerEvents$.asObservable(),
    navigate: vi.fn(),
  };

  const mockPhotoSelectionReminderService = {
    getEffectiveStep: vi.fn(),
    shouldShowReminder: vi.fn(),
    markAsShownForStep: vi.fn(),
    snoozeForHalfDayForStep: vi.fn(),
  };

  const mockDestroyRef = {
    onDestroy: vi.fn((cb: () => void) => cb),
  };

  const mockCdr: ChangeDetectorRef = {
    markForCheck: vi.fn(),
    detectChanges: vi.fn(),
    checkNoChanges: vi.fn(),
    detach: vi.fn(),
    reattach: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        AppShellService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: ToastService, useValue: mockToastService },
        { provide: WebsocketService, useValue: mockWsService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: Router, useValue: mockRouter },
        { provide: DestroyRef, useValue: mockDestroyRef },
        { provide: PhotoSelectionReminderService, useValue: mockPhotoSelectionReminderService },
      ],
    });
    service = TestBed.inject(AppShellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Kezdeti signal értékek
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('showReminderDialog kezdetben false', () => {
      expect(service.showReminderDialog()).toBe(false);
    });

    it('currentStep kezdetben claiming', () => {
      expect(service.currentStep()).toBe('claiming');
    });
  });

  // ============================================================================
  // initSessionInvalidationWatcher
  // ============================================================================
  describe('initSessionInvalidationWatcher', () => {
    it('banned session esetén error toast-ot mutat és clearAuth-ot hív', () => {
      service.initSessionInvalidationWatcher();

      sessionInvalidated$.next({ reason: 'banned', message: 'Tiltva' });

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Hozzáférés megtagadva',
        'Tiltva',
        8000
      );
      expect(mockAuthService.clearAuth).toHaveBeenCalled();
    });

    it('egyéb invalidáció esetén info toast-ot mutat és clearAuth-ot hív', () => {
      service.initSessionInvalidationWatcher();

      sessionInvalidated$.next({ reason: 'expired', message: 'Lejárt' });

      expect(mockToastService.info).toHaveBeenCalledWith(
        'Munkamenet lejárt',
        'Lejárt',
        5000
      );
      expect(mockAuthService.clearAuth).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // startSessionPollingIfNeeded
  // ============================================================================
  describe('startSessionPollingIfNeeded', () => {
    it('elindítja a pollingot ha van regisztrált session', () => {
      mockGuestService.hasRegisteredSession.mockReturnValue(true);

      service.startSessionPollingIfNeeded();

      expect(mockGuestService.startSessionPolling).toHaveBeenCalled();
    });

    it('NEM indítja el a pollingot ha nincs regisztrált session', () => {
      mockGuestService.hasRegisteredSession.mockReturnValue(false);

      service.startSessionPollingIfNeeded();

      expect(mockGuestService.startSessionPolling).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // initWebSocketAndNotifications
  // ============================================================================
  describe('initWebSocketAndNotifications', () => {
    it('nem csatlakozik ha nincs project', () => {
      mockAuthService.getProject.mockReturnValue(null);
      mockAuthService.getToken.mockReturnValue('token123');

      service.initWebSocketAndNotifications();

      expect(mockWsService.connect).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('nem csatlakozik ha nincs token', () => {
      mockAuthService.getProject.mockReturnValue({ id: 1 });
      mockAuthService.getToken.mockReturnValue(null);

      service.initWebSocketAndNotifications();

      expect(mockWsService.connect).not.toHaveBeenCalled();
    });

    it('guest felhasználóként csatlakozik ws-re sessionToken-nel', () => {
      mockAuthService.getProject.mockReturnValue({ id: 1, contacts: [] });
      mockAuthService.getToken.mockReturnValue('token123');
      mockAuthService.isGuest.mockReturnValue(true);
      mockGuestService.getSessionToken.mockReturnValue('guest-session-xyz');
      mockGuestService.getGuestId.mockReturnValue(42);

      service.initWebSocketAndNotifications();

      expect(mockWsService.connect).toHaveBeenCalledWith('token123', 'guest-session-xyz');
      expect(mockNotificationService.subscribeToNotifications).toHaveBeenCalledWith(1, 'guest', 42);
      expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(1);
    });

    it('contact felhasználóként csatlakozik ws-re', () => {
      mockAuthService.getProject.mockReturnValue({
        id: 5,
        contacts: [{ id: 100, name: 'Teszt' }],
      });
      mockAuthService.getToken.mockReturnValue('token-abc');
      mockAuthService.isGuest.mockReturnValue(false);

      service.initWebSocketAndNotifications();

      expect(mockWsService.connect).toHaveBeenCalledWith('token-abc', undefined);
      expect(mockNotificationService.subscribeToNotifications).toHaveBeenCalledWith(5, 'contact', 100);
      expect(mockNotificationService.loadNotifications).toHaveBeenCalledWith(5);
    });

    it('figyelmeztet ha nincs contact info', () => {
      mockAuthService.getProject.mockReturnValue({ id: 1, contacts: [] });
      mockAuthService.getToken.mockReturnValue('token');
      mockAuthService.isGuest.mockReturnValue(false);

      service.initWebSocketAndNotifications();

      expect(mockWsService.connect).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No contact info')
      );
    });

    it('guest csatlakozás esetén figyelmeztet ha nincs guestId', () => {
      mockAuthService.getProject.mockReturnValue({ id: 1, contacts: [] });
      mockAuthService.getToken.mockReturnValue('token');
      mockAuthService.isGuest.mockReturnValue(true);
      mockGuestService.getSessionToken.mockReturnValue('session-token');
      mockGuestService.getGuestId.mockReturnValue(null);

      service.initWebSocketAndNotifications();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Guest ID not found')
      );
      expect(mockNotificationService.subscribeToNotifications).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // handleReminderResult
  // ============================================================================
  describe('handleReminderResult', () => {
    it('navigate action: markAsShown, dialog bezár, navigál /photo-selection-re', () => {
      mockAuthService.getProject.mockReturnValue({ id: 10 });
      service.currentStep.set('retouch');

      service.handleReminderResult({ action: 'navigate' }, mockCdr);

      expect(mockPhotoSelectionReminderService.markAsShownForStep).toHaveBeenCalledWith(10, 'retouch');
      expect(service.showReminderDialog()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/photo-selection']);
    });

    it('snooze action: snooze, dialog bezár, markForCheck', () => {
      mockAuthService.getProject.mockReturnValue({ id: 10 });
      service.currentStep.set('tablo');

      service.handleReminderResult({ action: 'snooze' }, mockCdr);

      expect(mockPhotoSelectionReminderService.snoozeForHalfDayForStep).toHaveBeenCalledWith(10, 'tablo');
      expect(service.showReminderDialog()).toBe(false);
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('close action: markAsShown, dialog bezár, markForCheck', () => {
      mockAuthService.getProject.mockReturnValue({ id: 10 });
      service.currentStep.set('finalization');

      service.handleReminderResult({ action: 'close' }, mockCdr);

      expect(mockPhotoSelectionReminderService.markAsShownForStep).toHaveBeenCalledWith(10, 'finalization');
      expect(service.showReminderDialog()).toBe(false);
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('backdrop action: csak dialog bezár, markForCheck', () => {
      mockAuthService.getProject.mockReturnValue({ id: 10 });

      service.handleReminderResult({ action: 'backdrop' }, mockCdr);

      expect(mockPhotoSelectionReminderService.markAsShownForStep).not.toHaveBeenCalled();
      expect(mockPhotoSelectionReminderService.snoozeForHalfDayForStep).not.toHaveBeenCalled();
      expect(service.showReminderDialog()).toBe(false);
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('navigate action project nélkül: nem hívja markAsShown-t', () => {
      mockAuthService.getProject.mockReturnValue(null);

      service.handleReminderResult({ action: 'navigate' }, mockCdr);

      expect(mockPhotoSelectionReminderService.markAsShownForStep).not.toHaveBeenCalled();
      expect(service.showReminderDialog()).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/photo-selection']);
    });
  });

  // ============================================================================
  // cleanup
  // ============================================================================
  describe('cleanup', () => {
    it('leállítja a session pollingot és ws-t', () => {
      mockAuthService.getProject.mockReturnValue({ id: 1, contacts: [] });
      mockAuthService.isGuest.mockReturnValue(false);

      service.cleanup();

      expect(mockGuestService.stopSessionPolling).toHaveBeenCalled();
      expect(mockWsService.disconnect).toHaveBeenCalled();
    });

    it('guest felhasználó cleanup: unsubscribe from notifications', () => {
      mockAuthService.getProject.mockReturnValue({ id: 5, contacts: [] });
      mockAuthService.isGuest.mockReturnValue(true);
      mockGuestService.getSessionToken.mockReturnValue('session-abc');
      mockGuestService.getGuestId.mockReturnValue(99);

      service.cleanup();

      expect(mockNotificationService.unsubscribeFromNotifications).toHaveBeenCalledWith(5, 'guest', 99);
      expect(mockWsService.disconnect).toHaveBeenCalled();
    });

    it('contact felhasználó cleanup: unsubscribe from notifications', () => {
      mockAuthService.getProject.mockReturnValue({
        id: 5,
        contacts: [{ id: 200, name: 'Contact' }],
      });
      mockAuthService.isGuest.mockReturnValue(false);

      service.cleanup();

      expect(mockNotificationService.unsubscribeFromNotifications).toHaveBeenCalledWith(5, 'contact', 200);
      expect(mockWsService.disconnect).toHaveBeenCalled();
    });

    it('nincs projekt: nem próbál unsubscribe-olni', () => {
      mockAuthService.getProject.mockReturnValue(null);

      service.cleanup();

      expect(mockNotificationService.unsubscribeFromNotifications).not.toHaveBeenCalled();
      expect(mockWsService.disconnect).not.toHaveBeenCalled();
      expect(mockGuestService.stopSessionPolling).toHaveBeenCalled();
    });
  });
});
