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
import { PsSelectOption } from '../form.types';

@Component({
  selector: 'ps-select',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-select.component.html',
  styleUrl: './ps-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsSelectComponent),
      multi: true,
    },
  ],
})
export class PsSelectComponent extends PsFormFieldBase<string | number> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly emptyLabel = input('Válassz...');

  readonly value = signal<string | number>('');

  readonly selectedLabel = computed(() => {
    const v = this.value();
    if (!v && v !== 0) return '';
    const opt = this.options().find(o => String(o.id) === String(v));
    return opt?.label ?? '';
  });

  writeValue(val: string | number): void {
    this.value.set(val ?? '');
  }

  onSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
  }
}
