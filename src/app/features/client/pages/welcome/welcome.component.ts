import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClientService } from '../../services/client.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Client Welcome Page - Üdvözlő oldal az ügyfél számára
 */
@Component({
  selector: 'app-client-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="welcome-page page-card">
      <!-- Hero section -->
      <div class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            Üdvözlünk, <span class="highlight">{{ clientName() }}</span>!
          </h1>
          <p class="hero-subtitle">
            Köszönjük, hogy minket választottál a tablókép elkészítéséhez.
          </p>
        </div>
      </div>

      <!-- Steps section -->
      <div class="steps-section">
        <h2 class="section-title">Hogyan működik?</h2>

        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Böngészd át a képeket</h3>
              <p>Nézd meg az összes feltöltött fotót az albumodban.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Válaszd ki a kedvenceidet</h3>
              <p>Jelöld be azokat a képeket, amelyeket szeretnél a tablón látni.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Véglegesítsd a választásod</h3>
              <p>Ha készen állsz, kattints a véglegesítés gombra.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tips section -->
      <div class="tips-section">
        <div class="tip">
          <lucide-icon [name]="ICONS.INFO" [size]="20"></lucide-icon>
          <div>
            <strong>Tipp:</strong> Bármikor megszakíthatod a kiválasztást.
            A "Mentés" gombbal elmented az aktuális állapotot, és később folytathatod.
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-section">
        <a routerLink="/client/albums" class="cta-button">
          Ugrás az albumokhoz
          <lucide-icon [name]="ICONS.ARROW_RIGHT" [size]="20"></lucide-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .welcome-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Hero */
    .hero {
      text-align: center;
      padding: 48px 24px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 16px;
      margin-bottom: 32px;
    }

    .hero-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }

    .highlight {
      color: #3b82f6;
    }

    .hero-subtitle {
      font-size: 1rem;
      color: #64748b;
      margin: 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Steps */
    .steps-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 20px 0;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .step:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .step-number {
      width: 36px;
      height: 36px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .step-content h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .step-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }

    /* Tips */
    .tips-section {
      margin-bottom: 32px;
    }

    .tip {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #f0f9ff;
      border-radius: 10px;
      border-left: 3px solid #3b82f6;
      font-size: 0.875rem;
      color: #0c4a6e;
      line-height: 1.5;
    }

    .tip lucide-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .tip strong {
      color: #0369a1;
    }

    /* CTA */
    .cta-section {
      text-align: center;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 28px;
      background: #3b82f6;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .cta-button:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
    }

    .cta-button:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .welcome-page {
        padding: 16px;
      }

      .hero {
        padding: 32px 20px;
      }

      .hero-title {
        font-size: 1.5rem;
      }

      .step {
        padding: 16px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .step,
      .cta-button {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientWelcomeComponent {
  private clientService = inject(ClientService);
  protected readonly ICONS = ICONS;

  clientName = this.clientService.clientName;
}
