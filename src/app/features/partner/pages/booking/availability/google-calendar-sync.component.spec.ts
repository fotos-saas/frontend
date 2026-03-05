import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GoogleCalendarSyncComponent } from './google-calendar-sync.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('GoogleCalendarSyncComponent', () => {
  let component: GoogleCalendarSyncComponent;
  let fixture: ComponentFixture<GoogleCalendarSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleCalendarSyncComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleCalendarSyncComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
