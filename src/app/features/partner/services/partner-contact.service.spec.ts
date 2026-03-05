import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerContactService } from './partner-contact.service';

describe('PartnerContactService', () => {
  let service: PartnerContactService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllContacts should GET', () => {
    service.getAllContacts('test').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/contacts/all');
    expect(req.request.params.get('search')).toBe('test');
    req.flush([]);
  });

  it('addContact should POST', () => {
    service.addContact(1, { name: 'Test' }).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/contacts');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: {} });
  });

  it('deleteContact should DELETE', () => {
    service.deleteContact(1, 5).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/contacts/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('getContacts should GET paginated', () => {
    service.getContacts({ search: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/contacts');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('deleteStandaloneContact should DELETE', () => {
    service.deleteStandaloneContact(5).subscribe();
    const req = httpMock.expectOne('/api/partner/contacts/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'OK' });
  });

  it('exportExcel should GET blob', () => {
    service.exportExcel().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/contacts/export-excel');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('exportVcard should GET blob', () => {
    service.exportVcard().subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/partner/contacts/export-vcard');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('importExcel should POST FormData', () => {
    const file = new File(['x'], 'contacts.xlsx');
    service.importExcel(file).subscribe();
    const req = httpMock.expectOne('/api/partner/contacts/import-excel');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true });
  });
});
