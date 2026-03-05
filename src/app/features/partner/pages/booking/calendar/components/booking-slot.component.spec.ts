import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BookingSlotComponent } from './booking-slot.component';

describe('BookingSlotComponent', () => {
  let component: BookingSlotComponent;
  let fixture: ComponentFixture<BookingSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingSlotComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSlotComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
