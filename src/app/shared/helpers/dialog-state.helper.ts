import { signal, WritableSignal } from '@angular/core';

/**
 * Dialog State Interface
 *
 * Egységes dialógus állapot kezelés.
 */
export interface DialogState {
  /** Dialógus látható-e */
  isOpen: WritableSignal<boolean>;
  /** Beküldés folyamatban */
  isSubmitting: WritableSignal<boolean>;
  /** Hibaüzenet */
  error: WritableSignal<string | null>;
}

/**
 * Create a new dialog state with signals
 */
export function createDialogState(): DialogState {
  return {
    isOpen: signal(false),
    isSubmitting: signal(false),
    error: signal(null),
  };
}

/**
 * Dialog State Helper
 *
 * Egységes dialógus állapot kezelés osztály.
 * Használat:
 * ```typescript
 * private guestDialog = new DialogStateHelper();
 *
 * // Open
 * this.guestDialog.open();
 *
 * // Start submit
 * this.guestDialog.startSubmit();
 *
 * // Success
 * this.guestDialog.close();
 *
 * // Error
 * this.guestDialog.setError('Hiba történt');
 * ```
 */
export class DialogStateHelper {
  /** Dialógus látható-e */
  readonly isOpen = signal<boolean>(false);

  /** Beküldés folyamatban */
  readonly isSubmitting = signal<boolean>(false);

  /** Hibaüzenet */
  readonly error = signal<string | null>(null);

  /**
   * Open the dialog
   */
  open(): void {
    this.error.set(null);
    this.isSubmitting.set(false);
    this.isOpen.set(true);
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.isOpen.set(false);
    this.isSubmitting.set(false);
    this.error.set(null);
  }

  /**
   * Start submit process
   */
  startSubmit(): void {
    this.error.set(null);
    this.isSubmitting.set(true);
  }

  /**
   * Submit succeeded, close dialog
   */
  submitSuccess(): void {
    this.isSubmitting.set(false);
    this.isOpen.set(false);
    this.error.set(null);
  }

  /**
   * Submit failed with error
   */
  submitError(message: string): void {
    this.isSubmitting.set(false);
    this.error.set(message);
  }

  /**
   * Set error message
   */
  setError(message: string | null): void {
    this.error.set(message);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.isOpen.set(false);
    this.isSubmitting.set(false);
    this.error.set(null);
  }
}

/**
 * Create multiple dialog states at once
 *
 * @param names - Dialog names
 * @returns Object with dialog states
 *
 * Usage:
 * ```typescript
 * const dialogs = createDialogs(['guest', 'create', 'classSize']);
 * dialogs.guest.open();
 * ```
 */
export function createDialogs<T extends string>(
  names: T[]
): Record<T, DialogStateHelper> {
  const result = {} as Record<T, DialogStateHelper>;

  for (const name of names) {
    result[name] = new DialogStateHelper();
  }

  return result;
}
