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

@Component({
  selector: 'ps-checkbox',
  standalone: true,
  imports: [NgClass],
  templateUrl: './ps-checkbox.component.html',
  styleUrl: './ps-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsCheckboxComponent),
      multi: true,
    },
  ],
})
export class PsCheckboxComponent extends PsFormFieldBase<boolean> {
  readonly indeterminate = input(false);
  readonly checked = signal(false);

  writeValue(val: boolean): void {
    this.checked.set(!!val);
  }

  toggle(): void {
    if (this.isDisabled() || this.readonly()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }
}
