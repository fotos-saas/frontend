import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants';
import { QuoteEmail } from '../../../../models/quote.models';

@Component({
  selector: 'app-quote-email-history',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section class="email-history">
      <h2 class="section-title">
        <lucide-icon [name]="ICONS.MAIL" [size]="18" />
        Email előzmények
      </h2>
      <div class="history-list">
        @for (email of emails(); track email.id) {
          <div class="history-item">
            <div class="item-info">
              <span class="item-email">{{ email.to_email }}</span>
              <span class="item-subject">{{ email.subject }}</span>
            </div>
            <div class="item-meta">
              <span class="source-badge" [class.source-partner]="email.smtp_source === 'partner'">
                {{ email.smtp_source === 'partner' ? 'Partner SMTP' : 'Rendszer' }}
              </span>
              <span class="item-date">{{ formatDate(email.sent_at) }}</span>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .email-history {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 16px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      gap: 12px;
    }
    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .item-email {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }
    .item-subject {
      font-size: 0.75rem;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .source-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #64748b;
    }
    .source-partner {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .item-date {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteEmailHistoryComponent {
  protected readonly ICONS = ICONS;
  readonly emails = input.required<QuoteEmail[]>();

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
