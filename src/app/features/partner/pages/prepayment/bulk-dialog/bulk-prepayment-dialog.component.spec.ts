import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BulkPrepaymentDialogComponent } from './bulk-prepayment-dialog.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import { PartnerProjectService } from '../../../services/partner-project.service';

describe('BulkPrepaymentDialogComponent', () => {
  let component: BulkPrepaymentDialogComponent;
  let fixture: ComponentFixture<BulkPrepaymentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkPrepaymentDialogComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkPrepaymentDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
