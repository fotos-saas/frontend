import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PublicBookingComponent } from './public-booking.component';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from './services/public-booking.service';
import { of } from 'rxjs';

describe('PublicBookingComponent', () => {
  let component: PublicBookingComponent;
  let fixture: ComponentFixture<PublicBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBookingComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: PublicBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicBookingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
