import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../constants/icons.constants';
import { ProjectEmail } from '../../../../../features/partner/models/project-email.models';

/**
 * Email lista sor komponens.
 * Feladó, tárgy, előnézet, dátum, státusz ikonok.
 */
@Component({
  selector: 'app-email-list-item',
  standalone: true,
  imports: [LucideAngularModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="email-row"
      [class.email-row--unread]="!email().isRead"
      [class.email-row--selected]="isSelected()"
      (click)="select.emit(email())"
    >
      <div class="email-row__indicator">
        @if (email().direction === 'inbound') {
          <lucide-icon [name]="ICONS.ARROW_DOWN_LEFT" [size]="14" class="text-blue-500" />
        } @else {
          <lucide-icon [name]="ICONS.ARROW_UP_RIGHT" [size]="14" class="text-green-500" />
        }
      </div>

      <div class="email-row__content">
        <div class="email-row__header">
          <span class="email-row__sender">{{ senderDisplay() }}</span>
          <span class="email-row__date">{{ email().emailDate | date:'yyyy.MM.dd. HH:mm' }}</span>
        </div>
        <div class="email-row__subject">{{ email().subject }}</div>
        <div class="email-row__preview">{{ email().bodyPreview }}</div>
      </div>

      <div class="email-row__badges">
        @if (!email().isRead) {
          <span class="badge badge--unread"></span>
        }
        @if (email().needsReply && !email().isReplied) {
          <lucide-icon [name]="ICONS.REPLY" [size]="14" class="text-amber-500" />
        }
        @if (email().hasAttachments) {
          <lucide-icon [name]="ICONS.PAPERCLIP" [size]="14" class="text-gray-400" />
        }
      </div>
    </div>
  `,
  styles: [`
    .email-row {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: #f8fafc;
      }

      &--unread {
        background: #eff6ff;

        .email-row__sender {
          font-weight: 600;
        }

        .email-row__subject {
          font-weight: 600;
        }
      }

      &--selected {
        background: #e0f2fe;
        border-left: 3px solid var(--color-primary, #1e3a5f);
        padding-left: 13px;
      }
    }

    .email-row__indicator {
      flex-shrink: 0;
      margin-right: 10px;
      margin-top: 2px;
    }

    .email-row__content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .email-row__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .email-row__sender {
      font-size: 0.875rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email-row__date {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
      margin-left: 8px;
      flex-shrink: 0;
    }

    .email-row__subject {
      font-size: 0.8125rem;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .email-row__preview {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email-row__badges {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: 8px;
      margin-top: 2px;

      > * {
        margin-left: 4px;
      }
    }

    .badge--unread {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
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
}
