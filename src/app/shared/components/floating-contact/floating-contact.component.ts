import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { FloatingFabComponent } from '../floating-fab/floating-fab.component';

/**
 * Floating Contact Component
 *
 * FAB gomb a jobb alsó sarokban kontakt információkkal.
 * Használja a FloatingFabComponent-et az alap struktúrához.
 */
@Component({
  selector: 'app-floating-contact',
  standalone: true,
  imports: [FloatingFabComponent],
  template: `
    <app-floating-fab icon="question" color="purple" ariaLabel="Kontakt információk">
      <!-- Partner szekció (ha van) -->
      @if (project()?.partnerName) {
        <div class="contact-section">
          <h3 class="section-title">Partner</h3>

          <div class="contact-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{{ project()?.partnerName }}</span>
          </div>

          @if (project()?.partnerPhone) {
            <a
              [href]="'tel:' + project()?.partnerPhone"
              class="contact-item contact-link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{{ project()?.partnerPhone }}</span>
            </a>
          }

          @if (project()?.partnerEmail) {
            <button
              type="button"
              (click)="copyEmail(project()?.partnerEmail!)"
              class="contact-item contact-link"
              title="Kattints a másoláshoz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{{ project()?.partnerEmail }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          }
        </div>
      }

      <!-- Tablókészítő szekció -->
      <div class="contact-section">
        <h3 class="section-title">Tablókészítő</h3>

        <div class="contact-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Nové Ferenc</span>
        </div>

        <a
          href="tel:+36706328131"
          class="contact-item contact-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>06 70 632 8131</span>
        </a>

        <button
          type="button"
          (click)="copyEmail('info@tablostudio.hu')"
          class="contact-item contact-link"
          title="Kattints a másoláshoz"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>info&#64;tablostudio.hu</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </app-floating-fab>
  `,
  styles: [`
    /* Szekció */
    .contact-section {
      &:not(:last-child) {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      }
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin: 0 0 10px;
    }

    /* Kontakt elem */
    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      margin: 0 -10px;
      border-radius: 8px;
      font-size: 14px;
      color: #334155;
      text-decoration: none;
      background: none;
      border: none;
      width: calc(100% + 20px);
      text-align: left;
      cursor: default;

      svg {
        flex-shrink: 0;
        color: #64748b;
      }

      span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .contact-link {
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: rgba(124, 58, 237, 0.08);
      }

      &:active {
        background-color: rgba(124, 58, 237, 0.15);
      }
    }

    .copy-icon {
      color: #94a3b8;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .contact-link:hover .copy-icon {
      opacity: 1;
    }

    /* A11y - Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .contact-link {
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingContactComponent {
  private readonly authService = inject(AuthService);
  private readonly clipboardService = inject(ClipboardService);

  /** Projekt adatok (partner infó) */
  project = toSignal(this.authService.project$);

  /**
   * Email másolása vágólapra
   */
  copyEmail(email: string): void {
    this.clipboardService.copyEmail(email);
  }
}
