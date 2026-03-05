import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BookingStatsComponent } from './booking-stats.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('BookingStatsComponent', () => {
  let component: BookingStatsComponent;
  let fixture: ComponentFixture<BookingStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingStatsComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingStatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
