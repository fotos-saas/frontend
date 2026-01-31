/**
 * Debounce Utility
 *
 * Központosított debounce implementáció kereséshez és egyéb input kezeléshez.
 */

/**
 * Debounce controller - signal-alapú használathoz
 */
export interface DebounceController {
  /** Trigger a debounced action */
  trigger: () => void;
  /** Cancel pending action */
  cancel: () => void;
  /** Execute immediately */
  flush: () => void;
}

/**
 * Debounce controller létrehozása callback-kel
 *
 * @param callback A késleltetendő callback
 * @param delay Késleltetés ms-ben (default: 300)
 *
 * @example
 * private readonly searchDebounce = createDebounceController(
 *   () => this.loadData(),
 *   300
 * );
 *
 * onSearchChange() {
 *   this.searchDebounce.trigger();
 * }
 */
export function createDebounceController(
  callback: () => void,
  delay = 300
): DebounceController {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  return {
    trigger() {
      pending = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        pending = false;
        callback();
      }, delay);
    },

    cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pending = false;
    },

    flush() {
      if (timeoutId !== null && pending) {
        clearTimeout(timeoutId);
        timeoutId = null;
        pending = false;
        callback();
      }
    },
  };
}
