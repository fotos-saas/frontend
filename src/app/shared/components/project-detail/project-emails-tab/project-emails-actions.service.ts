import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { PartnerEmailService } from '../../../../features/partner/services/partner-email.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProjectEmailsState } from './project-emails-state';
import { ProjectEmail, ReplyData } from '../../../../features/partner/models/project-email.models';

/**
 * Actions service a projekt email tab-hoz.
 * API hívások + state mutáció.
 */
@Injectable()
export class ProjectEmailsActionsService {
  private emailService = inject(PartnerEmailService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

  init(state: ProjectEmailsState, projectId: number): void {
    // Keresés debounce
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => {
      state.setSearch(query);
      this.loadEmails(state, projectId);
    });
  }

  /**
   * Emailek és statisztikák betöltése.
   */
  loadEmails(state: ProjectEmailsState, projectId: number): void {
    state.loading.set(true);

    const filter = state.filter();
    const params: Record<string, unknown> = {
      page: state.page(),
      perPage: 20,
    };
    if (filter === 'inbound' || filter === 'outbound') {
      params['direction'] = filter;
    }
    if (filter === 'needs_reply') {
      params['needsReply'] = true;
    }
    if (state.search()) {
      params['search'] = state.search();
    }

    this.emailService.getProjectEmails(projectId, params as Parameters<PartnerEmailService['getProjectEmails']>[1])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          state.setEmails(data.items, data.pagination);
        },
        error: () => {
          state.loading.set(false);
          this.toast.error('Hiba', 'Nem sikerült betölteni az emaileket.');
        },
      });
  }

  /**
   * Statisztikák betöltése.
   */
  loadStats(state: ProjectEmailsState, projectId: number): void {
    this.emailService.getStats(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => state.stats.set(stats),
        error: () => {}, // Csendben kezeljük
      });
  }

  /**
   * Keresés indítása (debounced).
   */
  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Email kiválasztása — detail + thread betöltés.
   */
  selectEmail(state: ProjectEmailsState, projectId: number, email: ProjectEmail): void {
    state.loadingDetail.set(true);

    this.emailService.getEmail(projectId, email.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          state.selectEmail(email, detail);
        },
        error: () => {
          state.loadingDetail.set(false);
          this.toast.error('Hiba', 'Nem sikerült betölteni az emailt.');
        },
      });
  }

  /**
   * Válasz küldése.
   */
  sendReply(state: ProjectEmailsState, projectId: number, emailId: number, data: ReplyData): void {
    state.sending.set(true);

    this.emailService.replyToEmail(projectId, emailId, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reply) => {
          state.sending.set(false);
          state.showReply.set(false);
          state.markEmailReplied(emailId);
          state.addReplyToThread(reply);
          this.toast.success('Siker', 'Válasz elküldve.');
          this.loadStats(state, projectId);
        },
        error: () => {
          state.sending.set(false);
          this.toast.error('Hiba', 'Nem sikerült elküldeni a választ.');
        },
      });
  }

  /**
   * Email megválaszoltnak jelölése (kézi).
   */
  markReplied(state: ProjectEmailsState, projectId: number, emailId: number): void {
    this.emailService.markReplied(projectId, emailId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          state.markEmailReplied(emailId);
          this.loadStats(state, projectId);
        },
        error: () => this.toast.error('Hiba', 'Nem sikerült frissíteni.'),
      });
  }

  /**
   * Lapozás.
   */
  goToPage(state: ProjectEmailsState, projectId: number, page: number): void {
    state.page.set(page);
    this.loadEmails(state, projectId);
  }
}
