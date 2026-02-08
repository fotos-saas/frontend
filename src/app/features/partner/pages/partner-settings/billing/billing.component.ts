import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-billing',
  standalone: true,
  template: `
    <div class="billing-page page-card">
      <h1>Számlázás</h1>
      <p class="placeholder-text">Hamarosan itt lesznek a számlázási beállítások.</p>
    </div>
  `,
  styles: [`
    .billing-page {
      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--color-text);
      }

      .placeholder-text {
        color: var(--color-text-muted);
        font-size: 0.95rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingComponent {}
