import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClientAlbumService } from './client-album.service';
import { ClientAuthService } from './client-auth.service';

describe('ClientAlbumService', () => {
  let service: ClientAlbumService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientAlbumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAlbums should GET', () => {
    service.getAlbums().subscribe();
    const req = httpMock.expectOne('/api/client/albums');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('getAlbum should GET by id', () => {
    service.getAlbum(5).subscribe();
    const req = httpMock.expectOne('/api/client/albums/5');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('hasDownloadableAlbum should default to false', () => {
    expect(service.hasDownloadableAlbum()).toBe(false);
  });
});
