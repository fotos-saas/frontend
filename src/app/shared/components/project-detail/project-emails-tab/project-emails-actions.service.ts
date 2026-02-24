import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, timer, switchMap } from 'rxjs';
import { PartnerEmailService } from '../../../../features/partner/services/partner-email.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProjectEmailsState } from './project-emails-state';
import { ProjectEmail, ReplyData } from '../../../../features/partner/models/project-email.models';
import { saveFile } from '../../../utils/file.util';

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

  /**
   * Csatolmány letöltése on-demand IMAP-ból.
   */
  downloadAttachment(
    state: ProjectEmailsState,
    projectId: number,
    emailId: number,
    attachmentIndex: number,
    filename: string,
    detailComponent?: { clearDownloading: () => void },
  ): void {
    this.emailService.downloadAttachment(projectId, emailId, attachmentIndex)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          saveFile(blob, filename);
          detailComponent?.clearDownloading();
        },
        error: () => {
          detailComponent?.clearDownloading();
          this.toast.error('Hiba', 'Nem sikerült letölteni a csatolmányt.');
        },
      });
  }

  /**
   * Kézi szinkronizálás indítása.
   */
  triggerSync(state: ProjectEmailsState, projectId: number): void {
    state.syncing.set(true);

    this.emailService.triggerSync(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.status === 'already_running') {
            this.toast.info('Info', 'Szinkronizálás már folyamatban.');
          }
          // Polling: várakozás a befejezésre
          this.pollSyncStatus(state, projectId);
        },
        error: (err) => {
          state.syncing.set(false);
          const msg = err?.error?.message || 'Nem sikerült elindítani a szinkronizálást.';
          this.toast.error('Hiba', msg);
        },
      });
  }

  /**
   * Szinkron állapot polling (max 60s).
   */
  private pollSyncStatus(state: ProjectEmailsState, projectId: number, attempt = 0): void {
    if (attempt > 20) {
      // Max ~60s (20 * 3s)
      state.syncing.set(false);
      this.loadEmails(state, projectId);
      this.loadStats(state, projectId);
      return;
    }

    timer(3000).pipe(
      switchMap(() => this.emailService.getSyncStatus(projectId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (status) => {
        if (status.running) {
          this.pollSyncStatus(state, projectId, attempt + 1);
        } else {
          state.syncing.set(false);
          this.loadEmails(state, projectId);
          this.loadStats(state, projectId);
          this.toast.success('Siker', 'Email szinkronizálás kész.');
        }
      },
      error: () => {
        state.syncing.set(false);
        this.loadEmails(state, projectId);
        this.loadStats(state, projectId);
      },
    });
  }
}
