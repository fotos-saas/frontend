import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DashboardWrapperComponent } from './dashboard-wrapper.component';
import { LoggerService } from '@core/services/logger.service';
import { DASHBOARD_SERVICE } from './dashboard.tokens';
import { Router } from '@angular/router';
import { DASHBOARD_ROUTE_PREFIX } from './dashboard.tokens';
import { DASHBOARD_SUBTITLE } from './dashboard.tokens';
import { DASHBOARD_STAT_CARDS } from './dashboard.tokens';
import { DASHBOARD_QUICK_ACTIONS } from './dashboard.tokens';

describe('DashboardWrapperComponent', () => {
  let component: DashboardWrapperComponent;
  let fixture: ComponentFixture<DashboardWrapperComponent>;

  beforeEach(async () => {
    const mockLoggerService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockDASHBOARD_SERVICE = {
      getStats: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      getProjects: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockDASHBOARD_ROUTE_PREFIX = '/dashboard';
    const mockDASHBOARD_SUBTITLE = 'Test';
    const mockDASHBOARD_STAT_CARDS: never[] = [];
    const mockDASHBOARD_QUICK_ACTIONS: never[] = [];

    await TestBed.configureTestingModule({
      imports: [DashboardWrapperComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: DASHBOARD_SERVICE, useValue: mockDASHBOARD_SERVICE },
        { provide: Router, useValue: { navigate: vi.fn(), events: { subscribe: vi.fn() }, url: '/' } },
        { provide: DASHBOARD_ROUTE_PREFIX, useValue: mockDASHBOARD_ROUTE_PREFIX },
        { provide: DASHBOARD_SUBTITLE, useValue: mockDASHBOARD_SUBTITLE },
        { provide: DASHBOARD_STAT_CARDS, useValue: mockDASHBOARD_STAT_CARDS },
        { provide: DASHBOARD_QUICK_ACTIONS, useValue: mockDASHBOARD_QUICK_ACTIONS }
      ],
    })
    .overrideComponent(DashboardWrapperComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
