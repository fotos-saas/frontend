import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SuperAdminShellComponent } from './super-admin-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { BugReportService } from '../../shared/services/bug-report.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SuperAdminShellComponent', () => {
  let component: SuperAdminShellComponent;
  let fixture: ComponentFixture<SuperAdminShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminShellComponent],
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ name: 'Test', roles: ['super_admin'], partners_count: 1 }), project$: of(null), isGuest: () => false, isSuperAdmin: () => true } },
        { provide: SidebarStateService, useValue: { collapsed: vi.fn().mockReturnValue(false), toggle: vi.fn() } },
        { provide: BugReportService, useValue: { getUnreadCount: vi.fn().mockReturnValue(of(0)) } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(SuperAdminShellComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
