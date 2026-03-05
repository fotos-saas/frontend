import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BookingCalendarComponent } from './booking-calendar.component';
import { BookingCalendarStateService } from '../../../services/booking-calendar-state.service';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { LoggerService } from '../../../../../core/services/logger.service';

describe('BookingCalendarComponent', () => {
  let component: BookingCalendarComponent;
  let fixture: ComponentFixture<BookingCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCalendarComponent],
      providers: [
        { provide: BookingCalendarStateService, useValue: {} },
        { provide: PartnerBookingService, useValue: {} },
        { provide: LoggerService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingCalendarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
