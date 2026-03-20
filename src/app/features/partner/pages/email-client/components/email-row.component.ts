import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailListItem } from '../../../models/email-client.models';

@Component({
  selector: 'app-email-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div
      class="email-row"
      [class.unread]="!email().is_read"
      [class.selected]="isSelected()"
      (click)="select.emit(email())"
    >
      <!-- Csillag -->
      <button class="star-btn" (click)="onStarClick($event)" [class.starred]="email().is_starred">
        <lucide-icon [name]="ICONS.STAR_ICON" [size]="14" />
      </button>

      <!-- Avatar -->
      <div class="avatar" [class.avatar--outbound]="email().direction === 'outbound'">
        @if (email().direction === 'inbound') {
          <span>{{ avatarLetter() }}</span>
        } @else {
          <lucide-icon [name]="ICONS.ARROW_UP_RIGHT" [size]="14" />
        }
      </div>

      <!-- Tartalom -->
      <div class="row-content">
        <div class="row-top">
          <span class="sender" [class.sender--unread]="!email().is_read">{{ senderDisplay() }}</span>
          <div class="row-meta">
            @for (label of email().labels; track label.id) {
              <span class="label-chip" [style.background-color]="label.color + '20'" [style.color]="label.color">
                {{ label.name }}
              </span>
            }
            @if (email().has_attachments) {
              <lucide-icon [name]="ICONS.PAPERCLIP" [size]="12" class="attachment-icon" />
            }
            <span class="date">{{ dateDisplay() }}</span>
          </div>
        </div>
        <div class="row-bottom">
          <span class="subject" [class.subject--unread]="!email().is_read">{{ email().subject || '(nincs tárgy)' }}</span>
          <span class="preview"> — {{ email().body_preview }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #f3f4f6);
      cursor: pointer;
      transition: background 0.1s;
      animation: fadeIn 0.2s ease both;

      &:hover {
        background: var(--bg-hover, #f9fafb);
      }

      &.selected {
        background: var(--primary-50, #eef2ff);
      }

      &.unread {
        background: var(--bg-primary, #fff);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .star-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      color: var(--text-tertiary, #d1d5db);
      flex-shrink: 0;

      &:hover {
        color: var(--warning-500, #eab308);
      }

      &.starred {
        color: var(--warning-500, #eab308);
      }
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, var(--primary-500, #6366f1), var(--primary-600, #4f46e5));
      flex-shrink: 0;

      &--outbound {
        background: var(--bg-hover, #e5e7eb);
        color: var(--text-tertiary, #9ca3af);
      }
    }

    .row-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .row-top {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sender {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &--unread {
        font-weight: 600;
        color: var(--text-primary, #111827);
      }
    }

    .row-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .label-chip {
      font-size: 10px;
      font-weight: 500;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .attachment-icon {
      color: var(--text-tertiary, #9ca3af);
    }

    .date {
      font-size: 11px;
      color: var(--text-tertiary, #9ca3af);
      white-space: nowrap;
    }

    .row-bottom {
      display: flex;
      align-items: baseline;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .subject {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);

      &--unread {
        font-weight: 600;
        color: var(--text-primary, #111827);
      }
    }

    .preview {
      font-size: 12px;
      color: var(--text-tertiary, #9ca3af);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .label-chip { display: none; }
    }
  `],
})
export class EmailRowComponent {
  readonly ICONS = ICONS;

  readonly email = input.required<EmailListItem>();
  readonly isSelected = input(false);

  readonly select = output<EmailListItem>();
  readonly toggleStar = output<EmailListItem>();

  readonly senderDisplay = computed(() => {
    const e = this.email();
    if (e.direction === 'outbound') {
      return `Nekem: ${e.to_email}`;
    }
    return e.from_name || e.from_email;
  });

  readonly avatarLetter = computed(() => {
    const e = this.email();
    const name = e.from_name || e.from_email;
    return name.charAt(0).toUpperCase();
  });

  readonly dateDisplay = computed(() => {
    const date = new Date(this.email().email_date);
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

  onStarClick(event: Event): void {
    event.stopPropagation();
    this.toggleStar.emit(this.email());
  }
}
