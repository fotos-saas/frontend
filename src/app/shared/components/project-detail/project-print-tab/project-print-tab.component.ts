import { Component, ChangeDetectionStrategy, input, output, effect, inject, ElementRef, viewChild, signal, computed, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, filter, switchMap } from 'rxjs';
import { ProjectDetailData } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';
import { formatFileSize } from '@shared/utils/formatters.util';
import { PartnerProjectService } from '@features/partner/services/partner-project.service';
import { PrintShopMessage } from '@core/models/print-order.models';
import { PrintMessagesComponent } from '@shared/components/print-messages/print-messages.component';
import { DeadlineModificationBannerComponent } from '@features/partner/components/deadline-modification-banner/deadline-modification-banner.component';
import { WebsocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';
import {
  ProjectPrintTabStateService,
  PrintFileType,
  PrintFileUploadEvent,
  PrintFileDeleteEvent,
  PrintFileDownloadEvent,
} from './project-print-tab-state.service';

export { PrintFileType, PrintFileUploadEvent, PrintFileDeleteEvent, PrintFileDownloadEvent };

@Component({
  selector: 'app-project-print-tab',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, MatTooltipModule, PrintMessagesComponent, DeadlineModificationBannerComponent, RouterLink],
  providers: [ProjectPrintTabStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-print-tab.component.html',
  styleUrl: './project-print-tab.component.scss',
})
export class ProjectPrintTabComponent {
  readonly ICONS = ICONS;
  readonly state = inject(ProjectPrintTabStateService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly wsService = inject(WebsocketService);
  readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  readonly project = input<ProjectDetailData | null>(null);
  readonly downloadingType = input<'small_tablo' | 'flat' | null>(null);
  readonly downloadClick = output<PrintFileDownloadEvent>();
  readonly urgentChanged = output<boolean>();
  readonly orderUpdated = output<void>();
  readonly uploadFile = output<PrintFileUploadEvent>();
  readonly deleteClick = output<PrintFileDeleteEvent>();

  readonly smallTabloInput = viewChild<ElementRef<HTMLInputElement>>('smallTabloInputRef');
  readonly flatInput = viewChild<ElementRef<HTMLInputElement>>('flatInputRef');

  /** Nyomda üzenetek */
  readonly messages = signal<PrintShopMessage[]>([]);
  readonly loadingMessages = signal(false);
  readonly sendingMessage = signal(false);
  readonly showChat = signal(false);

  readonly acknowledgingError = signal(false);
  readonly sendingCorrection = signal(false);
  readonly errorAcknowledged = output<void>();
  readonly correctionSent = output<void>();
  readonly togglingUrgent = signal(false);
  readonly urgentState = signal<boolean | null>(null);
  readonly isUrgent = computed(() => this.urgentState() ?? this.project()?.isUrgent ?? false);

  // Megrendelés szerkesztés
  readonly editingOrder = signal(false);
  readonly editCopiesValue = signal(1);
  readonly editDeadlineValue = signal('');
  readonly savingOrder = signal(false);
  readonly copiesOverride = signal<number | null>(null);
  readonly deadlineOverride = signal<string | null | undefined>(undefined);
  readonly copiesDisplay = computed(() => this.copiesOverride() ?? this.project()?.printCopies ?? 1);
  readonly deadlineDisplay = computed(() => {
    const ov = this.deadlineOverride();
    return ov !== undefined ? ov : (this.project()?.printDeadline ?? null);
  });
  readonly today = new Date().toISOString().split('T')[0];

  /** WebSocket csatorna neve (ha aktív) */
  private wsChannelName: string | null = null;

  constructor() {
    effect(() => {
      const p = this.project();
      this.state.updateMimeTypes(
        p?.printSmallTablo?.mimeType,
        p?.printFlat?.mimeType,
      );
    });

    effect(() => {
      const p = this.project();
      if (p?.id && (p.status === 'in_print' || p.status === 'done')) {
        this.loadMessages(p.id);
      }
    });

    // WebSocket listener az új üzenetekért (polling helyett)
    effect(() => {
      const p = this.project();
      const userId = this.authService.currentUserSignal()?.id;
      if (p?.id && (p.status === 'in_print' || p.status === 'done') && userId) {
        this.setupWebSocketListener(userId, p.id);
      }
    });

    // Fallback polling: 30s-ként frissíti az üzeneteket (ha WS nem él)
    interval(30_000).pipe(
      filter(() => this.showChat() && !!this.project()?.id),
      switchMap(() => this.projectService.getPrintMessages(this.project()!.id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(msgs => this.messages.set(msgs));

    this.destroyRef.onDestroy(() => {
      this.wsChannelName = null;
    });
  }

  /**
   * WebSocket feliratkozás a nyomdai üzenetek csatornájára.
   * A notification service MÁR feliratkozott erre a csatornára,
   * csak egy extra listener-t adunk hozzá — ez additive, nem írja felül a meglévőt.
   */
  private setupWebSocketListener(userId: number, projectId: number): void {
    const channelName = `App.Models.User.${userId}`;

    // Ha már feliratkoztunk, ne csináljuk újra
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
      // Csak ha ez a projekt üzenete
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

      this.logger.info('[PrintTab] WebSocket: új nyomdai üzenet érkezett', data);
      this.messages.update(list => [...list, newMsg]);
    });

    this.logger.info(`[PrintTab] WebSocket feliratkozva: ${channelName}`);
  }

  loadMessages(projectId: number): void {
    this.loadingMessages.set(true);
    this.projectService.getPrintMessages(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: msgs => {
          this.messages.set(msgs);
          this.loadingMessages.set(false);
          this.showChat.set(true);
        },
        error: () => this.loadingMessages.set(false),
      });
  }

  onAcknowledgeError(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.acknowledgingError.set(true);
    this.projectService.acknowledgePrintError(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.acknowledgingError.set(false); this.errorAcknowledged.emit(); },
        error: () => this.acknowledgingError.set(false),
      });
  }

  onSendCorrection(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.sendingCorrection.set(true);
    this.projectService.sendCorrection(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.sendingCorrection.set(false); this.correctionSent.emit(); },
        error: () => this.sendingCorrection.set(false),
      });
  }

  toggleUrgent(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.togglingUrgent.set(true);
    this.projectService.toggleUrgent(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.urgentState.set(res.is_urgent); this.urgentChanged.emit(res.is_urgent); this.togglingUrgent.set(false); },
        error: () => this.togglingUrgent.set(false),
      });
  }

  startEditOrder(): void {
    this.editCopiesValue.set(this.copiesDisplay());
    this.editDeadlineValue.set(this.project()?.printDeadline?.split('T')[0] ?? '');
    this.editingOrder.set(true);
  }

  saveOrder(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.savingOrder.set(true);
    const copies = Math.max(1, this.editCopiesValue());
    const deadline = this.editDeadlineValue() || null;
    this.copiesOverride.set(copies);
    this.deadlineOverride.set(deadline);
    this.projectService.updatePrintOrder(id, { print_copies: copies, print_deadline: deadline })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.editingOrder.set(false); this.savingOrder.set(false); this.orderUpdated.emit(); },
        error: () => { this.copiesOverride.set(null); this.deadlineOverride.set(undefined); this.savingOrder.set(false); },
      });
  }

  onSendMessage(text: string): void {
    const id = this.project()?.id;
    if (!id) return;
    this.sendingMessage.set(true);
    this.projectService.sendPrintMessage(id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: msg => {
          this.messages.update(list => [...list, msg]);
          this.sendingMessage.set(false);
        },
        error: () => this.sendingMessage.set(false),
      });
  }

  onAcceptDeadlineModification(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.projectService.respondToDeadlineModification(id, 'accept')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadMessages(id) });
  }

  onRejectDeadlineModification(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.projectService.respondToDeadlineModification(id, 'reject')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadMessages(id) });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  onDragOver(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.setDragging(type, true);
  }

  onDragLeave(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.setDragging(type, false);
  }

  onDrop(event: DragEvent, type: PrintFileType): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.resetDragging();
    const file = event.dataTransfer?.files?.[0];
    if (file && this.state.processFile(file)) {
      this.uploadFile.emit({ file, type });
    }
  }

  onFileSelected(event: Event, type: PrintFileType): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.state.processFile(file)) {
      this.uploadFile.emit({ file, type });
    }
    input.value = '';
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
