import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

export interface SelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class SearchableSelectComponent {
  readonly ICONS = ICONS;

  /** Az opciók listája */
  options = input.required<SelectOption[]>();

  /** Placeholder szöveg */
  placeholder = input('Válassz...');

  /** "Minden" opció szövege (ha üres string, nincs ilyen opció) */
  allLabel = input('');

  /** Kiválasztott érték (id) */
  value = input<string | number>('');

  /** Érték változás */
  valueChange = output<string>();

  /** Belső állapot */
  searchQuery = signal('');
  isOpen = signal(false);
  highlightedIndex = signal(-1);

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Szűrt opciók */
  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const opts = this.options();
    if (!query) return opts;
    return opts.filter(
      o => o.label.toLowerCase().includes(query) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(query))
    );
  });

  /** Kiválasztott opció label-je */
  selectedLabel = computed(() => {
    const v = this.value();
    if (!v && v !== 0) return '';
    const opt = this.options().find(o => String(o.id) === String(v));
    return opt ? opt.label : '';
  });

  /** Megjelenített szöveg az inputban */
  displayValue = computed(() => {
    if (this.isOpen()) return this.searchQuery();
    return this.selectedLabel() || '';
  });

  onDocumentClick(event: MouseEvent): void {
    const el = (event.target as HTMLElement);
    if (!el.closest('app-searchable-select')) {
      this.close();
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
    setTimeout(() => this.inputEl()?.nativeElement.focus(), 0);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
  }

  onInputChange(value: string): void {
    this.searchQuery.set(value);
    this.highlightedIndex.set(-1);
    if (!this.isOpen()) this.isOpen.set(true);
  }

  selectOption(option: SelectOption): void {
    this.valueChange.emit(String(option.id));
    this.close();
  }

  selectAll(): void {
    this.valueChange.emit('');
    this.close();
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit('');
    this.searchQuery.set('');
  }

  isSelected(option: SelectOption): boolean {
    return String(option.id) === String(this.value());
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
