import { signal, computed } from '@angular/core';
import { ProjectEmail, EmailStats, EmailFilter, EmailDetailResponse } from '../../../../features/partner/models/project-email.models';

/**
 * Signal-based state management a projekt email tab-hoz.
 */
export class ProjectEmailsState {
  // === LISTA STATE ===
  readonly loading = signal(true);
  readonly emails = signal<ProjectEmail[]>([]);
  readonly stats = signal<EmailStats | null>(null);
  readonly filter = signal<EmailFilter>('all');
  readonly search = signal('');
  readonly page = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);

  // === DETAIL STATE ===
  readonly selectedEmail = signal<ProjectEmail | null>(null);
  readonly thread = signal<ProjectEmail[]>([]);
  readonly loadingDetail = signal(false);

  // === REPLY STATE ===
  readonly showReply = signal(false);
  readonly sending = signal(false);

  // === COMPUTED ===
  readonly hasEmails = computed(() => this.emails().length > 0);
  readonly unreadCount = computed(() => this.stats()?.unread ?? 0);
  readonly needsReplyCount = computed(() => this.stats()?.needsReply ?? 0);

  readonly filterLabel = computed(() => {
    switch (this.filter()) {
      case 'inbound': return 'Bejövő';
      case 'outbound': return 'Kimenő';
      case 'needs_reply': return 'Válaszra vár';
      default: return 'Összes';
    }
  });

  // === METHODS ===

  setFilter(filter: EmailFilter): void {
    this.filter.set(filter);
    this.page.set(1);
    this.selectedEmail.set(null);
    this.thread.set([]);
    this.showReply.set(false);
  }

  setSearch(query: string): void {
    this.search.set(query);
    this.page.set(1);
  }

  setEmails(emails: ProjectEmail[], pagination: { currentPage: number; lastPage: number; total: number }): void {
    this.emails.set(emails);
    this.page.set(pagination.currentPage);
    this.lastPage.set(pagination.lastPage);
    this.total.set(pagination.total);
    this.loading.set(false);
  }

  selectEmail(email: ProjectEmail, detail: EmailDetailResponse): void {
    this.selectedEmail.set(detail.email);
    this.thread.set(detail.thread);
    this.loadingDetail.set(false);
    this.showReply.set(false);

    // Jelöljük olvasottnak a listában is
    if (!email.isRead) {
      this.emails.update(list =>
        list.map(e => e.id === email.id ? { ...e, isRead: true } : e),
      );
    }
  }

  markEmailReplied(emailId: number): void {
    this.emails.update(list =>
      list.map(e => e.id === emailId ? { ...e, isReplied: true, needsReply: false } : e),
    );
    const selected = this.selectedEmail();
    if (selected?.id === emailId) {
      this.selectedEmail.set({ ...selected, isReplied: true, needsReply: false });
    }
  }

  addReplyToThread(reply: ProjectEmail): void {
    this.thread.update(t => [...t, reply]);
  }

  closeDetail(): void {
    this.selectedEmail.set(null);
    this.thread.set([]);
    this.showReply.set(false);
  }

  reset(): void {
    this.loading.set(true);
    this.emails.set([]);
    this.stats.set(null);
    this.filter.set('all');
    this.search.set('');
    this.page.set(1);
    this.lastPage.set(1);
    this.total.set(0);
    this.selectedEmail.set(null);
    this.thread.set([]);
    this.loadingDetail.set(false);
    this.showReply.set(false);
    this.sending.set(false);
  }
}
