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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsSelectComponent extends PsFormFieldBase<string | number> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly emptyLabel = input('Válassz...');

  private readonly hostEl = inject(ElementRef);

  readonly value = signal<string | number>('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(-1);

  readonly selectedLabel = computed(() => {
    const v = this.value();
    if (!v && v !== 0) return '';
    const opt = this.options().find(o => String(o.id) === String(v));
    return opt?.label ?? '';
  });

  readonly enabledOptions = computed(() =>
    this.options().filter(o => !o.disabled)
  );

  writeValue(val: string | number): void {
    this.value.set(val ?? '');
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.hostEl.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    if (this.isDisabled()) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isDisabled()) return;
    this.isOpen.set(true);
    // Highlight current selection
    const idx = this.options().findIndex(o => String(o.id) === String(this.value()));
    this.highlightedIndex.set(idx);
  }

  close(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  selectOption(option: PsSelectOption): void {
    if (option.disabled) return;
    const val = String(option.id);
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
    this.close();
  }

  isSelected(option: PsSelectOption): boolean {
    return String(option.id) === String(this.value());
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    const total = opts.length;

    if (!this.isOpen()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < total) {
          this.selectOption(opts[idx]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private moveHighlight(direction: number): void {
    const opts = this.options();
    const total = opts.length;
    let idx = this.highlightedIndex();

    // Find next non-disabled option
    for (let i = 0; i < total; i++) {
      idx = (idx + direction + total) % total;
      if (!opts[idx].disabled) {
        this.highlightedIndex.set(idx);
        return;
      }
    }
  }
}
