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
import { PsFormFieldBase } from '../form-field-base';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ITEM_HEIGHT = 42; // 40px item + 2px margin

@Component({
  selector: 'ps-timepicker',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-timepicker.component.html',
  styleUrl: './ps-timepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsTimepickerComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsTimepickerComponent extends PsFormFieldBase<string> {
  readonly ICONS = ICONS;
  readonly HOURS = HOURS;
  readonly MINUTES = MINUTES;

  readonly minuteStep = input(1);

  private readonly hostEl = inject(ElementRef);

  readonly value = signal('');
  readonly isOpen = signal(false);

  readonly selectedHour = computed(() => {
    const v = this.value();
    if (!v) return '';
    return v.split(':')[0] || '';
  });

  readonly selectedMinute = computed(() => {
    const v = this.value();
    if (!v) return '';
    return v.split(':')[1] || '';
  });

  readonly displayValue = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [h, m] = v.split(':');
    return `${h}:${m}`;
  });

  readonly filteredMinutes = computed(() => {
    const step = this.minuteStep();
    if (step <= 1) return MINUTES;
    return MINUTES.filter((_, i) => i % step === 0);
  });

  writeValue(val: string): void {
    this.value.set(val ?? '');
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
    this.isOpen.set(true);
    this.scrollToSelected();
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectHour(hour: string): void {
    const min = this.selectedMinute() || '00';
    const newVal = `${hour}:${min}`;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  selectMinute(minute: string): void {
    const hr = this.selectedHour() || '00';
    const newVal = `${hr}:${minute}`;
    this.value.set(newVal);
    this.onChange(newVal);
    this.onTouched();
    this.close();
  }

  selectNow(): void {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const newVal = `${h}:${m}`;
    this.value.set(newVal);
    this.onChange(newVal);
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

  private scrollToSelected(): void {
    // Wait for DOM to render the panel
    requestAnimationFrame(() => {
      const panel = this.hostEl.nativeElement.querySelector('.ps-timepicker__panel');
      if (!panel) return;

      const hourCol = panel.querySelector('.ps-timepicker__column--hours');
      const minCol = panel.querySelector('.ps-timepicker__column--minutes');

      if (hourCol && this.selectedHour()) {
        const idx = HOURS.indexOf(this.selectedHour());
        if (idx >= 0) {
          hourCol.scrollTop = Math.max(0, idx * ITEM_HEIGHT - hourCol.clientHeight / 2 + ITEM_HEIGHT / 2);
        }
      }

      if (minCol && this.selectedMinute()) {
        const mins = this.filteredMinutes();
        const idx = mins.indexOf(this.selectedMinute());
        if (idx >= 0) {
          minCol.scrollTop = Math.max(0, idx * ITEM_HEIGHT - minCol.clientHeight / 2 + ITEM_HEIGHT / 2);
        }
      }
    });
  }
}
