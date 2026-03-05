import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RosterStepComponent } from './roster-step.component';
import { OrderValidationService } from '../../../services/order-validation.service';
import { TeacherMatchService } from '../../../services/teacher-match.service';

describe('RosterStepComponent', () => {
  let component: RosterStepComponent;
  let fixture: ComponentFixture<RosterStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RosterStepComponent],
      providers: [
        { provide: OrderValidationService, useValue: {} },
        { provide: TeacherMatchService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RosterStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
