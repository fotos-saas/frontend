import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DailyViewComponent } from './daily-view.component';
import { BookingCalendarStateService } from '../../../../services/booking-calendar-state.service';

describe('DailyViewComponent', () => {
  let component: DailyViewComponent;
  let fixture: ComponentFixture<DailyViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyViewComponent],
      providers: [
        { provide: BookingCalendarStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
