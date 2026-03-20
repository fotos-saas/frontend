import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { EmailDetail, EmailListItem, QuickReply, EmailLabel } from '../../../models/email-client.models';
import { EmailClientService } from '../../../services/email-client.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuickReplyBarComponent } from './quick-reply-bar.component';
import { LabelPickerDropdownComponent } from './label-picker-dropdown.component';

@Component({
  selector: 'app-email-reader-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, SafeHtmlPipe, QuickReplyBarComponent, LabelPickerDropdownComponent],
  template: `
    @if (loadingDetail()) {
      <div class="loading-detail">
        <lucide-icon [name]="ICONS.LOADER" [size]="24" class="spin" />
        <span>Betöltés...</span>
      </div>
    } @else {
      <div class="reader-content">
        <!-- Fejléc -->
        <div class="reader-header">
          <button class="back-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="18" />
            <span class="back-text">Vissza</span>
          </button>
          <div class="header-actions">
            <button class="action-btn" (click)="toggleStar.emit()" [class.starred]="email().is_starred">
              <lucide-icon [name]="ICONS.STAR_ICON" [size]="16" />
            </button>
            <app-label-picker-dropdown
              [emailId]="email().id"
              [currentLabels]="email().labels"
              [allLabels]="allLabels()"
              (labelsChanged)="labelsChanged.emit($event)"
            />
          </div>
        </div>

        <!-- Tárgy -->
        <h2 class="subject">{{ email().subject || '(nincs tárgy)' }}</h2>

        <!-- Feladó / címzett -->
        <div class="meta-block">
          <div class="meta-row">
            <span class="meta-label">{{ email().direction === 'inbound' ? 'Feladó' : 'Címzett' }}:</span>
            <span class="meta-value">
              {{ email().direction === 'inbound' ? (email().from_name || email().from_email) : (email().to_name || email().to_email) }}
              <span class="meta-email">&lt;{{ email().direction === 'inbound' ? email().from_email : email().to_email }}&gt;</span>
            </span>
          </div>
          @if (email().cc && email().cc!.length > 0) {
            <div class="meta-row">
              <span class="meta-label">CC:</span>
              <span class="meta-value">
                @for (cc of email().cc!; track cc.email; let last = $last) {
                  {{ cc.name || cc.email }}{{ last ? '' : ', ' }}
                }
              </span>
            </div>
          }
          <div class="meta-row">
            <span class="meta-label">Dátum:</span>
            <span class="meta-value">{{ formatDate(email().email_date) }}</span>
          </div>
          @if (email().project) {
            <div class="meta-row">
              <span class="meta-label">Projekt:</span>
              <span class="meta-value project-link">{{ email().project!.name }}</span>
            </div>
          }
          @if (email().labels.length > 0) {
            <div class="meta-row">
              <span class="meta-label">Címkék:</span>
              <div class="labels-row">
                @for (label of email().labels; track label.id) {
                  <span class="label-chip" [style.background-color]="label.color + '20'" [style.color]="label.color">
                    {{ label.name }}
                  </span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Body -->
        <div class="email-body">
          @if (email().body_html) {
            <div class="body-html" [innerHTML]="email().body_html | safeHtml"></div>
          } @else if (email().body_text) {
            <pre class="body-text">{{ email().body_text }}</pre>
          } @else {
            <p class="no-body">Nincs tartalom</p>
          }
        </div>

        <!-- Csatolmányok -->
        @if (email().attachments && email().attachments!.length > 0) {
          <div class="attachments-section">
            <h4 class="section-title">
              <lucide-icon [name]="ICONS.PAPERCLIP" [size]="14" />
              Csatolmányok ({{ email().attachments!.length }})
            </h4>
            <div class="attachments-list">
              @for (att of email().attachments!; track att.name) {
                <div class="attachment-item">
                  <lucide-icon [name]="ICONS.FILE" [size]="14" />
                  <span class="att-name">{{ att.name }}</span>
                  @if (att.size) {
                    <span class="att-size">{{ formatSize(att.size) }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- AI Gyorsválasz -->
        @if (email().direction === 'inbound') {
          <app-quick-reply-bar
            [replies]="quickReplies()"
            [loading]="loadingQuickReplies()"
            (selectReply)="onQuickReplySelect($event)"
          />
        }

        <!-- Válasz textarea -->
        @if (showReply()) {
          <div class="reply-section">
            <h4 class="section-title">
              <lucide-icon [name]="ICONS.REPLY" [size]="14" />
              Válasz
            </h4>
            <textarea
              class="reply-textarea"
              rows="4"
              [(ngModel)]="replyBody"
              placeholder="Írd ide a választ..."
            ></textarea>
            <div class="reply-actions">
              <button class="btn btn-secondary" (click)="showReply.set(false); replyBody = ''">Mégse</button>
              <button class="btn btn-primary" (click)="sendReply()" [disabled]="!replyBody.trim() || sending()">
                @if (sending()) {
                  <lucide-icon [name]="ICONS.LOADER" [size]="14" class="spin" />
                }
                Küldés
              </button>
            </div>
          </div>
        } @else if (email().direction === 'inbound') {
          <button class="btn btn-outline reply-trigger" (click)="showReply.set(true)">
            <lucide-icon [name]="ICONS.REPLY" [size]="14" />
            Válasz írása
          </button>
        }

        <!-- Thread -->
        @if (thread().length > 0) {
          <details class="thread-section">
            <summary class="thread-summary">
              <lucide-icon [name]="ICONS.MAIL" [size]="14" />
              Korábbi levelek ({{ thread().length }})
            </summary>
            <div class="thread-list">
              @for (msg of thread(); track msg.id) {
                <div class="thread-item" [class.thread--outbound]="msg.direction === 'outbound'">
                  <div class="thread-header">
                    <span class="thread-sender">{{ msg.from_name || msg.from_email }}</span>
                    <span class="thread-date">{{ formatDate(msg.email_date) }}</span>
                  </div>
                  <p class="thread-preview">{{ msg.body_preview }}</p>
                </div>
              }
            </div>
          </details>
        }
      </div>
    }
  `,
  styleUrl: './email-reader-panel.component.scss',
})
export class EmailReaderPanelComponent {
  private readonly emailClientService = inject(EmailClientService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly email = input.required<EmailDetail>();
  readonly thread = input.required<EmailListItem[]>();
  readonly quickReplies = input.required<QuickReply[]>();
  readonly loadingDetail = input(false);
  readonly loadingQuickReplies = input(false);
  readonly allLabels = input.required<EmailLabel[]>();

  readonly close = output<void>();
  readonly toggleStar = output<void>();
  readonly labelsChanged = output<{ emailId: number; labels: { id: number; name: string; color: string }[] }>();
  readonly sendReplyEvent = output<{ emailId: number; body: string }>();

  readonly showReply = signal(false);
  readonly sending = input(false);

  replyBody = '';

  onQuickReplySelect(text: string): void {
    this.replyBody = text;
    this.showReply.set(true);
  }

  sendReply(): void {
    if (!this.replyBody.trim()) return;
    this.sendReplyEvent.emit({ emailId: this.email().id, body: this.replyBody });
  }

  onReplySent(): void {
    this.replyBody = '';
    this.showReply.set(false);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
