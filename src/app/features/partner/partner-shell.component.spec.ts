import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerShellComponent } from './partner-shell.component';
import { LoggerService } from '@core/services/logger.service';
import { ElectronService } from '../../core/services/electron.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from './services/subscription.service';
import { FeatureToggleService } from '../../core/services/feature-toggle.service';
import { PartnerFinalizationService } from './services/partner-finalization.service';
import { PartnerTaskService } from './services/partner-task.service';
import { PartnerWorkflowService } from './services/partner-workflow.service';
import { BrandingService } from './services/branding.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { of } from 'rxjs';

describe('PartnerShellComponent', () => {
  let component: PartnerShellComponent;
  let fixture: ComponentFixture<PartnerShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerShellComponent],
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: ElectronService, useValue: { isElectron: false } },
        { provide: AuthService, useValue: { getCurrentUser: () => ({ name: 'Test', roles: [], partners_count: 1, partner_id: 1 }), project$: of(null), isGuest: () => false, isSuperAdmin: () => false, hasFullAccess: () => false } },
        { provide: SubscriptionService, useValue: { getSubscriptionInfo: vi.fn().mockReturnValue(of({})), clearCache: vi.fn() } },
        { provide: FeatureToggleService, useValue: { isEnabled: vi.fn().mockReturnValue(false) } },
        { provide: PartnerFinalizationService, useValue: { getInPrintCount: vi.fn().mockReturnValue(of(0)) } },
        { provide: PartnerTaskService, useValue: { getTaskCount: vi.fn().mockReturnValue(of(0)), getPendingCount: vi.fn().mockReturnValue(of({ data: { count: 0 } })) } },
        { provide: PartnerWorkflowService, useValue: { getPendingCount: vi.fn().mockReturnValue(of(0)) } },
        { provide: BrandingService, useValue: { loadBranding: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: SidebarStateService, useValue: { collapsed: vi.fn().mockReturnValue(false), toggle: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PartnerShellComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
