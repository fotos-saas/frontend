import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WeeklyViewComponent } from './weekly-view.component';
import { BookingCalendarStateService } from '../../../../services/booking-calendar-state.service';

describe('WeeklyViewComponent', () => {
  let component: WeeklyViewComponent;
  let fixture: ComponentFixture<WeeklyViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyViewComponent],
      providers: [
        { provide: BookingCalendarStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
