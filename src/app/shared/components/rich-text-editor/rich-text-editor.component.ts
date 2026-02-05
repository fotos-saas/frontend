import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  forwardRef,
  OnInit
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';

/**
 * Rich Text Editor konfiguráció típusa
 */
export type EditorMode = 'basic' | 'standard' | 'full';

/**
 * Quill toolbar konfiguráció
 */
const TOOLBAR_CONFIGS = {
  // Alapvető: bold, italic, link
  basic: [
    ['bold', 'italic', 'underline'],
    ['link']
  ],
  // Standard: formázás + listák
  standard: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ],
  // Teljes: minden funkció
  full: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ header: [1, 2, 3, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ]
};

/**
 * Rich Text Editor Component
 *
 * Quill alapú rich text editor a fórumhoz.
 * Támogat ControlValueAccessor-t a form integrációhoz.
 *
 * Használat:
 * ```html
 * <app-rich-text-editor
 *   [(ngModel)]="content"
 *   [mode]="'standard'"
 *   [placeholder]="'Írd ide a hozzászólásodat...'"
 *   [disabled]="isSubmitting"
 * />
 * ```
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [FormsModule, QuillModule, NgStyle],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor, OnInit {
  /** Signal-based inputs */
  readonly mode = input<EditorMode>('standard');
  readonly placeholder = input<string>('Írd ide a szöveget...');
  readonly maxLength = input<number>(0);
  readonly minHeight = input<number>(120);
  readonly maxHeight = input<number>(400);

  /** Disabled állapot - CVA-ból kezelt, ezért hagyományos property */
  disabled = false;

  /** Signal-based outputs */
  readonly editorFocusEvent = output<void>();
  readonly editorBlurEvent = output<void>();
  readonly textLengthChangeEvent = output<number>();

  /** Belső érték */
  content = '';

  /** Plain text hossz (karakterszámlálóhoz) */
  textLength = 0;

  /** Quill modulok konfigurációja */
  modules: Record<string, unknown> = {};

  /** CVA callback-ek */
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.modules = {
      toolbar: TOOLBAR_CONFIGS[this.mode()]
    };
  }

  /**
   * Quill editor tartalom változás
   * A ContentChange típusban a html és text lehet null
   */
  onContentChanged(event: { content: unknown; html: string | null; text: string | null }): void {
    const htmlContent = event.html ?? '';
    this.content = htmlContent;
    this.onChange(htmlContent);

    // Plain text hossz frissítése és kiküldése
    const plainTextLength = (event.text ?? '').trim().length;
    this.textLength = plainTextLength;
    this.textLengthChangeEvent.emit(plainTextLength);
  }

  /**
   * Fókusz kezelés
   */
  onFocus(): void {
    this.onTouched();
    this.editorFocusEvent.emit();
  }

  /**
   * Blur kezelés
   */
  onBlur(): void {
    this.editorBlurEvent.emit();
  }

  /**
   * CVA: Érték beállítása
   */
  writeValue(value: string): void {
    this.content = value || '';
  }

  /**
   * CVA: Change callback regisztrálása
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * CVA: Touch callback regisztrálása
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * CVA: Disabled állapot beállítása
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Editor stílus CSS változókkal a .ql-editor-hez
   * A Quill editor nem támogatja közvetlenül a [styles] binding-ot az editor területre,
   * ezért CSS custom property-ket használunk, amiket az SCSS-ben alkalmazunk.
   */
  readonly editorStyle = computed(() => {
    const style: Record<string, string> = {};
    const minH = this.minHeight();
    const maxH = this.maxHeight();

    if (minH > 0) {
      style['--editor-min-height'] = `${minH}px`;
    }

    if (maxH > 0) {
      style['--editor-max-height'] = `${maxH}px`;
    }

    return style;
  });
}
