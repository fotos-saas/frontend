import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { NavbarStateService } from './navbar-state.service';
import { BreakpointService } from '../../../core/services/breakpoint.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    const mockNavbarStateService = {
      canFinalize: vi.fn().mockReturnValue(null),
      isGuest: vi.fn().mockReturnValue(null),
      isPreview: vi.fn().mockReturnValue(null),
      isCode: vi.fn().mockReturnValue(null),
      primaryContact: vi.fn().mockReturnValue(null),
      hasGuestSession: vi.fn().mockReturnValue(null),
      guestName: vi.fn().mockReturnValue(null),
      guestEmail: vi.fn().mockReturnValue(null),
      displayName: vi.fn().mockReturnValue(null),
      contactDisplayName: vi.fn().mockReturnValue(null),
      pokeUnreadCount: vi.fn().mockReturnValue(null),
      showEditDialog: vi.fn().mockReturnValue(null),
      isUpdating: vi.fn().mockReturnValue(null),
      updateError: vi.fn().mockReturnValue(null),
      showContactEditDialog: vi.fn().mockReturnValue(null),
      isContactUpdating: vi.fn().mockReturnValue(null),
      contactUpdateError: vi.fn().mockReturnValue(null),
      contactEditData: vi.fn().mockReturnValue(null),
      loggingOut: vi.fn(),
      initSubscriptions: vi.fn().mockReturnValue(null),
      getStatusBadgeClasses: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      getStatusName: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showSamples: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showOrderData: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showTemplateChooser: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showPersons: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showFinalization: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      showVoting: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      openEditDialog: vi.fn().mockReturnValue(null),
      closeEditDialog: vi.fn().mockReturnValue(null),
      openContactEditDialog: vi.fn().mockReturnValue(null),
      closeContactEditDialog: vi.fn().mockReturnValue(null),
      onEditDialogResult: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      onContactEditResult: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      logout: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockBreakpointService = {
      unobserve: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      observeElement: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockScrollLockService = {
      lock: vi.fn().mockReturnValue(null),
      unlock: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: NavbarStateService, useValue: mockNavbarStateService },
        { provide: BreakpointService, useValue: mockBreakpointService },
        { provide: ScrollLockService, useValue: mockScrollLockService }
      ],
    })
    .overrideComponent(NavbarComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
