import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, filter } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopProjectDetail } from '../../models/print-shop.models';
import { PrintShopMessage } from '@core/models/print-order.models';
import { PrintMessagesComponent } from '@shared/components/print-messages/print-messages.component';
import { WebsocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-print-shop-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    FormsModule,
    RouterModule,
    PrintMessagesComponent,
  ],
  templateUrl: './print-shop-project-detail.component.html',
  styleUrl: './print-shop-project-detail.component.scss',
})
export class PrintShopProjectDetailComponent implements OnInit {
  private service = inject(PrintShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  readonly ICONS = ICONS;

  project = signal<PrintShopProjectDetail | null>(null);
  messages = signal<PrintShopMessage[]>([]);
  loading = signal(true);
  loadingMessages = signal(true);
  sendingMessage = signal(false);
  respondingDeadline = signal(false);

  // Határidő módosítás form
  showDeadlineForm = signal(false);
  proposedDate = signal('');
  deadlineMessage = signal('');

  /** WebSocket csatorna neve (ha aktív) */
  private wsChannelName: string | null = null;

  readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(id);
    this.loadMessages(id);

    // WebSocket listener az új üzenetekért (polling helyett)
    const userId = this.authService.currentUserSignal()?.id;
    if (userId) {
      this.setupWebSocketListener(userId, id);
    }

    // Fallback polling: 30s-ként frissíti az üzeneteket (ha WS nem él)
    interval(30_000).pipe(
      filter(() => !!this.project()),
      switchMap(() => this.service.getMessages(id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(msgs => this.messages.set(msgs));

    this.destroyRef.onDestroy(() => {
      this.wsChannelName = null;
    });
  }

  /**
   * WebSocket feliratkozás a nyomdai üzenetek csatornájára.
   */
  private setupWebSocketListener(userId: number, projectId: number): void {
    const channelName = `App.Models.User.${userId}`;

    if (this.wsChannelName === channelName) return;

    this.wsChannelName = channelName;
    const channel = this.wsService.private(channelName);
    if (!channel) return;

    channel.listen('.print.message.created', (data: {
      projectId: number;
      id: number;
      userId: number;
      userName: string;
      message: string;
      type: string;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }) => {
      if (data.projectId !== projectId) return;

      const currentUserId = this.authService.currentUserSignal()?.id;
      const newMsg: PrintShopMessage = {
        id: data.id,
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        type: data.type as PrintShopMessage['type'],
        metadata: data.metadata,
        createdAt: data.createdAt,
        isOwn: data.userId === currentUserId,
      };

      this.logger.info('[PrintShopDetail] WebSocket: új nyomdai üzenet érkezett', data);
      this.messages.update(list => [...list, newMsg]);
    });

    this.logger.info(`[PrintShopDetail] WebSocket feliratkozva: ${channelName}`);
  }

  private loadProject(id: number): void {
    this.service
      .getProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/print-shop/projects']),
      });
  }

  private loadMessages(id: number): void {
    this.service
      .getMessages(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.loadingMessages.set(false);
        },
      });
  }

  onSendMessage(text: string): void {
    const id = this.project()?.id;
    if (!id) return;
    this.sendingMessage.set(true);
    this.service
      .sendMessage(id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msg) => {
          this.messages.update((list) => [...list, msg]);
          this.sendingMessage.set(false);
        },
        error: () => this.sendingMessage.set(false),
      });
  }

  acceptDeadline(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.respondingDeadline.set(true);
    this.service
      .respondToDeadline(id, { action: 'accept' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.project.update((p) =>
            p ? { ...p, printDeadlineStatus: 'accepted' } : p
          );
          this.respondingDeadline.set(false);
          this.loadMessages(id);
        },
        error: () => this.respondingDeadline.set(false),
      });
  }

  modifyDeadline(): void {
    const id = this.project()?.id;
    if (!id || !this.proposedDate()) return;
    this.respondingDeadline.set(true);
    this.service
      .respondToDeadline(id, {
        action: 'modify',
        proposed_date: this.proposedDate(),
        message: this.deadlineMessage() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.project.update((p) =>
            p
              ? {
                  ...p,
                  printDeadlineStatus: 'modified',
                  printDeadlineProposed: this.proposedDate(),
                }
              : p
          );
          this.showDeadlineForm.set(false);
          this.respondingDeadline.set(false);
          this.loadMessages(id);
        },
        error: () => this.respondingDeadline.set(false),
      });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  goBack(): void {
    this.router.navigate(['/print-shop/projects']);
  }
}
