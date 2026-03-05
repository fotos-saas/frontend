import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrepaymentDetailDialogComponent } from './prepayment-detail-dialog.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';

describe('PrepaymentDetailDialogComponent', () => {
  let component: PrepaymentDetailDialogComponent;
  let fixture: ComponentFixture<PrepaymentDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepaymentDetailDialogComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepaymentDetailDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
