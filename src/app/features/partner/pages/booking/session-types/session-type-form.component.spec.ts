import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SessionTypeFormComponent } from './session-type-form.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('SessionTypeFormComponent', () => {
  let component: SessionTypeFormComponent;
  let fixture: ComponentFixture<SessionTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionTypeFormComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionTypeFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
