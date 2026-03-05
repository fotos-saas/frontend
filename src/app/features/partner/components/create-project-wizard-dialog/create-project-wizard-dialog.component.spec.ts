import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateProjectWizardDialogComponent } from './create-project-wizard-dialog.component';
import { PartnerService } from '../../services/partner.service';
import { PartnerFileUploadService } from '../../services/partner-file-upload.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('CreateProjectWizardDialogComponent', () => {
  let component: CreateProjectWizardDialogComponent;
  let fixture: ComponentFixture<CreateProjectWizardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProjectWizardDialogComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
        { provide: PartnerFileUploadService, useValue: {} },
        { provide: OrderValidationService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProjectWizardDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
