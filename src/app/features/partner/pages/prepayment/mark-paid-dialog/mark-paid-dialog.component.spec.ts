import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarkPaidDialogComponent } from './mark-paid-dialog.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';

describe('MarkPaidDialogComponent', () => {
  let component: MarkPaidDialogComponent;
  let fixture: ComponentFixture<MarkPaidDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkPaidDialogComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkPaidDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
