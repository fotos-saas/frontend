/**
 * Dialog Utility - Backdrop kattintás kezelés
 *
 * Megoldja a problémát, amikor szöveg kijelölés közben az egeret
 * a dialóguson kívülre húzzuk és az mouseup event bezárná a dialógust.
 *
 * Használat a komponensben:
 * ```typescript
 * import { createBackdropHandler, BackdropHandler } from '@shared/utils/dialog.util';
 *
 * export class MyDialogComponent {
 *   private backdropHandler = createBackdropHandler(() => this.close.emit());
 *
 *   // Template-ben:
 *   // <div class="dialog-backdrop"
 *   //      (mousedown)="backdropHandler.onMouseDown($event)"
 *   //      (click)="backdropHandler.onClick($event)">
 * }
 * ```
 */

export interface BackdropHandler {
  onMouseDown: (event: MouseEvent) => void;
  onClick: (event: MouseEvent) => void;
}

/**
 * Létrehoz egy backdrop kezelőt a dialógushoz
 * @param closeCallback - A függvény ami bezárja a dialógust
 * @param backdropClass - A backdrop elem class neve (default: 'dialog-backdrop')
 */
export function createBackdropHandler(
  closeCallback: () => void,
  backdropClass = 'dialog-backdrop'
): BackdropHandler {
  let mouseDownOnBackdrop = false;

  return {
    onMouseDown(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      mouseDownOnBackdrop = target.classList.contains(backdropClass);
    },

    onClick(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      const isBackdrop = target.classList.contains(backdropClass);

      // Csak akkor zárjuk be, ha MINDKÉT event (mousedown ÉS click) a backdropon történt
      if (isBackdrop && mouseDownOnBackdrop) {
        closeCallback();
      }

      // Reset
      mouseDownOnBackdrop = false;
    }
  };
}
