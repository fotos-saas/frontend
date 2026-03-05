import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivityDetailTabComponent } from './activity-detail-tab.component';
import { PartnerActivityService } from '../../../../services/partner-activity.service';
import { PartnerService } from '../../../../services/partner.service';
import { Router } from '@angular/router';

describe('ActivityDetailTabComponent', () => {
  let component: ActivityDetailTabComponent;
  let fixture: ComponentFixture<ActivityDetailTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityDetailTabComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerActivityService, useValue: {} },
        { provide: PartnerService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityDetailTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
