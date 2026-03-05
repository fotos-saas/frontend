import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SessionTypesComponent } from './session-types.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';

describe('SessionTypesComponent', () => {
  let component: SessionTypesComponent;
  let fixture: ComponentFixture<SessionTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionTypesComponent],
      providers: [
        { provide: PartnerBookingService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionTypesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
