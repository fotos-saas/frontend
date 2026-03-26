import { Component, ChangeDetectionStrategy, input, output, effect, inject, ElementRef, viewChild, signal, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectDetailData } from '../project-detail.types';
import { ICONS } from '../../../constants/icons.constants';
import { formatFileSize } from '@shared/utils/formatters.util';
import { PartnerProjectService } from '@features/partner/services/partner-project.service';
import { PrintShopMessage } from '@core/models/print-order.models';
import { PrintMessagesComponent } from '@shared/components/print-messages/print-messages.component';
import { DeadlineModificationBannerComponent } from '@features/partner/components/deadline-modification-banner/deadline-modification-banner.component';
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
  imports: [LucideAngularModule, DatePipe, MatTooltipModule, PrintMessagesComponent, DeadlineModificationBannerComponent],
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

  readonly project = input<ProjectDetailData | null>(null);
  readonly downloadingType = input<'small_tablo' | 'flat' | null>(null);
  readonly downloadClick = output<PrintFileDownloadEvent>();
  readonly uploadFile = output<PrintFileUploadEvent>();
  readonly deleteClick = output<PrintFileDeleteEvent>();

  readonly smallTabloInput = viewChild<ElementRef<HTMLInputElement>>('smallTabloInputRef');
  readonly flatInput = viewChild<ElementRef<HTMLInputElement>>('flatInputRef');

  /** Nyomda üzenetek */
  readonly messages = signal<PrintShopMessage[]>([]);
  readonly loadingMessages = signal(false);
  readonly sendingMessage = signal(false);
  readonly showChat = signal(false);

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
      if (p?.id && p.status === 'in_print') {
        this.loadMessages(p.id);
      }
    });
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
