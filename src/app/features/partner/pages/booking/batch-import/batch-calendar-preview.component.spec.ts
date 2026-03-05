import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchCalendarPreviewComponent } from './batch-calendar-preview.component';

describe('BatchCalendarPreviewComponent', () => {
  let component: BatchCalendarPreviewComponent;
  let fixture: ComponentFixture<BatchCalendarPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchCalendarPreviewComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchCalendarPreviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
