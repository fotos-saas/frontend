import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TeamService } from './team.service';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTeam should GET', () => {
    service.getTeam().subscribe();
    const req = httpMock.expectOne('/api/partner/team');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createInvitation should POST', () => {
    service.createInvitation({ email: 'test@test.com', role: 'editor' } as any).subscribe();
    const req = httpMock.expectOne('/api/partner/invitations');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK', invitation: {} });
  });

  it('revokeInvitation should DELETE', () => {
    service.revokeInvitation(5).subscribe();
    const req = httpMock.expectOne('/api/partner/invitations/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'OK' });
  });

  it('resendInvitation should POST', () => {
    service.resendInvitation(5).subscribe();
    const req = httpMock.expectOne('/api/partner/invitations/5/resend');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'OK' });
  });

  it('removeTeamMember should DELETE', () => {
    service.removeTeamMember(5).subscribe();
    const req = httpMock.expectOne('/api/partner/team/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'OK' });
  });

  it('roles should have predefined roles', () => {
    expect(service.roles.length).toBeGreaterThan(0);
  });
});
