import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RescheduleDialogComponent } from './reschedule-dialog.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('RescheduleDialogComponent', () => {
  let component: RescheduleDialogComponent;
  let fixture: ComponentFixture<RescheduleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescheduleDialogComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RescheduleDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
