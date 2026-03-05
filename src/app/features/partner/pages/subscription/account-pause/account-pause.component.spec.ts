import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AccountPauseComponent } from './account-pause.component';
import { LoggerService } from '@core/services/logger.service';
import { SubscriptionService } from '../../../services/subscription.service';
import { of } from 'rxjs';

describe('AccountPauseComponent', () => {
  let component: AccountPauseComponent;
  let fixture: ComponentFixture<AccountPauseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountPauseComponent],
      providers: [
        { provide: LoggerService, useValue: {} },
        { provide: SubscriptionService, useValue: { clearCache: vi.fn(), getSubscription: vi.fn().mockReturnValue(of({})), getSubscriptionInfo: vi.fn().mockReturnValue(of({})), pauseSubscription: vi.fn().mockReturnValue(of({})), resumeSubscription: vi.fn().mockReturnValue(of({})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPauseComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
