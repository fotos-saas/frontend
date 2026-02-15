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
  selector: 'ps-tag-input',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-tag-input.component.html',
  styleUrl: './ps-tag-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsTagInputComponent),
      multi: true,
    },
  ],
})
export class PsTagInputComponent extends PsFormFieldBase<string[]> {
  readonly ICONS = ICONS;

  readonly maxTags = input(0);
  readonly allowDuplicates = input(false);
  readonly separator = input(',');
  readonly suggestions = input<string[]>([]);

  readonly tags = signal<string[]>([]);
  readonly inputValue = signal('');
  readonly removingIndex = signal(-1);

  readonly canAddMore = computed(() => {
    const max = this.maxTags();
    return max === 0 || this.tags().length < max;
  });

  writeValue(val: string[]): void {
    this.tags.set(val ?? []);
  }

  onInputKeydown(event: KeyboardEvent): void {
    const val = this.inputValue().trim();

    if (event.key === 'Enter' || event.key === this.separator()) {
      event.preventDefault();
      if (val) this.addTag(val);
    } else if (event.key === 'Backspace' && !val) {
      const current = this.tags();
      if (current.length > 0) {
        this.removeTagAtIndex(current.length - 1);
      }
    }
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const sep = this.separator();

    if (sep && val.includes(sep)) {
      const parts = val.split(sep).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => this.addTag(p));
      this.inputValue.set('');
    } else {
      this.inputValue.set(val);
    }
  }

  addTag(text: string): void {
    if (!this.canAddMore()) return;
    if (!this.allowDuplicates() && this.tags().includes(text)) return;

    this.tags.update(t => [...t, text]);
    this.inputValue.set('');
    this.onChange(this.tags());
  }

  removeTag(tag: string, event: MouseEvent): void {
    event.stopPropagation();
    const idx = this.tags().indexOf(tag);
    if (idx >= 0) this.removeTagAtIndex(idx);
  }

  private removeTagAtIndex(index: number): void {
    this.removingIndex.set(index);
    setTimeout(() => {
      this.tags.update(t => t.filter((_, i) => i !== index));
      this.onChange(this.tags());
      this.removingIndex.set(-1);
    }, 200);
  }
}
