import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  inject,
  ElementRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { formatHungarianPhone } from '@shared/utils/phone-formatter.util';
import { PsFormFieldBase } from '../form-field-base';
import { PsInputType } from '../form.types';

@Component({
  selector: 'ps-input',
  standalone: true,
  imports: [NgClass, LucideAngularModule, MatTooltipModule],
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsInputComponent extends PsFormFieldBase<string> {
  private readonly elementRef = inject(ElementRef);

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
  readonly showHelp = signal(false);

  readonly effectiveType = computed(() => {
    if (this.type() === 'password' && this.passwordVisible()) return 'text';
    return this.type();
  });

  readonly showPasswordToggle = computed(() => this.type() === 'password');

  readonly hasHelp = computed(() => this.helpItems().length > 0);

  readonly showSuccessIcon = computed(() =>
    this.computedState() === 'success' && !this.suffix() && !this.hasHelp()
  );

  /** Suffix ikon-e (lucide ikon név = csak kisbetűs ASCII + kötőjel) */
  readonly isIconSuffix = computed(() => /^[a-z][a-z0-9-]*$/.test(this.suffix()));

  writeValue(val: string): void {
    let v = val ?? '';
    if (this.type() === 'tel' && v) {
      v = formatHungarianPhone(v);
    }
    this.value.set(v);
  }

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    let val = el.value;

    if (this.type() === 'tel') {
      val = formatHungarianPhone(val);
      el.value = val;
    }

    this.value.set(val);
    this.onChange(val);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.type() !== 'tel') return;
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const formatted = formatHungarianPhone(pasted);
    const el = event.target as HTMLInputElement;
    el.value = formatted;
    this.value.set(formatted);
    this.onChange(formatted);
  }

  override onBlur(): void {
    if (this.type() === 'email') {
      const trimmed = this.value().trim();
      if (trimmed !== this.value()) {
        this.value.set(trimmed);
        this.onChange(trimmed);
      }
    }
    super.onBlur();
  }

  togglePassword(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.passwordVisible.update(v => !v);
  }

  toggleHelp(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.showHelp.update(v => !v);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.showHelp() && !this.elementRef.nativeElement.contains(event.target)) {
      this.showHelp.set(false);
    }
  }
}
