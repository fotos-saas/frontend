import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { PsFormFieldBase } from '../form-field-base';
import { PsDatepickerComponent } from '../ps-datepicker/ps-datepicker.component';

export interface DateRange {
  from: string;
  to: string;
}

const EMPTY_RANGE: DateRange = { from: '', to: '' };

@Component({
  selector: 'ps-daterange',
  standalone: true,
  imports: [NgClass, FormsModule, PsDatepickerComponent],
  templateUrl: './ps-daterange.component.html',
  styleUrl: './ps-daterange.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsDaterangeComponent),
      multi: true,
    },
  ],
})
export class PsDaterangeComponent extends PsFormFieldBase<DateRange> {
  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly fromLabel = input('Mikortól');
  readonly toLabel = input('Meddig');
  readonly fromPlaceholder = input('Kezdő dátum...');
  readonly toPlaceholder = input('Záró dátum...');

  readonly fromValue = signal('');
  readonly toValue = signal('');

  // A "from" mező max-ja = a "to" értéke (ha van)
  readonly fromMax = computed(() => this.toValue() || this.max());
  // A "to" mező min-je = a "from" értéke (ha van)
  readonly toMin = computed(() => this.fromValue() || this.min());

  writeValue(val: DateRange): void {
    const range = val ?? EMPTY_RANGE;
    this.fromValue.set(range.from ?? '');
    this.toValue.set(range.to ?? '');
  }

  onFromChange(val: string): void {
    this.fromValue.set(val);
    // Ha a from > to, töröljük a to-t
    const to = this.toValue();
    if (val && to && val > to) {
      this.toValue.set('');
    }
    this.emitChange();
  }

  onToChange(val: string): void {
    this.toValue.set(val);
    this.emitChange();
  }

  private emitChange(): void {
    const range: DateRange = {
      from: this.fromValue(),
      to: this.toValue(),
    };
    this.onChange(range);
    this.onTouched();
  }
}
