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
import { DropdownFlipDirective } from '@shared/directives';
import { PsFormFieldBase } from '../form-field-base';
import { PsSelectOption } from '../form.types';

@Component({
  selector: 'ps-multi-select',
  standalone: true,
  imports: [NgClass, LucideAngularModule, DropdownFlipDirective],
  templateUrl: './ps-multi-select.component.html',
  styleUrl: './ps-multi-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsMultiSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsMultiSelectComponent extends PsFormFieldBase<(string | number)[]> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly maxSelections = input(0);
  readonly chipDisplay = input(true);
  readonly selectAllLabel = input('Mind kijelölése');

  private readonly hostEl = inject(ElementRef);

  readonly selectedValues = signal<(string | number)[]>([]);
  readonly isOpen = signal(false);

  readonly selectedLabels = computed(() => {
    const vals = this.selectedValues();
    const opts = this.options();
    return vals.map(v => opts.find(o => String(o.id) === String(v))?.label ?? String(v));
  });

  readonly allSelected = computed(() => {
    const opts = this.options().filter(o => !o.disabled);
    return opts.length > 0 && opts.every(o => this.isSelected(o));
  });

  readonly triggerText = computed(() => {
    const labels = this.selectedLabels();
    if (labels.length === 0) return '';
    if (!this.chipDisplay()) return `${labels.length} kiválasztva`;
    return '';
  });

  writeValue(val: (string | number)[]): void {
    this.selectedValues.set(val ?? []);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.hostEl.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    if (this.isDisabled()) return;
    this.isOpen.update(v => !v);
  }

  toggleOption(option: PsSelectOption): void {
    if (option.disabled) return;
    const current = [...this.selectedValues()];
    const idx = current.findIndex(v => String(v) === String(option.id));

    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      const max = this.maxSelections();
      if (max > 0 && current.length >= max) return;
      current.push(option.id);
    }

    this.selectedValues.set(current);
    this.onChange(current);
  }

  toggleAll(): void {
    const opts = this.options().filter(o => !o.disabled);
    if (this.allSelected()) {
      this.selectedValues.set([]);
      this.onChange([]);
    } else {
      const max = this.maxSelections();
      const ids = max > 0 ? opts.slice(0, max).map(o => o.id) : opts.map(o => o.id);
      this.selectedValues.set(ids);
      this.onChange(ids);
    }
  }

  removeChip(value: string | number, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.selectedValues().filter(v => String(v) !== String(value));
    this.selectedValues.set(current);
    this.onChange(current);
  }

  isSelected(option: PsSelectOption): boolean {
    return this.selectedValues().some(v => String(v) === String(option.id));
  }

  getLabel(value: string | number): string {
    return this.options().find(o => String(o.id) === String(value))?.label ?? String(value);
  }
}
