import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BatchImportComponent } from './batch-import.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { of } from 'rxjs';

describe('BatchImportComponent', () => {
  let component: BatchImportComponent;
  let fixture: ComponentFixture<BatchImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchImportComponent],
      providers: [
        { provide: PartnerBookingService, useValue: { getSessionTypes: vi.fn().mockReturnValue(of([])), importBookings: vi.fn().mockReturnValue(of({})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchImportComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
