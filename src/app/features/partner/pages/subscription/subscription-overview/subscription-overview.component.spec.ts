import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubscriptionOverviewComponent } from './subscription-overview.component';
import { LoggerService } from '@core/services/logger.service';
import { SubscriptionService } from '../../../services/subscription.service';
import { StorageService } from '../../../services/storage.service';
import { PlansService } from '../../../../../shared/services/plans.service';

describe('SubscriptionOverviewComponent', () => {
  let component: SubscriptionOverviewComponent;
  let fixture: ComponentFixture<SubscriptionOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionOverviewComponent],
      providers: [
        { provide: LoggerService, useValue: {} },
        { provide: SubscriptionService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: PlansService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionOverviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
