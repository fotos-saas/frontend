import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BasicInfoStepComponent } from './basic-info-step.component';
import { OrderValidationService } from '../../../services/order-validation.service';

describe('BasicInfoStepComponent', () => {
  let component: BasicInfoStepComponent;
  let fixture: ComponentFixture<BasicInfoStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicInfoStepComponent],
      providers: [
        { provide: OrderValidationService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicInfoStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
