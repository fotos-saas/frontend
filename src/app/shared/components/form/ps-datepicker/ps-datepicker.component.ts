import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  ElementRef,
  inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DropdownFlipDirective } from '@shared/directives';
import { PsFormFieldBase } from '../form-field-base';

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  iso: string;
}

const DAY_NAMES = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

@Component({
  selector: 'ps-datepicker',
  standalone: true,
  imports: [NgClass, LucideAngularModule, DropdownFlipDirective],
  templateUrl: './ps-datepicker.component.html',
  styleUrl: './ps-datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsDatepickerComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsDatepickerComponent extends PsFormFieldBase<string> {
  readonly ICONS = ICONS;
  readonly DAY_NAMES = DAY_NAMES;

  readonly min = input<string>('');
  readonly max = input<string>('');

  private readonly hostEl = inject(ElementRef);

  readonly value = signal('');
  readonly isOpen = signal(false);
  readonly viewDate = signal(new Date());

  readonly displayValue = computed(() => {
    const v = this.value();
    if (!v) return '';
    const d = new Date(v + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  readonly calendarTitle = computed(() => {
    const d = this.viewDate();
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
    });
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const vd = this.viewDate();
    const year = vd.getFullYear();
    const month = vd.getMonth();
    const today = new Date();
    const todayIso = this.toIso(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const selected = this.value();
    const minDate = this.min();
    const maxDate = this.max();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Monday-based offset: (getDay() + 6) % 7
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month fill
    const prevMonth = new Date(year, month, 0);
    const prevDays = prevMonth.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const iso = this.toIso(y, m, d);
      days.push({
        date: d, month: m - 1, year: y,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selected,
        isDisabled: this.isDateDisabled(iso, minDate, maxDate),
        iso,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = this.toIso(year, month + 1, d);
      days.push({
        date: d, month, year,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selected,
        isDisabled: this.isDateDisabled(iso, minDate, maxDate),
        iso,
      });
    }

    // Next month fill (up to 42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const iso = this.toIso(y, m, d);
      days.push({
        date: d, month: m - 1, year: y,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selected,
        isDisabled: this.isDateDisabled(iso, minDate, maxDate),
        iso,
      });
    }

    return days;
  });

  writeValue(val: string): void {
    this.value.set(val ?? '');
    if (val) {
      const d = new Date(val + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        this.viewDate.set(d);
      }
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.hostEl.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.isDisabled()) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isDisabled()) return;
    // Reset view to selected date or today
    const v = this.value();
    if (v) {
      const d = new Date(v + 'T00:00:00');
      if (!isNaN(d.getTime())) this.viewDate.set(d);
    } else {
      this.viewDate.set(new Date());
    }
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectDay(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.value.set(day.iso);
    this.onChange(day.iso);
    this.onTouched();
    this.close();
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectToday(): void {
    const now = new Date();
    const iso = this.toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (this.isDateDisabled(iso, this.min(), this.max())) return;
    this.value.set(iso);
    this.onChange(iso);
    this.onTouched();
    this.close();
  }

  clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set('');
    this.onChange('');
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (!this.isOpen() && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      this.open();
    }
  }

  private toIso(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  private isDateDisabled(iso: string, minDate: string, maxDate: string): boolean {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  }
}
