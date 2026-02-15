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

@Component({
  selector: 'ps-code-input',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-code-input.component.html',
  styleUrl: './ps-code-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsCodeInputComponent),
      multi: true,
    },
  ],
})
export class PsCodeInputComponent extends PsFormFieldBase<string> {
  readonly ICONS = ICONS;

  /** Maximum kód hossz (default: 6) */
  readonly maxLength = input<number>(6);

  /** Kód rejtett megjelenítése (jelszó mód) */
  readonly masked = input<boolean>(false);

  readonly value = signal('');
  readonly passwordVisible = signal(false);

  readonly effectiveType = computed(() => {
    if (this.masked() && !this.passwordVisible()) return 'password';
    return 'text';
  });

  readonly showPasswordToggle = computed(() => this.masked());

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    // Csak számjegyeket engedünk
    const cleaned = el.value.replace(/\D/g, '').slice(0, this.maxLength());
    el.value = cleaned;
    this.value.set(cleaned);
    this.onChange(cleaned);
  }

  togglePassword(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.passwordVisible.update(v => !v);
  }
}
