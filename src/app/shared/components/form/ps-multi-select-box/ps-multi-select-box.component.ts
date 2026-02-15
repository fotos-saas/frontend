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
  selector: 'ps-multi-select-box',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-multi-select-box.component.html',
  styleUrl: './ps-multi-select-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsMultiSelectBoxComponent),
      multi: true,
    },
  ],
})
export class PsMultiSelectBoxComponent extends PsFormFieldBase<(string | number)[]> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly maxHeight = input('200px');
  readonly searchable = input(false);

  readonly selectedValues = signal<(string | number)[]>([]);
  readonly searchQuery = signal('');

  readonly filteredOptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const opts = this.options();
    if (!q) return opts;
    return opts.filter(o => o.label.toLowerCase().includes(q));
  });

  writeValue(val: (string | number)[]): void {
    this.selectedValues.set(val ?? []);
  }

  toggleOption(option: PsSelectOption): void {
    if (this.isDisabled() || option.disabled) return;
    const current = [...this.selectedValues()];
    const idx = current.findIndex(v => String(v) === String(option.id));

    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(option.id);
    }

    this.selectedValues.set(current);
    this.onChange(current);
    this.onTouched();
  }

  isSelected(option: PsSelectOption): boolean {
    return this.selectedValues().some(v => String(v) === String(option.id));
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
