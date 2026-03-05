import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivitySummaryTabComponent } from './activity-summary-tab.component';
import { PartnerActivityService } from '../../../../services/partner-activity.service';
import { TeamService } from '../../../../services/team.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { of } from 'rxjs';

describe('ActivitySummaryTabComponent', () => {
  let component: ActivitySummaryTabComponent;
  let fixture: ComponentFixture<ActivitySummaryTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitySummaryTabComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerActivityService, useValue: {} },
        { provide: TeamService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitySummaryTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
