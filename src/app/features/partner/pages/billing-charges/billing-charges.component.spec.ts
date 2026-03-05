import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BillingChargesComponent } from './billing-charges.component';
import { PartnerBillingService } from '../../services/partner-billing.service';

describe('BillingChargesComponent', () => {
  let component: BillingChargesComponent;
  let fixture: ComponentFixture<BillingChargesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingChargesComponent],
      providers: [
        { provide: PartnerBillingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingChargesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
