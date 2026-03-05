import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PublicBookingRescheduleComponent } from './public-booking-reschedule.component';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from './services/public-booking.service';
import { of } from 'rxjs';

describe('PublicBookingRescheduleComponent', () => {
  let component: PublicBookingRescheduleComponent;
  let fixture: ComponentFixture<PublicBookingRescheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBookingRescheduleComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: PublicBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicBookingRescheduleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
