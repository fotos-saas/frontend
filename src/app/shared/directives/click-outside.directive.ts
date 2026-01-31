import { Directive, ElementRef, output, OnDestroy, OnInit, inject, NgZone, input } from '@angular/core';

/**
 * ClickOutside Directive
 *
 * Eseményt emit-el amikor a felhasználó a host elemen kívülre kattint,
 * vagy megnyomja az Escape billentyűt.
 * Tipikus használat: dialógusok bezárása backdrop kattintásra vagy Escape-re.
 *
 * Használat:
 *   <div class="dialog-backdrop" (appClickOutsideEvent)="close()">
 *     <div class="dialog-content">...</div>
 *   </div>
 *
 * Escape kezelés kikapcsolása:
 *   <div class="dialog-backdrop" (appClickOutsideEvent)="close()" [escapeToClose]="false">
 *
 * FONTOS: A backdrop elemre tedd, és a child elem (dialog content) ne buborékoljon fel!
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  /** Signal-based inputs */
  readonly escapeToClose = input<boolean>(true);

  /** Signal-based outputs - named same as selector for directive output binding pattern */
  readonly appClickOutside = output<MouseEvent | KeyboardEvent>();

  private clickListener?: (event: MouseEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;

  ngOnInit(): void {
    // Kicsit késleltetjük a listener hozzáadását,
    // hogy a megnyitó kattintás ne triggerel-je azonnal a bezárást
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.clickListener = this.handleClick.bind(this);
        this.keydownListener = this.handleKeydown.bind(this);
        document.addEventListener('click', this.clickListener, true);
        document.addEventListener('keydown', this.keydownListener, true);
      }, 10);
    });
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, true);
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const hostElement = this.elementRef.nativeElement as HTMLElement;

    // Ha a kattintás a host elemen történt (nem a gyerekein),
    // akkor az "kívülre" számít (backdrop kattintás)
    if (target === hostElement) {
      this.ngZone.run(() => {
        this.appClickOutside.emit(event);
      });
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.escapeToClose()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.ngZone.run(() => {
        this.appClickOutside.emit(event);
      });
    }
  }
}
