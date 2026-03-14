import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProjectEmailsActionsService } from './project-emails-actions.service';
import { PartnerEmailService } from '../../../../features/partner/services/partner-email.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProjectEmailsState } from './project-emails-state';
import type { ProjectEmail, EmailDetailResponse, ReplyData } from '../../../../features/partner/models/project-email.models';

vi.mock('../../../utils/file.util', () => ({
  saveFile: vi.fn(),
}));

describe('ProjectEmailsActionsService', () => {
  let service: ProjectEmailsActionsService;
  let emailService: {
    getProjectEmails: ReturnType<typeof vi.fn>;
    getStats: ReturnType<typeof vi.fn>;
    getEmail: ReturnType<typeof vi.fn>;
    replyToEmail: ReturnType<typeof vi.fn>;
    markReplied: ReturnType<typeof vi.fn>;
    downloadAttachment: ReturnType<typeof vi.fn>;
    triggerSync: ReturnType<typeof vi.fn>;
    getSyncStatus: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let state: ProjectEmailsState;
  const projectId = 42;

  const mockEmail: ProjectEmail = {
    id: 1,
    messageId: '<msg1@test.com>',
    threadId: null,
    fromEmail: 'sender@test.com',
    fromName: 'Sender',
    toEmail: 'to@test.com',
    toName: 'To',
    cc: [],
    subject: 'Teszt email',
    bodyPreview: 'Teszt preview',
    direction: 'inbound',
    isRead: false,
    needsReply: true,
    isReplied: false,
    hasAttachments: false,
    attachmentCount: 0,
    attachments: [],
    emailDate: '2026-01-01',
  };

  beforeEach(() => {
    emailService = {
      getProjectEmails: vi.fn(),
      getStats: vi.fn(),
      getEmail: vi.fn(),
      replyToEmail: vi.fn(),
      markReplied: vi.fn(),
      downloadAttachment: vi.fn(),
      triggerSync: vi.fn(),
      getSyncStatus: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    state = new ProjectEmailsState();

    TestBed.configureTestingModule({
      providers: [
        ProjectEmailsActionsService,
        { provide: PartnerEmailService, useValue: emailService },
        { provide: ToastService, useValue: toast },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(ProjectEmailsActionsService);
  });

  // ============================================================================
  // loadEmails()
  // ============================================================================
  describe('loadEmails()', () => {
    it('betolti az emaileket es frissiti a state-et', () => {
      const response = {
        items: [mockEmail],
        pagination: { currentPage: 1, lastPage: 3, total: 50 },
      };
      emailService.getProjectEmails.mockReturnValue(of(response));

      service.loadEmails(state, projectId);

      expect(state.emails()).toEqual([mockEmail]);
      expect(state.page()).toBe(1);
      expect(state.lastPage()).toBe(3);
      expect(state.total()).toBe(50);
      expect(state.loading()).toBe(false);
    });

    it('filter "inbound" eseten direction parametert kuld', () => {
      state.setFilter('inbound');
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } }),
      );

      service.loadEmails(state, projectId);

      expect(emailService.getProjectEmails).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ direction: 'inbound' }),
      );
    });

    it('filter "needs_reply" eseten needsReply parametert kuld', () => {
      state.setFilter('needs_reply');
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } }),
      );

      service.loadEmails(state, projectId);

      expect(emailService.getProjectEmails).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ needsReply: true }),
      );
    });

    it('search parametert kuld ha van kereses', () => {
      state.setSearch('teszt');
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } }),
      );

      service.loadEmails(state, projectId);

      expect(emailService.getProjectEmails).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ search: 'teszt' }),
      );
    });

    it('hiba eseten loading false es toast error', () => {
      emailService.getProjectEmails.mockReturnValue(throwError(() => new Error('fail')));

      service.loadEmails(state, projectId);

      expect(state.loading()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült betölteni az emaileket.');
    });
  });

  // ============================================================================
  // loadStats()
  // ============================================================================
  describe('loadStats()', () => {
    it('betolti a statisztikakat', () => {
      const stats = { total: 100, unread: 5, needsReply: 3, inbound: 60, outbound: 40 };
      emailService.getStats.mockReturnValue(of(stats));

      service.loadStats(state, projectId);

      expect(state.stats()).toEqual(stats);
    });

    it('hiba eseten csendben kezeli', () => {
      emailService.getStats.mockReturnValue(throwError(() => new Error('fail')));

      // Nem dob hibat
      expect(() => service.loadStats(state, projectId)).not.toThrow();
    });
  });

  // ============================================================================
  // onSearch()
  // ============================================================================
  describe('onSearch()', () => {
    it('a searchSubject next-et hivja', () => {
      const nextSpy = vi.spyOn((service as any).searchSubject, 'next');
      service.onSearch('teszt');
      expect(nextSpy).toHaveBeenCalledWith('teszt');
    });
  });

  // ============================================================================
  // selectEmail()
  // ============================================================================
  describe('selectEmail()', () => {
    it('betolti az email reszleteit', () => {
      const detail: EmailDetailResponse = {
        email: { ...mockEmail, bodyHtml: '<p>Tartalom</p>' },
        thread: [mockEmail],
      };
      emailService.getEmail.mockReturnValue(of(detail));

      service.selectEmail(state, projectId, mockEmail);

      expect(emailService.getEmail).toHaveBeenCalledWith(projectId, 1);
      expect(state.selectedEmail()).toEqual(detail.email);
      expect(state.thread()).toEqual(detail.thread);
      expect(state.loadingDetail()).toBe(false);
    });

    it('hiba eseten loadingDetail false es toast error', () => {
      emailService.getEmail.mockReturnValue(throwError(() => new Error('fail')));

      service.selectEmail(state, projectId, mockEmail);

      expect(state.loadingDetail()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült betölteni az emailt.');
    });
  });

  // ============================================================================
  // sendReply()
  // ============================================================================
  describe('sendReply()', () => {
    it('sikeres valasz kuldes', () => {
      const reply: ProjectEmail = { ...mockEmail, id: 2, direction: 'outbound' };
      emailService.replyToEmail.mockReturnValue(of(reply));
      emailService.getStats.mockReturnValue(of({ total: 1, unread: 0, needsReply: 0, inbound: 1, outbound: 0 }));
      state.showReply.set(true);

      service.sendReply(state, projectId, 1, { body: 'Valasz' });

      expect(state.sending()).toBe(false);
      expect(state.showReply()).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Siker', 'Válasz elküldve.');
    });

    it('hiba eseten sending false es toast error', () => {
      emailService.replyToEmail.mockReturnValue(throwError(() => new Error('fail')));

      service.sendReply(state, projectId, 1, { body: 'Valasz' });

      expect(state.sending()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült elküldeni a választ.');
    });
  });

  // ============================================================================
  // markReplied()
  // ============================================================================
  describe('markReplied()', () => {
    it('megjeloli megvalaszoltnak es frissiti a statokat', () => {
      state.emails.set([mockEmail]);
      emailService.markReplied.mockReturnValue(of({}));
      emailService.getStats.mockReturnValue(of({ total: 1, unread: 0, needsReply: 0, inbound: 1, outbound: 0 }));

      service.markReplied(state, projectId, 1);

      expect(emailService.markReplied).toHaveBeenCalledWith(projectId, 1);
    });

    it('hiba eseten toast error', () => {
      emailService.markReplied.mockReturnValue(throwError(() => new Error('fail')));

      service.markReplied(state, projectId, 1);

      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült frissíteni.');
    });
  });

  // ============================================================================
  // goToPage()
  // ============================================================================
  describe('goToPage()', () => {
    it('beallitja az oldalt es ujratolt', () => {
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 2, lastPage: 3, total: 50 } }),
      );

      service.goToPage(state, projectId, 2);

      expect(state.page()).toBe(2);
      expect(emailService.getProjectEmails).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // downloadAttachment()
  // ============================================================================
  describe('downloadAttachment()', () => {
    it('letolti a csatolmanyt sikeresen', () => {
      const blob = new Blob(['test']);
      emailService.downloadAttachment.mockReturnValue(of(blob));
      const component = { clearDownloading: vi.fn() };

      service.downloadAttachment(state, projectId, 1, 0, 'test.pdf', component);

      expect(emailService.downloadAttachment).toHaveBeenCalledWith(projectId, 1, 0);
      expect(component.clearDownloading).toHaveBeenCalled();
    });

    it('hiba eseten clearDownloading es toast error', () => {
      emailService.downloadAttachment.mockReturnValue(throwError(() => new Error('fail')));
      const component = { clearDownloading: vi.fn() };

      service.downloadAttachment(state, projectId, 1, 0, 'test.pdf', component);

      expect(component.clearDownloading).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült letölteni a csatolmányt.');
    });
  });

  // ============================================================================
  // triggerSync()
  // ============================================================================
  describe('triggerSync()', () => {
    it('elinditja a szinkronizalast', () => {
      emailService.triggerSync.mockReturnValue(of({ status: 'started' }));
      emailService.getSyncStatus.mockReturnValue(of({ running: false }));
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } }),
      );
      emailService.getStats.mockReturnValue(of({ total: 0, unread: 0, needsReply: 0, inbound: 0, outbound: 0 }));

      service.triggerSync(state, projectId);

      expect(state.syncing()).toBe(true);
      expect(emailService.triggerSync).toHaveBeenCalledWith(projectId);
    });

    it('already_running eseten toast info', () => {
      emailService.triggerSync.mockReturnValue(of({ status: 'already_running' }));
      emailService.getSyncStatus.mockReturnValue(of({ running: false }));
      emailService.getProjectEmails.mockReturnValue(
        of({ items: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } }),
      );
      emailService.getStats.mockReturnValue(of({ total: 0, unread: 0, needsReply: 0, inbound: 0, outbound: 0 }));

      service.triggerSync(state, projectId);

      expect(toast.info).toHaveBeenCalledWith('Info', 'Szinkronizálás már folyamatban.');
    });

    it('hiba eseten syncing false es toast error', () => {
      emailService.triggerSync.mockReturnValue(throwError(() => ({
        error: { message: 'IMAP hiba' },
      })));

      service.triggerSync(state, projectId);

      expect(state.syncing()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'IMAP hiba');
    });

    it('hiba eseten default hibauzenet ha nincs error message', () => {
      emailService.triggerSync.mockReturnValue(throwError(() => ({})));

      service.triggerSync(state, projectId);

      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült elindítani a szinkronizálást.');
    });
  });
});
