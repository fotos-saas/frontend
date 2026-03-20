import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { QuickReply } from '../../../models/email-client.models';

@Component({
  selector: 'app-quick-reply-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="quick-reply-section">
      <h4 class="section-title">
        <lucide-icon [name]="ICONS.SPARKLES" [size]="14" />
        AI Gyorsválasz
      </h4>

      @if (loading()) {
        <div class="loading-chips">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-chip"></div>
          }
        </div>
      } @else if (replies().length > 0) {
        <div class="chips">
          @for (reply of replies(); track reply.text) {
            <button
              class="reply-chip"
              [class]="'reply-chip reply-chip--' + reply.tone"
              (click)="selectReply.emit(reply.text)"
            >
              {{ reply.text }}
            </button>
          }
        </div>
      } @else if (requested()) {
        <p class="no-replies">Nincs javaslat ehhez az emailhez</p>
      } @else {
        <button class="request-btn" (click)="onRequest()">
          <lucide-icon [name]="ICONS.SPARKLES" [size]="14" />
          Javaslatok kérése
        </button>
      }
    </div>
  `,
  styles: [`
    .quick-reply-section {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--primary-50, #eef2ff);
      border-radius: 8px;
      border: 1px solid var(--primary-100, #e0e7ff);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-700, #4338ca);
      margin: 0 0 8px;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .reply-chip {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      border: 1px solid var(--primary-200, #c7d2fe);
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #111827);
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      line-height: 1.3;

      &:hover {
        background: var(--primary-100, #e0e7ff);
        border-color: var(--primary-400, #818cf8);
      }

      &--formal {
        border-color: var(--blue-200, #bfdbfe);
        &:hover { background: var(--blue-50, #eff6ff); }
      }

      &--casual {
        border-color: var(--green-200, #bbf7d0);
        &:hover { background: var(--green-50, #f0fdf4); }
      }
    }

    .loading-chips {
      display: flex;
      gap: 8px;
    }

    .skeleton-chip {
      height: 30px;
      width: 120px;
      border-radius: 16px;
      background: var(--primary-100, #e0e7ff);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .no-replies {
      font-size: 12px;
      color: var(--primary-500, #6366f1);
      margin: 0;
    }

    .request-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--primary-200, #c7d2fe);
      background: var(--bg-primary, #fff);
      color: var(--primary-700, #4338ca);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--primary-100, #e0e7ff);
      }
    }
  `],
})
export class QuickReplyBarComponent {
  readonly ICONS = ICONS;

  readonly replies = input.required<QuickReply[]>();
  readonly loading = input(false);

  readonly selectReply = output<string>();
  readonly requestReplies = output<void>();

  readonly requested = signal(false);

  onRequest(): void {
    this.requested.set(true);
    this.requestReplies.emit();
  }
}
