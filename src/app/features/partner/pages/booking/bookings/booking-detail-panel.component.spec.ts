import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BookingDetailPanelComponent } from './booking-detail-panel.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('BookingDetailPanelComponent', () => {
  let component: BookingDetailPanelComponent;
  let fixture: ComponentFixture<BookingDetailPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailPanelComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingDetailPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
