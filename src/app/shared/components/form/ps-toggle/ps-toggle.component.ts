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
  selector: 'ps-toggle',
  standalone: true,
  imports: [NgClass],
  templateUrl: './ps-toggle.component.html',
  styleUrl: './ps-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsToggleComponent),
      multi: true,
    },
  ],
})
export class PsToggleComponent extends PsFormFieldBase<boolean> {
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly checked = signal(false);
  readonly pressing = signal(false);

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

  onMouseDown(): void {
    if (!this.isDisabled()) this.pressing.set(true);
  }

  onMouseUp(): void {
    this.pressing.set(false);
  }
}
