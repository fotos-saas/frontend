import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TimeSlotPickerComponent } from './time-slot-picker.component';

describe('TimeSlotPickerComponent', () => {
  let component: TimeSlotPickerComponent;
  let fixture: ComponentFixture<TimeSlotPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSlotPickerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSlotPickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
