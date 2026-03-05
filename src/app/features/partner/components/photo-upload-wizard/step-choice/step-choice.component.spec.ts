import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StepChoiceComponent } from './step-choice.component';

describe('StepChoiceComponent', () => {
  let component: StepChoiceComponent;
  let fixture: ComponentFixture<StepChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepChoiceComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StepChoiceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
