import { Injectable, signal, computed } from '@angular/core';
import { CalendarView } from '../models/booking.models';

const MONTHS = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

@Injectable({ providedIn: 'root' })
export class BookingCalendarStateService {
  readonly currentView = signal<CalendarView>('weekly');
  readonly currentDate = signal<Date>(new Date());

  readonly dateRange = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();

    if (view === 'daily') {
      return { start: this.formatDate(date), end: this.formatDate(date) };
    }

    if (view === 'weekly') {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay() + 1); // Hétfő
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: this.formatDate(start), end: this.formatDate(end) };
    }

    // Havi nézet
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: this.formatDate(start), end: this.formatDate(end) };
  });

  readonly title = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();

    if (view === 'daily') {
      return `${date.getFullYear()}. ${MONTHS[date.getMonth()]} ${date.getDate()}.`;
    }

    if (view === 'weekly') {
      const range = this.dateRange();
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${MONTHS[startDate.getMonth()]} ${startDate.getDate()}-${endDate.getDate()}.`;
      }
      return `${MONTHS[startDate.getMonth()]} ${startDate.getDate()}. - ${MONTHS[endDate.getMonth()]} ${endDate.getDate()}.`;
    }

    return `${date.getFullYear()}. ${MONTHS[date.getMonth()]}`;
  });

  setView(view: CalendarView): void {
    this.currentView.set(view);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  goNext(): void {
    const date = new Date(this.currentDate());
    const view = this.currentView();
    if (view === 'daily') date.setDate(date.getDate() + 1);
    else if (view === 'weekly') date.setDate(date.getDate() + 7);
    else date.setMonth(date.getMonth() + 1);
    this.currentDate.set(date);
  }

  goPrev(): void {
    const date = new Date(this.currentDate());
    const view = this.currentView();
    if (view === 'daily') date.setDate(date.getDate() - 1);
    else if (view === 'weekly') date.setDate(date.getDate() - 7);
    else date.setMonth(date.getMonth() - 1);
    this.currentDate.set(date);
  }

  goToDate(date: Date): void {
    this.currentDate.set(date);
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
