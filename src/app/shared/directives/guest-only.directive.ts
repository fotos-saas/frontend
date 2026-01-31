import { Directive, inject, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive: csak vendég felhasználóknak jeleníti meg.
 *
 * @example
 * <div *appGuestOnly class="warning-banner">Korlátozott hozzáférés</div>
 */
@Directive({
  selector: '[appGuestOnly]',
  standalone: true,
})
export class GuestOnlyDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private hasView = false;

  constructor() {
    effect(() => {
      const isGuest = this.authService.isGuest();
      this.updateView(isGuest);
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
