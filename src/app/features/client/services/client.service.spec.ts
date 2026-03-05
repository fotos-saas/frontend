import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ClientService } from './client.service';
import { ClientAuthService } from './client-auth.service';
import { ClientAlbumService } from './client-album.service';
import { ClientHelperService } from './client-helper.service';

describe('ClientService (Facade)', () => {
  let service: ClientService;
  let authService: ClientAuthService;
  let albumService: ClientAlbumService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientService);
    authService = TestBed.inject(ClientAuthService);
    albumService = TestBed.inject(ClientAlbumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAlbums delegates to albumService', () => {
    const spy = vi.spyOn(albumService, 'getAlbums').mockReturnValue(of({ success: true, data: [] }));
    service.getAlbums().subscribe();
    expect(spy).toHaveBeenCalled();
  });

  it('getToken delegates to authService', () => {
    const spy = vi.spyOn(authService, 'getToken').mockReturnValue('token123');
    const result = service.getToken();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe('token123');
  });

  it('getStatusLabel returns label', () => {
    expect(service.getStatusLabel('draft')).toBeTruthy();
  });
});
