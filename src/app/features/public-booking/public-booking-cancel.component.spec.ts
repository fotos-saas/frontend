import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PublicBookingCancelComponent } from './public-booking-cancel.component';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from './services/public-booking.service';
import { of } from 'rxjs';

describe('PublicBookingCancelComponent', () => {
  let component: PublicBookingCancelComponent;
  let fixture: ComponentFixture<PublicBookingCancelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBookingCancelComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: PublicBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicBookingCancelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
