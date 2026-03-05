import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UpgradeDialogComponent } from './upgrade-dialog.component';
import { LoggerService } from '@core/services/logger.service';
import { PlansService } from '../../services/plans.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

describe('UpgradeDialogComponent', () => {
  let component: UpgradeDialogComponent;
  let fixture: ComponentFixture<UpgradeDialogComponent>;

  beforeEach(async () => {
    const mockLoggerService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockPlansService = {
      getUpgradeData: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      getPricingPlans: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockPaymentService = {
      openCustomerPortal: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockAuthService = {
      getCurrentUser: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [UpgradeDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: PlansService, useValue: mockPlansService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: AuthService, useValue: mockAuthService }
      ],
    })
    .overrideComponent(UpgradeDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });
});
