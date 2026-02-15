import { Directive, computed, input, output, signal } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { PsFieldSize, PsFieldState } from './form.types';

let nextId = 0;

@Directive()
export abstract class PsFormFieldBase<T> implements ControlValueAccessor {
  // Közös inputok
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly size = input<PsFieldSize>('full');
  readonly state = input<PsFieldState>('default');
  readonly fieldId = input<string>('');

  // Közös outputok
  readonly blur = output<void>();
  readonly focus = output<void>();

  // Belső állapot
  readonly focused = signal(false);

  // CVA disabled (programmatic override)
  protected cvaDisabled = signal(false);

  // CVA callbackek
  protected onChange: (value: T) => void = () => {};
  protected onTouched: () => void = () => {};

  // Computed: tényleges disabled
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  // Computed: tényleges állapot
  readonly computedState = computed<PsFieldState>(() => {
    const s = this.state();
    if (s !== 'default') return s;
    if (this.errorMessage()) return 'error';
    return 'default';
  });

  // Computed: egyedi ID
  readonly uniqueId = computed(() => {
    const custom = this.fieldId();
    if (custom) return custom;
    return `ps-field-${nextId++}`;
  });

  // Computed: BEM size class
  readonly sizeClass = computed(() => {
    const s = this.size();
    return s === 'full' ? 'ps-field--full' : `ps-field--${s}`;
  });

  // Computed: wrapper CSS classes
  readonly wrapperClasses = computed(() => {
    const classes: Record<string, boolean> = {
      'ps-field__wrapper': true,
      'ps-field__wrapper--focused': this.focused(),
      'ps-field__wrapper--disabled': this.isDisabled(),
      'ps-field__wrapper--readonly': this.readonly(),
    };
    return classes;
  });

  // Computed: host CSS classes
  readonly hostClasses = computed(() => {
    const state = this.computedState();
    const classes: Record<string, boolean> = {
      'ps-field': true,
      [this.sizeClass()]: true,
      'ps-field--error': state === 'error',
      'ps-field--success': state === 'success',
      'ps-field--focused': this.focused(),
      'ps-field--disabled': this.isDisabled(),
      'ps-field--readonly': this.readonly(),
    };
    return classes;
  });

  // CVA implementáció
  abstract writeValue(value: T): void;

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // Focus/Blur
  onFocus(): void {
    this.focused.set(true);
    this.focus.emit();
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
    this.blur.emit();
  }
}
