import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AccountDeleteComponent } from './account-delete.component';
import { LoggerService } from '@core/services/logger.service';
import { SubscriptionService } from '../../../services/subscription.service';
import { AuthService } from '../../../../../core/services/auth.service';

describe('AccountDeleteComponent', () => {
  let component: AccountDeleteComponent;
  let fixture: ComponentFixture<AccountDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDeleteComponent],
      providers: [
        { provide: LoggerService, useValue: {} },
        { provide: SubscriptionService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDeleteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
