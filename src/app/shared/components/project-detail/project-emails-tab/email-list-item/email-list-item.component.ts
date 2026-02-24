import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../constants/icons.constants';
import { ProjectEmail } from '../../../../../features/partner/models/project-email.models';

/**
 * Email lista sor komponens.
 * Gmail-szerű design: feladó, tárgy — preview, dátum, badge-ek.
 */
@Component({
  selector: 'app-email-list-item',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="email-row"
      [class.email-row--unread]="!email().isRead"
      [class.email-row--selected]="isSelected()"
      [class.email-row--outbound]="email().direction === 'outbound'"
      (click)="select.emit(email())"
    >
      <!-- Avatar / Irány ikon -->
      <div class="email-row__avatar" [class.email-row__avatar--outbound]="email().direction === 'outbound'">
        @if (email().direction === 'inbound') {
          <span class="avatar-letter">{{ avatarLetter() }}</span>
        } @else {
          <lucide-icon [name]="ICONS.ARROW_UP_RIGHT" [size]="16" />
        }
      </div>

      <!-- Tartalom -->
      <div class="email-row__body">
        <div class="email-row__top">
          <span class="email-row__sender">{{ senderDisplay() }}</span>
          <div class="email-row__meta">
            @if (email().hasAttachments) {
              <lucide-icon [name]="ICONS.PAPERCLIP" [size]="13" class="meta-icon" />
            }
            @if (email().needsReply && !email().isReplied) {
              <span class="needs-reply-badge">
                <lucide-icon [name]="ICONS.REPLY" [size]="11" />
                Válaszra vár
              </span>
            }
            <span class="email-row__date">{{ dateDisplay() }}</span>
          </div>
        </div>
        <div class="email-row__bottom">
          <span class="email-row__subject">{{ email().subject }}</span>
          @if (email().bodyPreview) {
            <span class="email-row__sep">—</span>
            <span class="email-row__preview">{{ email().bodyPreview }}</span>
          }
        </div>
      </div>

      <!-- Olvasatlan jelző -->
      @if (!email().isRead) {
        <span class="unread-dot"></span>
      }
    </div>
  `,
  styles: [`
    .email-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.12s ease;
      position: relative;
    }

    .email-row:hover {
      background: #f8fafc;
    }

    .email-row--unread {
      background: #fefefe;

      .email-row__sender {
        font-weight: 700;
        color: #0f172a;
      }

      .email-row__subject {
        font-weight: 600;
        color: #1e293b;
      }
    }

    .email-row--selected {
      background: #eff6ff;
      border-left: 3px solid var(--color-primary, #2563eb);
      padding-left: 13px;
    }

    .email-row--outbound {
      .email-row__sender {
        color: #64748b;
        font-weight: 400;
      }
    }

    /* Avatar */
    .email-row__avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-right: 12px;
    }

    .email-row__avatar--outbound {
      background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    }

    .avatar-letter {
      font-size: 0.8125rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      line-height: 1;
    }

    .email-row__avatar lucide-icon {
      color: white;
    }

    /* Body */
    .email-row__body {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .email-row__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .email-row__sender {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .email-row__meta {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .meta-icon {
      color: #94a3b8;
      margin-right: 6px;
    }

    .needs-reply-badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 4px;
      background: #fef3c7;
      color: #b45309;
      font-size: 0.6875rem;
      font-weight: 600;
      white-space: nowrap;
      margin-right: 8px;

      lucide-icon {
        margin-right: 3px;
      }
    }

    .email-row__date {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .email-row--unread .email-row__date {
      color: #475569;
      font-weight: 500;
    }

    /* Tárgy + preview egy sorban (Gmail stílus) */
    .email-row__bottom {
      display: flex;
      align-items: baseline;
      white-space: nowrap;
      overflow: hidden;
    }

    .email-row__subject {
      font-size: 0.8125rem;
      color: #475569;
      flex-shrink: 0;
      max-width: 50%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email-row__sep {
      margin: 0 6px;
      color: #cbd5e1;
      flex-shrink: 0;
    }

    .email-row__preview {
      font-size: 0.8125rem;
      color: #94a3b8;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    /* Olvasatlan jelző */
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
      flex-shrink: 0;
      margin-left: 8px;
    }

    @media (max-width: 640px) {
      .email-row__avatar {
        width: 28px;
        height: 28px;
        margin-right: 10px;
      }

      .avatar-letter {
        font-size: 0.6875rem;
      }

      .needs-reply-badge {
        display: none;
      }

      .email-row__subject {
        max-width: 70%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition-duration: 0.01ms !important; }
    }
  `],
})
export class EmailListItemComponent {
  readonly email = input.required<ProjectEmail>();
  readonly isSelected = input(false);
  readonly select = output<ProjectEmail>();
  readonly ICONS = ICONS;

  readonly senderDisplay = computed(() => {
    const e = this.email();
    if (e.direction === 'inbound') {
      return e.fromName || e.fromEmail;
    }
    return `Nekem → ${e.toName || e.toEmail}`;
  });

  readonly avatarLetter = computed(() => {
    const e = this.email();
    const name = e.direction === 'inbound'
      ? (e.fromName || e.fromEmail)
      : (e.toName || e.toEmail);
    return name?.charAt(0) || '?';
  });

  readonly dateDisplay = computed(() => {
    const date = new Date(this.email().emailDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
    }

    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  });
}
