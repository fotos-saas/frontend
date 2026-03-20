import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime } from 'rxjs';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailClientService } from '../../services/email-client.service';
import { PartnerEmailService } from '../../services/partner-email.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  EmailFolder,
  EmailLabel,
  EmailListItem,
  EmailDetail,
  QuickReply,
} from '../../models/email-client.models';
import { EmailSidebarComponent } from './components/email-sidebar.component';
import { EmailListPanelComponent } from './components/email-list-panel.component';
import { EmailReaderPanelComponent } from './components/email-reader-panel.component';

@Component({
  selector: 'app-email-client-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, EmailSidebarComponent, EmailListPanelComponent, EmailReaderPanelComponent],
  templateUrl: './email-client-page.component.html',
  styleUrl: './email-client-page.component.scss',
})
export class EmailClientPageComponent implements OnInit {
  private readonly emailClientService = inject(EmailClientService);
  private readonly partnerEmailService = inject(PartnerEmailService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // Sidebar state
  readonly folders = signal<EmailFolder[]>([]);
  readonly labels = signal<EmailLabel[]>([]);
  readonly activeFolder = signal<string>('INBOX');
  readonly activeLabel = signal<number | null>(null);

  // Lista state
  readonly emails = signal<EmailListItem[]>([]);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly search = signal('');

  // Detail state
  readonly selectedEmail = signal<EmailDetail | null>(null);
  readonly thread = signal<EmailListItem[]>([]);
  readonly quickReplies = signal<QuickReply[]>([]);
  readonly loadingDetail = signal(false);
  readonly loadingQuickReplies = signal(false);
  readonly sendingReply = signal(false);

  // Sidebar megnyitás (tablet)
  readonly sidebarOpen = signal(false);

  // Computed
  readonly hasEmails = computed(() => this.emails().length > 0);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page.set(1);
      this.loadEmails();
    });

    this.loadFolders();
    this.loadLabels();
    this.loadEmails();
  }

  // --- Sidebar events ---

  onFolderSelect(folderPath: string): void {
    this.activeFolder.set(folderPath);
    this.activeLabel.set(null);
    this.page.set(1);
    this.selectedEmail.set(null);
    this.sidebarOpen.set(false);
    this.loadEmails();
  }

  onLabelSelect(labelId: number): void {
    this.activeLabel.set(labelId);
    this.activeFolder.set('');
    this.page.set(1);
    this.selectedEmail.set(null);
    this.sidebarOpen.set(false);
    this.loadEmails();
  }

  onLabelCreated(label: EmailLabel): void {
    this.labels.update(l => [...l, label]);
  }

  onLabelUpdated(label: EmailLabel): void {
    this.labels.update(list => list.map(l => l.id === label.id ? { ...l, ...label } : l));
  }

  onLabelDeleted(labelId: number): void {
    this.labels.update(list => list.filter(l => l.id !== labelId));
    if (this.activeLabel() === labelId) {
      this.activeFolder.set('INBOX');
      this.activeLabel.set(null);
      this.loadEmails();
    }
  }

  // --- Lista events ---

  onSearch(term: string): void {
    this.search.set(term);
    this.searchSubject.next(term);
  }

  onSelectEmail(email: EmailListItem): void {
    this.loadingDetail.set(true);
    this.quickReplies.set([]);

    this.emailClientService.getEmail(email.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.selectedEmail.set(data.email);
        this.thread.set(data.thread);
        this.loadingDetail.set(false);

        // Olvasottnak jelölés a listában
        if (!email.is_read) {
          this.emails.update(list =>
            list.map(e => e.id === email.id ? { ...e, is_read: true } : e)
          );
          this.updateFolderCounts();
        }

        // AI gyorsválasz reset (lazy load — gombra kattintva töltődik)
        this.quickReplies.set([]);
        this.loadingQuickReplies.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült betölteni az emailt.');
        this.loadingDetail.set(false);
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadEmails();
  }

  onToggleStar(email: EmailListItem): void {
    this.emailClientService.toggleStar(email.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.emails.update(list =>
          list.map(e => e.id === email.id ? { ...e, is_starred: data.is_starred } : e)
        );
        if (this.selectedEmail()?.id === email.id) {
          this.selectedEmail.update(e => e ? { ...e, is_starred: data.is_starred } : e);
        }
      },
    });
  }

  // --- Reader events ---

  onCloseDetail(): void {
    this.selectedEmail.set(null);
    this.thread.set([]);
    this.quickReplies.set([]);
  }

  onLabelsChanged(data: { emailId: number; labels: { id: number; name: string; color: string }[] }): void {
    this.emails.update(list =>
      list.map(e => e.id === data.emailId ? { ...e, labels: data.labels } : e)
    );
    if (this.selectedEmail()?.id === data.emailId) {
      this.selectedEmail.update(e => e ? { ...e, labels: data.labels } : e);
    }
  }

  onRequestQuickReplies(): void {
    const email = this.selectedEmail();
    if (email && email.direction === 'inbound') {
      this.loadQuickReplies(email.id);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  onSendReply(data: { emailId: number; body: string }): void {
    const email = this.selectedEmail();
    if (!email?.project?.id) {
      this.toast.error('Hiba', 'Válasz küldéséhez a levélnek projekthez kell tartoznia.');
      return;
    }

    this.sendingReply.set(true);

    this.partnerEmailService.replyToEmail(email.project.id, data.emailId, { body: data.body }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.success('Siker', 'Válasz elküldve');
        this.sendingReply.set(false);
        // Frissítjük a listát is
        this.emails.update(list =>
          list.map(e => e.id === data.emailId ? { ...e, is_replied: true } : e)
        );
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült elküldeni a választ.');
        this.sendingReply.set(false);
      },
    });
  }

  // --- Private ---

  private loadEmails(): void {
    this.loading.set(true);

    this.emailClientService.getEmails({
      folder: this.activeFolder() || undefined,
      label_id: this.activeLabel() || undefined,
      search: this.search() || undefined,
      page: this.page(),
      per_page: 25,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.emails.set(data.items);
        this.lastPage.set(data.pagination.last_page);
        this.total.set(data.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült betölteni az emaileket.');
        this.loading.set(false);
      },
    });
  }

  private loadFolders(): void {
    this.emailClientService.getFolders().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => this.folders.set(data.folders),
      error: () => this.toast.error('Hiba', 'Nem sikerült betölteni a mappákat.'),
    });
  }

  private loadLabels(): void {
    this.emailClientService.getLabels().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => this.labels.set(data.labels),
      error: () => this.toast.error('Hiba', 'Nem sikerült betölteni a címkéket.'),
    });
  }

  private loadQuickReplies(emailId: number): void {
    this.loadingQuickReplies.set(true);

    this.emailClientService.getQuickReplies(emailId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.quickReplies.set(data.replies);
        this.loadingQuickReplies.set(false);
      },
      error: () => {
        this.loadingQuickReplies.set(false);
      },
    });
  }

  private updateFolderCounts(): void {
    this.loadFolders();
  }
}
