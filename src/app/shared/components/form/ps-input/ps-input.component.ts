import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsFormFieldBase } from '../form-field-base';
import { PsInputType } from '../form.types';

@Component({
  selector: 'ps-input',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-input.component.html',
  styleUrl: './ps-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsInputComponent),
      multi: true,
    },
  ],
})
export class PsInputComponent extends PsFormFieldBase<string> {
  readonly ICONS = ICONS;

  readonly type = input<PsInputType>('text');
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');
  readonly min = input<number | string>('');
  readonly max = input<number | string>('');
  readonly step = input<number | string>('');
  readonly autocomplete = input<string>('');

  readonly value = signal('');
  readonly passwordVisible = signal(false);

  readonly effectiveType = computed(() => {
    if (this.type() === 'password' && this.passwordVisible()) return 'text';
    return this.type();
  });

  readonly showPasswordToggle = computed(() => this.type() === 'password');

  readonly showSuccessIcon = computed(() =>
    this.computedState() === 'success' && !this.suffix()
  );

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  togglePassword(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.passwordVisible.update(v => !v);
  }
}
