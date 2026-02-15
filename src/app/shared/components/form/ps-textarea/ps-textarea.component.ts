import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsFormFieldBase } from '../form-field-base';

@Component({
  selector: 'ps-textarea',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-textarea.component.html',
  styleUrl: './ps-textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsTextareaComponent),
      multi: true,
    },
  ],
})
export class PsTextareaComponent extends PsFormFieldBase<string> implements AfterViewInit {
  readonly ICONS = ICONS;

  readonly rows = input(4);
  readonly maxLength = input(0);
  readonly autoResize = input(false);

  readonly value = signal('');
  private textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  readonly charCount = computed(() => this.value().length);
  readonly charCountText = computed(() => {
    const max = this.maxLength();
    if (!max) return '';
    return `${this.charCount()} / ${max}`;
  });

  ngAfterViewInit(): void {
    if (this.autoResize()) this.adjustHeight();
  }

  writeValue(val: string): void {
    this.value.set(val ?? '');
    if (this.autoResize()) {
      setTimeout(() => this.adjustHeight(), 0);
    }
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
    if (this.autoResize()) this.adjustHeight();
  }

  private adjustHeight(): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}
