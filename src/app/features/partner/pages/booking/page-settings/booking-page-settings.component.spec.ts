import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BookingPageSettingsComponent } from './booking-page-settings.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('BookingPageSettingsComponent', () => {
  let component: BookingPageSettingsComponent;
  let fixture: ComponentFixture<BookingPageSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingPageSettingsComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingPageSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
