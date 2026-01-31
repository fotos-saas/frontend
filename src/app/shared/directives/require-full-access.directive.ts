import { Directive, inject, TemplateRef, ViewContainerRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive: elrejti az elemet, ha a felhasználónak nincs írási joga.
 *
 * Csak 'code' token esetén jelenik meg az elem (kódos belépés = teljes jogosultság).
 * Preview és share tokenek esetén el van rejtve (csak olvasási jog).
 *
 * @example
 * <button *appRequireFullAccess>Időpont beállítása</button>
 */
@Directive({
  selector: '[appRequireFullAccess]',
  standalone: true,
})
export class RequireFullAccessDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private hasView = false;

  constructor() {
    // canFinalize$ reaktívan figyeljük - csak code token esetén true
    this.authService.canFinalize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(canFinalize => {
        this.updateView(canFinalize);
      });
  }

  private updateView(show: boolean): void {
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
