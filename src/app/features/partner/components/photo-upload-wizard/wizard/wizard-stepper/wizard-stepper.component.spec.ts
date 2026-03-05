import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WizardStepperComponent } from './wizard-stepper.component';

describe('WizardStepperComponent', () => {
  let component: WizardStepperComponent;
  let fixture: ComponentFixture<WizardStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardStepperComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardStepperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
