import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { QuillModule } from 'ngx-quill';
import { ICONS } from '@shared/constants/icons.constants';
import { PsFormFieldBase } from '../form-field-base';

export type PsEditorMode = 'basic' | 'standard' | 'full';

const TOOLBAR_CONFIGS: Record<PsEditorMode, unknown[][]> = {
  basic: [
    ['bold', 'italic', 'underline'],
    ['link'],
  ],
  standard: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
  full: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ header: [1, 2, 3, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'blockquote', 'code-block'],
    ['clean'],
  ],
};

const MODE_DEFAULTS: Record<PsEditorMode, { minHeight: number; maxHeight: number }> = {
  basic: { minHeight: 80, maxHeight: 200 },
  standard: { minHeight: 160, maxHeight: 400 },
  full: { minHeight: 160, maxHeight: 400 },
};

@Component({
  selector: 'ps-editor',
  standalone: true,
  imports: [NgClass, NgStyle, FormsModule, QuillModule, LucideAngularModule],
  templateUrl: './ps-editor.component.html',
  styleUrl: './ps-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsEditorComponent),
      multi: true,
    },
  ],
})
export class PsEditorComponent extends PsFormFieldBase<string> implements OnInit {
  readonly ICONS = ICONS;

  readonly mode = input<PsEditorMode>('standard');
  readonly minHeight = input<number>(0);
  readonly maxHeight = input<number>(0);
  readonly maxLength = input<number>(0);

  readonly content = signal('');
  readonly textLength = signal(0);

  modules: Record<string, unknown> = {};

  readonly effectiveMinHeight = computed(() => {
    const explicit = this.minHeight();
    return explicit > 0 ? explicit : MODE_DEFAULTS[this.mode()].minHeight;
  });

  readonly effectiveMaxHeight = computed(() => {
    const explicit = this.maxHeight();
    return explicit > 0 ? explicit : MODE_DEFAULTS[this.mode()].maxHeight;
  });

  readonly editorStyle = computed<Record<string, string>>(() => ({
    '--ps-editor-min-height': `${this.effectiveMinHeight()}px`,
    '--ps-editor-max-height': `${this.effectiveMaxHeight()}px`,
  }));

  readonly charCountText = computed(() => {
    const max = this.maxLength();
    if (!max) return '';
    return `${this.textLength()} / ${max}`;
  });

  readonly isOverLimit = computed(() => {
    const max = this.maxLength();
    return max > 0 && this.textLength() >= max;
  });

  ngOnInit(): void {
    this.modules = {
      toolbar: TOOLBAR_CONFIGS[this.mode()],
    };
  }

  writeValue(val: string): void {
    this.content.set(val ?? '');
  }

  onContentChanged(event: { html: string | null; text: string | null }): void {
    const html = event.html ?? '';
    this.content.set(html);
    this.onChange(html);
    this.textLength.set((event.text ?? '').trim().length);
  }

  onEditorFocus(): void {
    this.onFocus();
  }

  onEditorBlur(): void {
    this.onBlur();
  }
}
