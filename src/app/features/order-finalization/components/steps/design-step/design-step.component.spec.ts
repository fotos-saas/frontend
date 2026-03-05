import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DesignStepComponent } from './design-step.component';
import { OrderValidationService } from '../../../services/order-validation.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { ToastService } from '../../../../../core/services/toast.service';

describe('DesignStepComponent', () => {
  let component: DesignStepComponent;
  let fixture: ComponentFixture<DesignStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignStepComponent],
      providers: [
        { provide: OrderValidationService, useValue: {} },
        { provide: FileUploadService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
