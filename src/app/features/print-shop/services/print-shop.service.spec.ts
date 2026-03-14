import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PrintShopService } from './print-shop.service';
import type {
  PrintShopStats,
  PrintShopProject,
  PrintShopProjectDetail,
  PrintShopConnectionRequests,
} from '../models/print-shop.models';

describe('PrintShopService', () => {
  let service: PrintShopService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PrintShopService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getStats
  // ============================================================================
  describe('getStats', () => {
    it('should GET /print-shop/stats and unwrap data', () => {
      const mockStats: PrintShopStats = {
        partner_name: 'Teszt Nyomda',
        stats: {
          in_print: 5,
          done_this_month: 12,
          connected_studios: 3,
          pending_requests: 1,
        },
        connected_studios: [{ id: 1, name: 'Studio A' }],
      };

      service.getStats().subscribe(result => {
        expect(result.partner_name).toBe('Teszt Nyomda');
        expect(result.stats.in_print).toBe(5);
        expect(result.connected_studios).toHaveLength(1);
      });

      const req = httpMock.expectOne('/api/print-shop/stats');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockStats });
    });
  });

  // ============================================================================
  // getProjects
  // ============================================================================
  describe('getProjects', () => {
    it('should GET /print-shop/projects with all params', () => {
      service.getProjects({
        page: 2,
        per_page: 10,
        status: 'in_print',
        search: 'Teszt',
        studio_id: 5,
        class_year: '2026',
      }).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/print-shop/projects');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('per_page')).toBe('10');
      expect(req.request.params.get('status')).toBe('in_print');
      expect(req.request.params.get('search')).toBe('Teszt');
      expect(req.request.params.get('studio_id')).toBe('5');
      expect(req.request.params.get('class_year')).toBe('2026');
      req.flush({ data: [], current_page: 2, last_page: 5, per_page: 10, total: 50 });
    });

    it('should skip falsy params', () => {
      service.getProjects({}).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/print-shop/projects');
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush({ data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });

    it('should return paginated response directly', () => {
      const mockProject: PrintShopProject = {
        id: 1,
        name: 'Projekt A',
        schoolName: 'Iskola',
        className: '12.B',
        classYear: '2026',
        status: 'in_print',
        tabloSize: 'A1',
        studioName: 'Studio',
        studioId: 10,
        inPrintAt: '2026-03-01',
        doneAt: null,
        hasPrintFile: true,
        printFileType: 'pdf',
        hasSample: false,
        thumbnailUrl: null,
        previewUrl: null,
      };

      service.getProjects({ page: 1 }).subscribe(result => {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Projekt A');
        expect(result.total).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === '/api/print-shop/projects');
      req.flush({ data: [mockProject], current_page: 1, last_page: 1, per_page: 15, total: 1 });
    });
  });

  // ============================================================================
  // getProject
  // ============================================================================
  describe('getProject', () => {
    it('should GET /print-shop/projects/:id and unwrap data', () => {
      const mockDetail: PrintShopProjectDetail = {
        id: 42,
        name: 'Teszt Projekt',
        schoolName: 'Iskola',
        className: '12.A',
        classYear: '2026',
        status: 'in_print',
        tabloSize: 'A1',
        studioName: 'Studio',
        studioId: 10,
        inPrintAt: '2026-03-01',
        doneAt: null,
        hasPrintFile: true,
        printFileType: 'pdf',
        hasSample: false,
        thumbnailUrl: null,
        previewUrl: null,
        printFiles: [{ type: 'pdf', fileName: 'tablo.pdf', size: 1024, uploadedAt: '2026-03-01' }],
        contacts: [{ name: 'Kiss Péter', phone: '+36301234567', email: 'peter@test.hu' }],
      };

      service.getProject(42).subscribe(result => {
        expect(result.id).toBe(42);
        expect(result.printFiles).toHaveLength(1);
        expect(result.contacts[0].name).toBe('Kiss Péter');
      });

      const req = httpMock.expectOne('/api/print-shop/projects/42');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockDetail });
    });
  });

  // ============================================================================
  // markAsDone
  // ============================================================================
  describe('markAsDone', () => {
    it('should POST /print-shop/projects/:id/mark-done and unwrap data', () => {
      service.markAsDone(10).subscribe(result => {
        expect(result.status).toBe('done');
      });

      const req = httpMock.expectOne('/api/print-shop/projects/10/mark-done');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ data: { status: 'done' } });
    });
  });

  // ============================================================================
  // revertToPrint
  // ============================================================================
  describe('revertToPrint', () => {
    it('should POST /print-shop/projects/:id/revert-to-print and unwrap data', () => {
      service.revertToPrint(10).subscribe(result => {
        expect(result.status).toBe('in_print');
      });

      const req = httpMock.expectOne('/api/print-shop/projects/10/revert-to-print');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ data: { status: 'in_print' } });
    });
  });

  // ============================================================================
  // getConnectionRequests
  // ============================================================================
  describe('getConnectionRequests', () => {
    it('should GET /print-shop/connection-requests and unwrap data', () => {
      const mockRequests: PrintShopConnectionRequests = {
        incoming: [
          { id: 1, photoStudio: { id: 10, name: 'Studio A', email: null }, initiatedBy: 'photo_studio', createdAt: '2026-03-01' },
        ],
        outgoing: [],
      };

      service.getConnectionRequests().subscribe(result => {
        expect(result.incoming).toHaveLength(1);
        expect(result.outgoing).toHaveLength(0);
        expect(result.incoming[0].photoStudio.name).toBe('Studio A');
      });

      const req = httpMock.expectOne('/api/print-shop/connection-requests');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRequests });
    });
  });

  // ============================================================================
  // approveConnection
  // ============================================================================
  describe('approveConnection', () => {
    it('should POST /print-shop/connections/:id/approve', () => {
      service.approveConnection(5).subscribe(result => {
        expect(result.message).toBe('Jóváhagyva');
      });

      const req = httpMock.expectOne('/api/print-shop/connections/5/approve');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Jóváhagyva' });
    });
  });

  // ============================================================================
  // rejectConnection
  // ============================================================================
  describe('rejectConnection', () => {
    it('should POST /print-shop/connections/:id/reject', () => {
      service.rejectConnection(5).subscribe(result => {
        expect(result.message).toBe('Elutasítva');
      });

      const req = httpMock.expectOne('/api/print-shop/connections/5/reject');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Elutasítva' });
    });
  });

  // ============================================================================
  // removeConnection
  // ============================================================================
  describe('removeConnection', () => {
    it('should DELETE /print-shop/connections/:id', () => {
      service.removeConnection(5).subscribe(result => {
        expect(result.message).toBe('Törölve');
      });

      const req = httpMock.expectOne('/api/print-shop/connections/5');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Törölve' });
    });
  });

  // ============================================================================
  // downloadFile
  // ============================================================================
  describe('downloadFile', () => {
    it('should GET /print-shop/projects/:id/download with type param and return blob + fileName', () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });

      service.downloadFile(10, 'small_tablo').subscribe(result => {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.fileName).toBe('tablo-10.pdf');
      });

      const req = httpMock.expectOne(r =>
        r.url === '/api/print-shop/projects/10/download' && r.params.get('type') === 'small_tablo'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob, {
        headers: { 'Content-Disposition': 'attachment; filename="tablo-10.pdf"' },
      });
    });

    it('should use default type small_tablo', () => {
      service.downloadFile(10).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === '/api/print-shop/projects/10/download' && r.params.get('type') === 'small_tablo'
      );
      req.flush(new Blob(), {
        headers: { 'Content-Disposition': 'attachment; filename="file.pdf"' },
      });
    });

    it('should fallback to download-{id} when no Content-Disposition header', () => {
      service.downloadFile(7, 'big_tablo').subscribe(result => {
        expect(result.fileName).toBe('download-7');
      });

      const req = httpMock.expectOne(r => r.url === '/api/print-shop/projects/7/download');
      req.flush(new Blob());
    });
  });
});
