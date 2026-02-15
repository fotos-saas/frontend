import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  ElementRef,
  viewChild,
  inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsFormFieldBase } from '../form-field-base';
import { PsSelectOption } from '../form.types';

@Component({
  selector: 'ps-searchable-select',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-searchable-select.component.html',
  styleUrl: './ps-searchable-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsSearchableSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsSearchableSelectComponent extends PsFormFieldBase<string | number> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly clearable = input(false);
  readonly allLabel = input('');
  readonly searchPlaceholder = input('Keresés...');
  readonly noResultsText = input('Nincs találat');

  // Backward compat: value/valueChange (non-CVA) support
  readonly value = input<string | number>('');
  readonly valueChange = signal<((val: string) => void) | null>(null);

  private readonly hostEl = inject(ElementRef);
  private searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly internalValue = signal<string | number>('');
  readonly searchQuery = signal('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(-1);

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const opts = this.options();
    if (!query) return opts;
    return opts.filter(
      o => o.label.toLowerCase().includes(query) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(query))
    );
  });

  readonly currentValue = computed(() => {
    const cvVal = this.internalValue();
    const inputVal = this.value();
    return cvVal || inputVal;
  });

  readonly selectedLabel = computed(() => {
    const v = this.currentValue();
    if (!v && v !== 0) return '';
    const opt = this.options().find(o => String(o.id) === String(v));
    return opt?.label ?? '';
  });

  readonly displayValue = computed(() => {
    if (this.isOpen()) return this.searchQuery();
    return this.selectedLabel();
  });

  writeValue(val: string | number): void {
    this.internalValue.set(val ?? '');
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.hostEl.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  open(): void {
    if (this.isDisabled()) return;
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
    setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 0);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.highlightedIndex.set(-1);
    if (!this.isOpen()) this.isOpen.set(true);
  }

  selectOption(option: PsSelectOption): void {
    if (option.disabled) return;
    const val = String(option.id);
    this.internalValue.set(val);
    this.onChange(val);
    this.onTouched();
    this.close();
  }

  selectAll(): void {
    this.internalValue.set('');
    this.onChange('');
    this.onTouched();
    this.close();
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.internalValue.set('');
    this.onChange('');
    this.onTouched();
    this.searchQuery.set('');
  }

  isSelected(option: PsSelectOption): boolean {
    return String(option.id) === String(this.currentValue());
  }

  onKeydown(event: KeyboardEvent): void {
    const filtered = this.filteredOptions();
    const hasAll = !!this.allLabel();
    const total = filtered.length + (hasAll ? 1 : 0);

    if (!this.isOpen()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => (i + 1) % total);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => (i - 1 + total) % total);
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx < 0) break;
        if (hasAll && idx === 0) {
          this.selectAll();
        } else {
          const optIdx = hasAll ? idx - 1 : idx;
          if (optIdx >= 0 && optIdx < filtered.length) {
            this.selectOption(filtered[optIdx]);
          }
        }
        break;
      case 'Escape':
        this.close();
        break;
    }
  }
}
