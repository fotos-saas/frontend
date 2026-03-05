import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreatePrepaymentDialogComponent } from './create-prepayment-dialog.component';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import { PartnerProjectService } from '../../../services/partner-project.service';

describe('CreatePrepaymentDialogComponent', () => {
  let component: CreatePrepaymentDialogComponent;
  let fixture: ComponentFixture<CreatePrepaymentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePrepaymentDialogComponent],
      providers: [
        { provide: PartnerPrepaymentService, useValue: {} },
        { provide: PartnerProjectService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePrepaymentDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
