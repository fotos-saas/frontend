import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../constants/icons.constants';
import { ProjectEmail, ReplyData } from '../../../../../features/partner/models/project-email.models';

/**
 * Email válasz szerkesztő komponens.
 * Textarea + CC + küldés gomb.
 */
@Component({
  selector: 'app-email-reply',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reply-panel">
      <div class="reply-panel__header">
        <span class="reply-panel__title">
          <lucide-icon [name]="ICONS.REPLY" [size]="14" />
          Válasz: {{ email().fromName || email().fromEmail }}
        </span>
        <button class="reply-panel__close" (click)="cancel.emit()">
          <lucide-icon [name]="ICONS.X" [size]="16" />
        </button>
      </div>

      <textarea
        class="reply-panel__body"
        [(ngModel)]="body"
        placeholder="Válasz szövege..."
        rows="6"
        [disabled]="sending()"
      ></textarea>

      <div class="reply-panel__footer">
        <button
          class="reply-panel__cancel"
          (click)="cancel.emit()"
          [disabled]="sending()"
        >
          Mégse
        </button>
        <button
          class="reply-panel__send"
          (click)="onSend()"
          [disabled]="!body.trim() || sending()"
        >
          @if (sending()) {
            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <lucide-icon [name]="ICONS.SEND" [size]="14" />
          }
          <span>Küldés</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reply-panel {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-top: 16px;
      overflow: hidden;
    }

    .reply-panel__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .reply-panel__title {
      display: flex;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;

      lucide-icon {
        margin-right: 6px;
      }
    }

    .reply-panel__close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;

      &:hover {
        color: #475569;
      }
    }

    .reply-panel__body {
      width: 100%;
      padding: 12px;
      border: none;
      font-size: 0.875rem;
      font-family: inherit;
      line-height: 1.5;
      resize: vertical;
      min-height: 100px;
      color: #1e293b;
      outline: none;

      &::placeholder {
        color: #94a3b8;
      }

      &:disabled {
        background: #f8fafc;
        cursor: not-allowed;
      }
    }

    .reply-panel__footer {
      display: flex;
      justify-content: flex-end;
      padding: 10px 12px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      margin: -4px;
    }

    .reply-panel__cancel,
    .reply-panel__send {
      display: inline-flex;
      align-items: center;
      margin: 4px;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .reply-panel__cancel {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;

      &:hover:not(:disabled) {
        background: #f1f5f9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .reply-panel__send {
      background: var(--color-primary, #1e3a5f);
      border: 1px solid var(--color-primary, #1e3a5f);
      color: white;

      lucide-icon {
        margin-right: 4px;
      }

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition-duration: 0.01ms !important; }
    }
  `],
})
export class EmailReplyComponent {
  readonly email = input.required<ProjectEmail>();
  readonly sending = input(false);

  readonly sendReply = output<ReplyData>();
  readonly cancel = output<void>();

  readonly ICONS = ICONS;

  body = '';

  onSend(): void {
    if (!this.body.trim()) return;
    this.sendReply.emit({ body: this.body.trim() });
  }
}
