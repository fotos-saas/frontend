import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { VersionCheckService } from '../../../core/services/version-check.service';
import { ICONS } from '../../constants/icons.constants';

const DISMISS_RESHOW_MS = 5 * 60 * 1000;

/**
 * Frissítési banner - fix pozícióban az oldal alján jelenik meg
 * ha új verzió érhető el a szerveren.
 *
 * 1x elrejthető, de ~5 perc múlva újra megjelenik.
 */
@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBanner()) {
      <div class="update-banner" role="alert" aria-live="polite">
        <div class="banner-content">
          <div class="banner-icon">
            <lucide-icon [name]="ICONS.REFRESH" [size]="20" />
          </div>
          <div class="banner-text">
            <span class="banner-title">Új verzió érhető el</span>
            <span class="banner-subtitle">Frissítsd az oldalt az új funkciók használatához</span>
          </div>
          <button
            class="refresh-btn"
            (click)="refreshPage()"
            aria-label="Oldal frissítése az új verzió betöltéséhez"
          >
            <lucide-icon [name]="ICONS.REFRESH" [size]="16" />
            <span>Frissítés</span>
          </button>
          <button
            class="dismiss-btn"
            (click)="dismiss()"
            aria-label="Értesítés elrejtése"
          >
            <lucide-icon [name]="ICONS.X" [size]="16" />
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .update-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9998;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%);
      color: white;
      padding: 12px 16px;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.2);
      -webkit-animation: slideUp 0.3s ease-out;
      animation: slideUp 0.3s ease-out;
    }

    @-webkit-keyframes slideUp {
      from {
        -webkit-transform: translateY(100%);
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        -webkit-transform: translateY(0);
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .banner-content {
      display: -webkit-flex;
      display: flex;
      -webkit-align-items: center;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .banner-icon {
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
      display: -webkit-flex;
      display: flex;
      -webkit-align-items: center;
      align-items: center;
      -webkit-justify-content: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      margin-right: 12px;
    }

    .banner-text {
      -webkit-flex: 1;
      flex: 1;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-direction: column;
      flex-direction: column;
      margin-right: 12px;
    }

    .banner-title {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.3;
    }

    .banner-subtitle {
      font-size: 12px;
      opacity: 0.9;
      line-height: 1.3;
    }

    .refresh-btn {
      display: -webkit-inline-flex;
      display: inline-flex;
      -webkit-align-items: center;
      align-items: center;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      -webkit-transition: background 0.2s;
      transition: background 0.2s;
      white-space: nowrap;
      margin-right: 8px;
    }

    .refresh-btn lucide-icon {
      margin-right: 6px;
    }

    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.35);
    }

    .refresh-btn:active {
      background: rgba(255, 255, 255, 0.45);
    }

    .dismiss-btn {
      display: -webkit-flex;
      display: flex;
      -webkit-align-items: center;
      align-items: center;
      -webkit-justify-content: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      -webkit-transition: all 0.2s;
      transition: all 0.2s;
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
    }

    .dismiss-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    @media (max-width: 480px) {
      .banner-subtitle {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .update-banner {
        -webkit-animation: none;
        animation: none;
      }
    }
  `]
})
export class UpdateBannerComponent {
  private readonly versionCheckService = inject(VersionCheckService);
  protected readonly ICONS = ICONS;

  private dismissed = signal(false);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly showBanner = computed(() =>
    this.versionCheckService.updateAvailable() && !this.dismissed()
  );

  refreshPage(): void {
    this.versionCheckService.reloadPage();
  }

  dismiss(): void {
    this.dismissed.set(true);

    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }

    this.dismissTimer = setTimeout(() => {
      if (this.versionCheckService.updateAvailable()) {
        this.dismissed.set(false);
      }
    }, DISMISS_RESHOW_MS);
  }
}
