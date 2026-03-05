import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BookingCalendarStateService } from './booking-calendar-state.service';

describe('BookingCalendarStateService', () => {
  let service: BookingCalendarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingCalendarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have weekly as default view', () => {
    expect(service.currentView()).toBe('weekly');
  });

  it('setView should change view', () => {
    service.setView('daily');
    expect(service.currentView()).toBe('daily');
  });

  it('setView to monthly', () => {
    service.setView('monthly');
    expect(service.currentView()).toBe('monthly');
  });

  it('goToDate should change current date', () => {
    const date = new Date(2025, 5, 15);
    service.goToDate(date);
    expect(service.currentDate().getTime()).toBe(date.getTime());
  });

  it('dateRange should return start and end dates', () => {
    const range = service.dateRange();
    expect(range.start).toBeTruthy();
    expect(range.end).toBeTruthy();
  });

  it('title should return non-empty string', () => {
    expect(service.title().length).toBeGreaterThan(0);
  });

  it('goNext should advance date', () => {
    const before = service.currentDate().getTime();
    service.goNext();
    expect(service.currentDate().getTime()).toBeGreaterThan(before);
  });

  it('goPrev should go back', () => {
    const before = service.currentDate().getTime();
    service.goPrev();
    expect(service.currentDate().getTime()).toBeLessThan(before);
  });
});
