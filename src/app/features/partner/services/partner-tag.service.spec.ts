import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerTagService } from './partner-tag.service';

describe('PartnerTagService', () => {
  let service: PartnerTagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerTagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTags should GET', () => {
    service.getTags().subscribe();
    const req = httpMock.expectOne('/api/partner/tags');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('createTag should POST', () => {
    service.createTag({ name: 'VIP', color: '#ff0000' }).subscribe();
    const req = httpMock.expectOne('/api/partner/tags');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('VIP');
    req.flush({ data: {} });
  });

  it('updateTag should PUT', () => {
    service.updateTag(5, { name: 'Updated', color: '#00ff00' }).subscribe();
    const req = httpMock.expectOne('/api/partner/tags/5');
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('deleteTag should DELETE', () => {
    service.deleteTag(5).subscribe();
    const req = httpMock.expectOne('/api/partner/tags/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('syncProjectTags should POST', () => {
    service.syncProjectTags(1, [1, 2, 3]).subscribe();
    const req = httpMock.expectOne('/api/partner/projects/1/tags/sync');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tag_ids).toEqual([1, 2, 3]);
    req.flush({ data: [] });
  });
});
