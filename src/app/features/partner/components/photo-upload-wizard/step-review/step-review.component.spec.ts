import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StepReviewComponent } from './step-review.component';
import { StepReviewService } from './step-review.service';

describe('StepReviewComponent', () => {
  let component: StepReviewComponent;
  let fixture: ComponentFixture<StepReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepReviewComponent],
      providers: [
        { provide: StepReviewService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StepReviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
