import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../../core/services/notification.service';
import { GuestService } from '../../../core/services/guest.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../../core/services/logger.service';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;

  beforeEach(async () => {
    const mockNotificationService = {
      unreadCount: vi.fn().mockReturnValue(null),
      hasUnread: vi.fn().mockReturnValue(null),
      markAllAsRead: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      markAsRead: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      fetchRecentForDropdown: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      refreshUnreadCount: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockGuestService = {
      currentProjectId: vi.fn().mockReturnValue(null)
    };
    const mockLoggerService = {
      warn: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: Router, useValue: { navigate: vi.fn(), events: { subscribe: vi.fn() }, url: '/' } },
        { provide: LoggerService, useValue: mockLoggerService }
      ],
    })
    .overrideComponent(NotificationBellComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
