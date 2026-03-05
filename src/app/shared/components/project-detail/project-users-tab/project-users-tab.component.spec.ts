import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectUsersTabComponent } from './project-users-tab.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DevLoginService } from '../../../../core/services/dev-login.service';
import { DatePipe } from '@angular/common';

describe('ProjectUsersTabComponent', () => {
  let component: ProjectUsersTabComponent;
  let fixture: ComponentFixture<ProjectUsersTabComponent>;

  beforeEach(async () => {
    const mockPartnerService = {
      getProjectGuestSessions: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      toggleBanGuestSession: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      deleteGuestSession: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockToastService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      success: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockClipboardService = {
      copyLink: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockDevLoginService = {
      isDevMode: vi.fn().mockReturnValue(null),
      generateDevLoginUrl: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ProjectUsersTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ClipboardService, useValue: mockClipboardService },
        { provide: DevLoginService, useValue: mockDevLoginService }
      ],
    })
    .overrideComponent(ProjectUsersTabComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectUsersTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
