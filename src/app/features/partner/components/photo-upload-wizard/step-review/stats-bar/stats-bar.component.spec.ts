import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReviewStatsBarComponent } from './stats-bar.component';

describe('ReviewStatsBarComponent', () => {
  let component: ReviewStatsBarComponent;
  let fixture: ComponentFixture<ReviewStatsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewStatsBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewStatsBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
