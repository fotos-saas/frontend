import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EmailHubDashboardComponent } from './email-hub-dashboard.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { Router } from '@angular/router';
import type { EmailHubDashboard } from '../../models/email-hub.models';

describe('EmailHubDashboardComponent', () => {
  let component: EmailHubDashboardComponent;
  let fixture: ComponentFixture<EmailHubDashboardComponent>;
  let emailHubService: jasmine.SpyObj<EmailHubService>;
  let router: jasmine.SpyObj<Router>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockDashboard: EmailHubDashboard = {
    pendingDrafts: 5,
    pendingApproval: 2,
    escalationCount: 1,
    activeRounds: 3,
    todayProcessed: 12,
    monthlyCostUsd: 4.5,
  };

  beforeEach(async () => {
    emailHubService = jasmine.createSpyObj('EmailHubService', ['getDashboard']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    emailHubService.getDashboard.and.returnValue(of(mockDashboard));

    await TestBed.configureTestingModule({
      imports: [EmailHubDashboardComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EmailHubService, useValue: emailHubService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard on init and set signal', () => {
    fixture.detectChanges();

    expect(emailHubService.getDashboard).toHaveBeenCalled();
    expect(component.dashboard()).toEqual(mockDashboard);
    expect(component.loading()).toBeFalse();
  });

  it('should set loading to false on error', () => {
    emailHubService.getDashboard.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.dashboard()).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should navigate to sub-route via navigateTo', () => {
    fixture.detectChanges();

    component.navigateTo('drafts');
    expect(router.navigate).toHaveBeenCalledWith(['/partner/email-hub', 'drafts']);
  });
});
