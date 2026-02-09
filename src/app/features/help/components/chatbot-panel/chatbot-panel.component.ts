import {
  Component, ChangeDetectionStrategy, input, output, signal, computed,
  inject, DestroyRef, ElementRef, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { AuthService } from '@core/services/auth.service';
import { ClipboardService } from '@core/services/clipboard.service';
import { HelpChatService, ChatMessage } from '../../services/help-chat.service';
import { ChatbotMessageComponent } from '../chatbot-message/chatbot-message.component';

interface DisplayMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

@Component({
  selector: 'app-chatbot-panel',
  standalone: true,
  imports: [NgClass, FormsModule, LucideAngularModule, MatTooltipModule, ChatbotMessageComponent],
  templateUrl: './chatbot-panel.component.html',
  styleUrl: './chatbot-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotPanelComponent {
  private chatService = inject(HelpChatService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private clipboardService = inject(ClipboardService);

  readonly ICONS = ICONS;
  readonly isOpen = input(false);
  readonly closePanel = output<void>();

  readonly messagesContainer = viewChild<ElementRef>('messagesContainer');

  private abortChat$ = new Subject<void>();

  readonly messages = signal<DisplayMessage[]>([]);
  readonly inputText = signal('');
  readonly isLoading = signal(false);
  readonly conversationId = signal<number | null>(null);
  readonly currentRoute = signal('');
  readonly errorMessage = signal<string | null>(null);

  readonly hasMessages = computed(() => this.messages().length > 0);

  readonly project = toSignal(this.authService.project$);
  readonly contactDialogOpen = signal(false);
  readonly hasContactInfo = computed(() => !!this.project()?.partnerName);
  readonly backdropHandler = createBackdropHandler(() => this.contactDialogOpen.set(false));

  readonly suggestedQuestions = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return [
        'Hogyan kezelem az előfizetéseket?',
        'Hogyan küldök rendszerértesítést?',
        'Hogyan keresek rá egy partnerre?',
        'Milyen statisztikák érhetők el?',
      ];
    }
    if (this.authService.isPartner()) {
      return [
        'Hogyan tölthetek fel fotókat?',
        'Hogyan oszthatom meg a galériát?',
        'Hogyan állítom be az árakat?',
        'Milyen előfizetési csomagok vannak?',
      ];
    }
    if (this.authService.isMarketer()) {
      return [
        'Hogyan hozok létre új projektet?',
        'Hogyan kezelem a megrendeléseket?',
        'Hogyan érhetem el a statisztikákat?',
        'Hogyan módosítom az ügyféladatokat?',
      ];
    }
    // Diák / vendég (alapértelmezett)
    return [
      'Hogyan választhatok képet?',
      'Hogyan rendelhetek nyomtatást?',
      'Hogyan működik a szavazás?',
      'Hogyan érem el a galériát?',
    ];
  });

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      this.currentRoute.set(event.urlAfterRedirects);
    });
  }

  sendMessage(text?: string): void {
    const message = text ?? this.inputText().trim();
    if (!message || this.isLoading()) return;

    this.inputText.set('');
    this.errorMessage.set(null);

    this.messages.update(msgs => [...msgs, {
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }),
    }]);

    this.scrollToBottom();
    this.isLoading.set(true);

    this.chatService.send(message, this.conversationId() ?? undefined, this.currentRoute())
      .pipe(takeUntil(this.abortChat$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.conversationId.set(res.data.conversation_id);
            this.messages.update(msgs => [...msgs, {
              id: res.data!.assistant_message.id,
              role: 'assistant',
              content: this.renderMarkdown(res.data!.assistant_message.content),
              timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }),
            }]);
            this.scrollToBottom();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errMsg = err?.error?.message || 'Hiba történt, próbáld újra később!';
          this.errorMessage.set(errMsg);
        },
      });
  }

  copyEmail(email: string): void {
    this.clipboardService.copyEmail(email);
  }

  startNewConversation(): void {
    this.abortChat$.next();
    this.messages.set([]);
    this.conversationId.set(null);
    this.isLoading.set(false);
    this.errorMessage.set(null);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.messagesContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  private renderMarkdown(text: string): string {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n- /g, '</p><ul><li>');
    html = html.replace(/\n(\d+)\. /g, '</p><ol><li>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    return html;
  }
}
