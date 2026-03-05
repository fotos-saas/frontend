import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerOrderWizardDialogComponent } from './partner-order-wizard-dialog.component';
import { PartnerFinalizationApiService } from '../../services/partner-finalization-api.service';
import { PartnerFileUploadService } from '../../services/partner-file-upload.service';
import { PartnerService } from '../../services/partner.service';
import { OrderValidationService } from '../../../order-finalization/services/order-validation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('PartnerOrderWizardDialogComponent', () => {
  let component: PartnerOrderWizardDialogComponent;
  let fixture: ComponentFixture<PartnerOrderWizardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerOrderWizardDialogComponent],
      providers: [
        { provide: PartnerFinalizationApiService, useValue: {} },
        { provide: PartnerFileUploadService, useValue: {} },
        { provide: PartnerService, useValue: {} },
        { provide: OrderValidationService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerOrderWizardDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
