import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EmailHubService } from './email-hub.service';
import { environment } from '../../../../environments/environment';

describe('EmailHubService', () => {
  let service: EmailHubService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/partner/email-hub`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmailHubService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EmailHubService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Dashboard ---

  it('should get dashboard and extract data', () => {
    const mockDashboard = {
      pendingDrafts: 5,
      pendingApproval: 2,
      escalationCount: 1,
      activeRounds: 3,
      todayProcessed: 12,
      monthlyCostUsd: 4.5,
    };

    service.getDashboard().subscribe((result) => {
      expect(result).toEqual(mockDashboard);
    });

    const req = httpMock.expectOne(`${baseUrl}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockDashboard });
  });

  // --- Drafts ---

  it('should get drafts with default params', () => {
    const mockData = {
      items: [],
      pagination: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 },
    };

    service.getDrafts().subscribe((result) => {
      expect(result).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${baseUrl}/drafts`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockData });
  });

  it('should get drafts with page and status params', () => {
    const mockData = {
      items: [],
      pagination: { currentPage: 2, lastPage: 3, perPage: 15, total: 45 },
    };

    service.getDrafts({ page: 2, status: 'pending' }).subscribe((result) => {
      expect(result).toEqual(mockData);
    });

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/drafts`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('status')).toBe('pending');
    req.flush({ data: mockData });
  });

  it('should not send status param when status is all', () => {
    service.getDrafts({ status: 'all' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/drafts`);
    expect(req.request.params.has('status')).toBeFalse();
    req.flush({ data: { items: [], pagination: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 } } });
  });

  // --- Approve/Reject ---

  it('should approve draft via PUT', () => {
    const mockResponse = { id: 1, status: 'approved' };

    service.approveDraft(1).subscribe((result) => {
      expect(result).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(`${baseUrl}/drafts/1/approve`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: mockResponse });
  });

  it('should reject draft via PUT', () => {
    service.rejectDraft(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/drafts/1/reject`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  // --- AI Costs ---

  it('should get AI costs summary', () => {
    const mockSummary = {
      totalCostUsd: 10,
      totalInputTokens: 5000,
      totalOutputTokens: 1000,
      byModel: [],
      byAction: [],
    };

    service.getAiCosts().subscribe((result) => {
      expect(result).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(`${baseUrl}/ai-costs`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockSummary });
  });

  // --- Voice Profile ---

  it('should get voice profile', () => {
    const mockProfile = {
      id: 1,
      styleDescription: 'Friendly',
      styleData: {},
      formalityMap: {},
      analyzedEmailCount: 10,
      draftApprovedCount: 5,
      draftEditedCount: 2,
      draftRejectedCount: 1,
      approvalRate: 0.5,
      lastBuiltAt: null,
      lastRefinedAt: null,
    };

    service.getVoiceProfile().subscribe((result) => {
      expect(result).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${baseUrl}/voice-profile`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockProfile });
  });

  it('should rebuild voice profile via POST', () => {
    const mockResult = { status: 'queued' };

    service.rebuildVoiceProfile().subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${baseUrl}/voice-profile/rebuild`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockResult });
  });
});
