import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContactStepComponent } from './contact-step.component';
import { OrderValidationService } from '../../../services/order-validation.service';

describe('ContactStepComponent', () => {
  let component: ContactStepComponent;
  let fixture: ComponentFixture<ContactStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactStepComponent],
      providers: [
        { provide: OrderValidationService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
