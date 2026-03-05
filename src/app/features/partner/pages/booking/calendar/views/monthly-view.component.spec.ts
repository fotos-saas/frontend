import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MonthlyViewComponent } from './monthly-view.component';
import { BookingCalendarStateService } from '../../../../services/booking-calendar-state.service';

describe('MonthlyViewComponent', () => {
  let component: MonthlyViewComponent;
  let fixture: ComponentFixture<MonthlyViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyViewComponent],
      providers: [
        { provide: BookingCalendarStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
