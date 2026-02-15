import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { PsFormFieldBase } from '../form-field-base';
import { PsRadioOption } from '../form.types';

@Component({
  selector: 'ps-radio-group',
  standalone: true,
  imports: [NgClass],
  templateUrl: './ps-radio-group.component.html',
  styleUrl: './ps-radio-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsRadioGroupComponent),
      multi: true,
    },
  ],
})
export class PsRadioGroupComponent extends PsFormFieldBase<string | number> {
  readonly options = input.required<PsRadioOption[]>();
  readonly direction = input<'horizontal' | 'vertical'>('vertical');
  readonly variant = input<'list' | 'cards'>('list');

  readonly value = signal<string | number>('');

  writeValue(val: string | number): void {
    this.value.set(val ?? '');
  }

  select(option: PsRadioOption): void {
    if (this.isDisabled() || option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const opts = this.options().filter(o => !o.disabled);
    let nextIdx = -1;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      nextIdx = (index + 1) % opts.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIdx = (index - 1 + opts.length) % opts.length;
    }

    if (nextIdx >= 0) {
      this.select(opts[nextIdx]);
    }
  }

  isSelected(option: PsRadioOption): boolean {
    return String(this.value()) === String(option.value);
  }
}
