import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RefundDialogComponent } from './refund-dialog.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';

describe('RefundDialogComponent', () => {
  let component: RefundDialogComponent;
  let fixture: ComponentFixture<RefundDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundDialogComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RefundDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
