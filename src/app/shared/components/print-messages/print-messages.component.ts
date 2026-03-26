import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

import { PrintShopMessage } from '../../../core/models/print-order.models';
import { ICONS } from '../../constants/icons.constants';

/**
 * Megosztott chat komponens a nyomda megrendelés üzenetváltáshoz.
 * Fotós és nyomdász oldalon is használható.
 */
@Component({
  selector: 'app-print-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule, FormsModule],
  templateUrl: './print-messages.component.html',
  styleUrl: './print-messages.component.scss',
})
export class PrintMessagesComponent {
  /** Üzenetek listája */
  messages = input.required<PrintShopMessage[]>();

  /** Töltés állapot */
  loading = input(false);

  /** Küldés folyamatban */
  sending = input(false);

  /** Üzenet küldése esemény */
  sendMessage = output<string>();

  readonly ICONS = ICONS;
  newMessage = signal('');

  private messagesContainer = viewChild<ElementRef>('messagesContainer');

  /** ngModel getter/setter a signal-hoz */
  get newMessageValue(): string {
    return this.newMessage();
  }
  set newMessageValue(val: string) {
    this.newMessage.set(val);
  }

  constructor() {
    // Auto-scroll alulra ha új üzenet jön
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        // Következő renderelési ciklus után görgetünk
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }

  /** Üzenet küldése */
  onSend(): void {
    const msg = this.newMessage().trim();
    if (!msg || this.sending()) return;
    this.sendMessage.emit(msg);
    this.newMessage.set('');
  }

  /** Üzenet típushoz tartozó ikon */
  getMessageIcon(type: string): string {
    switch (type) {
      case 'message':
        return ICONS.MESSAGE_SQUARE;
      case 'deadline_proposed':
        return ICONS.CALENDAR;
      case 'deadline_accepted':
        return ICONS.CALENDAR_CHECK;
      case 'deadline_rejected':
        return ICONS.CALENDAR_X;
      case 'reprint_request':
        return ICONS.REPEAT_2;
      case 'urgent_flag':
        return ICONS.ALERT_TRIANGLE;
      case 'error':
        return ICONS.ALERT_TRIANGLE;
      case 'error_resolved':
        return ICONS.CHECK_CIRCLE;
      case 'system':
        return ICONS.INFO;
      default:
        return ICONS.INFO;
    }
  }

  /** Rendszer üzenet-e */
  isSystemMessage(type: string): boolean {
    return type !== 'message';
  }

  /** Idő formázás — ma: óra:perc, tegnap: "Tegnap HH:MM", régebbi: hónap.nap. HH:MM */
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const time = date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === now.toDateString()) return time;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Tegnap ${time}`;

    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) + '. ' + time;
  }

  /** Dátum formázás (hónap.nap.) */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  /** Görgessen az üzenetek aljára */
  private scrollToBottom(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
