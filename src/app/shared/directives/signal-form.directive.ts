import { Directive, WritableSignal, input } from '@angular/core';

/**
 * Signal Form Directive
 * Generic signal updater direktíva form mezőkhöz
 *
 * Használat:
 * <input
 *   [signalForm]="contactData"
 *   signalKey="name"
 *   (input)="onSignalUpdate($event)"
 * />
 */
@Directive({
  selector: '[signalForm]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
    '(change)': 'onChange($event)',
  }
})
export class SignalFormDirective<T extends Record<string, any>> {
  /** Signal-based inputs */
  readonly signalForm = input.required<WritableSignal<T>>();
  readonly signalKey = input.required<keyof T>();

  /**
   * Input event kezelés
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateSignal(input.value);
  }

  /**
   * Change event kezelés (select, checkbox)
   */
  onChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value;
    this.updateSignal(value);
  }

  /**
   * Signal frissítése
   */
  private updateSignal(value: string | boolean): void {
    this.signalForm().update(current => ({
      ...current,
      [this.signalKey()]: value
    }));
  }
}
