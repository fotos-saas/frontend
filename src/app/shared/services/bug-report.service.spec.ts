import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BugReportService } from './bug-report.service';
import type {
  BugReport,
  CreateBugReportDto,
  AddBugReportCommentDto,
  UpdateBugReportStatusDto,
  BugReportComment,
} from '../types/bug-report.types';
import type { PaginatedResponse } from '../../core/models/api.models';

describe('BugReportService', () => {
  let service: BugReportService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BugReportService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BugReportService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('unreadCount alapértelmezetten 0', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('hasUnread alapértelmezetten false', () => {
      expect(service.hasUnread()).toBe(false);
    });
  });

  // ============================================================================
  // list
  // ============================================================================
  describe('list', () => {
    it('GET kérést küld a helyes URL-re prefix-szel', () => {
      const mockResponse: PaginatedResponse<BugReport> = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      };

      service.list('partner').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne('/api/partner/bug-reports');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('query paramétereket hozzáfűzi', () => {
      service.list('partner', { status: 'new', page: '2' }).subscribe();

      const req = httpTesting.expectOne('/api/partner/bug-reports?status=new&page=2');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 2, last_page: 1, per_page: 15, total: 0 });
    });

    it('üres prefix esetén nem ad dupla perjelet', () => {
      service.list('').subscribe();

      const req = httpTesting.expectOne('/api/bug-reports');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });

    it('üres params esetén nem ad kérdőjelet', () => {
      service.list('partner', {}).subscribe();

      const req = httpTesting.expectOne('/api/partner/bug-reports');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });
  });

  // ============================================================================
  // get
  // ============================================================================
  describe('get', () => {
    it('GET kérést küld a helyes URL-re', () => {
      const mockReport = { id: 42, title: 'Teszt hiba' } as BugReport;

      service.get('partner', 42).subscribe(res => {
        expect(res).toEqual(mockReport);
      });

      const req = httpTesting.expectOne('/api/partner/bug-reports/42');
      expect(req.request.method).toBe('GET');
      req.flush(mockReport);
    });

    it('üres prefix-szel is működik', () => {
      service.get('', 10).subscribe();

      const req = httpTesting.expectOne('/api/bug-reports/10');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 10 });
    });
  });

  // ============================================================================
  // create
  // ============================================================================
  describe('create', () => {
    const dto: CreateBugReportDto = {
      title: 'Teszt hiba',
      description: 'Leírás',
      priority: 'high',
    };

    it('POST kérést küld FormData-val', () => {
      service.create('partner', dto).subscribe(res => {
        expect(res.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/partner/bug-reports');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;
      expect(formData.get('title')).toBe('Teszt hiba');
      expect(formData.get('description')).toBe('Leírás');
      expect(formData.get('priority')).toBe('high');

      req.flush({ message: 'Létrehozva', id: 1 });
    });

    it('csatolmányokat is hozzáadja a FormData-hoz', () => {
      const file1 = new File(['content1'], 'screenshot1.png', { type: 'image/png' });
      const file2 = new File(['content2'], 'screenshot2.png', { type: 'image/png' });

      service.create('partner', dto, [file1, file2]).subscribe();

      const req = httpTesting.expectOne('/api/partner/bug-reports');
      const formData = req.request.body as FormData;
      expect(formData.get('attachments[0]')).toBeInstanceOf(File);
      expect(formData.get('attachments[1]')).toBeInstanceOf(File);

      req.flush({ message: 'OK', id: 2 });
    });

    it('üres csatolmány tömb esetén nem ad attachments mezőt', () => {
      service.create('partner', dto, []).subscribe();

      const req = httpTesting.expectOne('/api/partner/bug-reports');
      const formData = req.request.body as FormData;
      expect(formData.get('attachments[0]')).toBeNull();

      req.flush({ message: 'OK', id: 3 });
    });
  });

  // ============================================================================
  // addComment
  // ============================================================================
  describe('addComment', () => {
    it('POST kérést küld a helyes URL-re', () => {
      const dto: AddBugReportCommentDto = { content: 'Teszt komment' };
      const mockComment = { id: 1, content: 'Teszt komment', author: { id: 1, name: 'User' }, created_at: '2026-03-12' } as BugReportComment;

      service.addComment('partner', 5, dto).subscribe(res => {
        expect(res.comment).toEqual(mockComment);
      });

      const req = httpTesting.expectOne('/api/partner/bug-reports/5/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ message: 'OK', comment: mockComment });
    });
  });

  // ============================================================================
  // listAdmin
  // ============================================================================
  describe('listAdmin', () => {
    it('GET kérést küld super-admin URL-re', () => {
      service.listAdmin().subscribe();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });

    it('query paramétereket hozzáfűzi', () => {
      service.listAdmin({ status: 'in_progress' }).subscribe();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports?status=in_progress');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });
  });

  // ============================================================================
  // getAdmin
  // ============================================================================
  describe('getAdmin', () => {
    it('GET kérést küld a helyes admin URL-re', () => {
      service.getAdmin(7).subscribe();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/7');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 7 });
    });
  });

  // ============================================================================
  // updateStatus
  // ============================================================================
  describe('updateStatus', () => {
    it('PATCH kérést küld státusz frissítéshez', () => {
      const dto: UpdateBugReportStatusDto = { status: 'resolved', note: 'Javítva' };

      service.updateStatus(3, dto).subscribe(res => {
        expect(res.status).toBe('resolved');
      });

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/3/status');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ message: 'OK', status: 'resolved', status_label: 'Megoldva' });
    });
  });

  // ============================================================================
  // updatePriority
  // ============================================================================
  describe('updatePriority', () => {
    it('PATCH kérést küld prioritás frissítéshez', () => {
      service.updatePriority(3, 'critical').subscribe(res => {
        expect(res.priority).toBe('critical');
      });

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/3/priority');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ priority: 'critical' });
      req.flush({ message: 'OK', priority: 'critical', priority_label: 'Kritikus' });
    });
  });

  // ============================================================================
  // addCommentAdmin
  // ============================================================================
  describe('addCommentAdmin', () => {
    it('POST kérést küld az admin comment URL-re', () => {
      const dto: AddBugReportCommentDto = { content: 'Admin válasz', is_internal: true };

      service.addCommentAdmin(8, dto).subscribe();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/8/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ message: 'OK', comment: { id: 2, content: 'Admin válasz' } });
    });
  });

  // ============================================================================
  // fetchUnreadCount
  // ============================================================================
  describe('fetchUnreadCount', () => {
    it('GET kérést küld és frissíti az unreadCount signal-t', () => {
      service.fetchUnreadCount();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/unread-count');
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });

      expect(service.unreadCount()).toBe(5);
      expect(service.hasUnread()).toBe(true);
    });

    it('0 count esetén hasUnread false', () => {
      service.fetchUnreadCount();

      const req = httpTesting.expectOne('/api/super-admin/bug-reports/unread-count');
      req.flush({ count: 0 });

      expect(service.unreadCount()).toBe(0);
      expect(service.hasUnread()).toBe(false);
    });

    it('többszöri hívás felülírja az előző értéket', () => {
      service.fetchUnreadCount();
      httpTesting.expectOne('/api/super-admin/bug-reports/unread-count').flush({ count: 3 });

      service.fetchUnreadCount();
      httpTesting.expectOne('/api/super-admin/bug-reports/unread-count').flush({ count: 7 });

      expect(service.unreadCount()).toBe(7);
    });
  });

  // ============================================================================
  // hasUnread computed
  // ============================================================================
  describe('hasUnread computed', () => {
    it('true ha unreadCount > 0', () => {
      service.fetchUnreadCount();
      httpTesting.expectOne('/api/super-admin/bug-reports/unread-count').flush({ count: 1 });

      expect(service.hasUnread()).toBe(true);
    });

    it('false ha unreadCount === 0', () => {
      expect(service.hasUnread()).toBe(false);
    });
  });
});
