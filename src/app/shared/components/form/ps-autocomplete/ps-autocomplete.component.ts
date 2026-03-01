import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  output,
  signal,
  computed,
  ElementRef,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '@shared/constants/icons.constants';
import { DropdownFlipDirective } from '@shared/directives';
import { PsFormFieldBase } from '../form-field-base';
import { PsSelectOption } from '../form.types';

@Component({
  selector: 'ps-autocomplete',
  standalone: true,
  imports: [NgClass, LucideAngularModule, DropdownFlipDirective],
  templateUrl: './ps-autocomplete.component.html',
  styleUrl: './ps-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsAutocompleteComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class PsAutocompleteComponent extends PsFormFieldBase<string> implements OnInit {
  readonly ICONS = ICONS;

  readonly suggestions = input<PsSelectOption[]>([]);
  readonly loading = input(false);
  readonly minChars = input(2);
  readonly debounceMs = input(300);
  readonly allowFreeText = input(true);

  readonly search = output<string>();
  readonly selected = output<PsSelectOption>();

  private readonly hostEl = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly value = signal('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(-1);

  readonly filteredSuggestions = computed(() => {
    const query = this.value().toLowerCase().trim();
    const items = this.suggestions();
    if (!query || query.length < this.minChars()) return [];
    return items;
  });

  readonly showDropdown = computed(() =>
    this.isOpen() && (this.filteredSuggestions().length > 0 || this.loading())
  );

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceMs()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => {
      if (query.length >= this.minChars()) {
        this.search.emit(query);
      }
    });
  }

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.hostEl.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.searchSubject.next(val);
    if (val.length >= this.minChars()) {
      this.isOpen.set(true);
      this.highlightedIndex.set(-1);
    } else {
      this.isOpen.set(false);
    }
  }

  selectSuggestion(option: PsSelectOption): void {
    this.value.set(option.label);
    this.onChange(option.label);
    this.onTouched();
    this.selected.emit(option);
    this.close();
  }

  close(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.filteredSuggestions();
    if (!this.isOpen() || items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => (i - 1 + items.length) % items.length);
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < items.length) {
          this.selectSuggestion(items[idx]);
        }
        break;
      case 'Escape':
        this.close();
        break;
    }
  }
}
