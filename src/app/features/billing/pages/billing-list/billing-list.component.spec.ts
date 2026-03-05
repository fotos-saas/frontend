import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BillingListComponent } from './billing-list.component';
import { BillingService } from '../../services/billing.service';

describe('BillingListComponent', () => {
  let component: BillingListComponent;
  let fixture: ComponentFixture<BillingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingListComponent],
      providers: [
        { provide: BillingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
