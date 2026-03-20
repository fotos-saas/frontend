import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TimeCreditService } from './time-credit.service';
import { environment } from '../../../../environments/environment';
import type { TimerState, CreateTimeEntryData } from '../models/time-credit.models';

describe('TimeCreditService', () => {
  let service: TimeCreditService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/partner`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeCreditService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TimeCreditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Load Timers ---

  it('should load timers and update signal', () => {
    const mockTimers: TimerState[] = [
      {
        id: 1,
        is_running: true,
        is_paused: false,
        project_id: 10,
        project_name: 'Test',
        work_type: null,
        description: null,
        started_at: '2026-01-01T10:00:00Z',
        elapsed_seconds: 120,
        elapsed_formatted: '00:02:00',
        auto_stop_hours: 8,
        auto_stop_at: '2026-01-01T18:00:00Z',
      },
    ];

    service.loadTimers().subscribe((result) => {
      expect(result).toEqual(mockTimers);
    });

    const req = httpMock.expectOne(`${baseUrl}/timers`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTimers });

    expect(service.timers()).toEqual(mockTimers);
  });

  // --- Start Timer ---

  it('should start timer via POST', () => {
    const mockResult = { id: 1, started_at: '2026-01-01T10:00:00Z' };

    service.startTimer({ project_id: 10, work_type: 'retouch' }).subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${baseUrl}/timers/start`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ project_id: 10, work_type: 'retouch' });
    req.flush({ data: mockResult });
  });

  // --- Pause Timer ---

  it('should pause timer via POST', () => {
    service.pauseTimer(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/timers/1/pause`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // --- Resume Timer ---

  it('should resume timer via POST', () => {
    service.resumeTimer(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/timers/1/resume`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // --- Stop Timer ---

  it('should stop timer via POST', () => {
    const mockResult = { id: 1, minutes: 30 };

    service.stopTimer(1).subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${baseUrl}/timers/1/stop`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockResult });
  });

  it('should stop timer with optional data', () => {
    service.stopTimer(1, { description: 'test', discard: true }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/timers/1/stop`);
    expect(req.request.body).toEqual({ description: 'test', discard: true });
    req.flush({ data: null });
  });

  // --- Stop All Timers ---

  it('should stop all timers via POST', () => {
    const mockResult = { stopped_count: 3 };

    service.stopAllTimers().subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${baseUrl}/timers/stop-all`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockResult });
  });

  // --- Usage ---

  it('should get usage for a project', () => {
    const mockUsage = {
      used_minutes: 80,
      included_minutes: 100,
      remaining_minutes: 20,
      percentage: 80,
      state: 'normal' as const,
      overage_minutes: 0,
      overage_started_hours: 0,
      overage_cost: 0,
      overage_rate: 0,
      overage_confirmed: false,
      formatted: { used: '1h 20m', included: '1h 40m', remaining: '20m', overage: '0m' },
    };

    service.getUsage(10).subscribe((result) => {
      expect(result).toEqual(mockUsage);
    });

    const req = httpMock.expectOne(`${baseUrl}/projects/10/time-usage`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockUsage });
  });

  // --- Time Entries ---

  it('should get time entries for a project', () => {
    const mockData = { data: [], total: 0 };

    service.getTimeEntries(10).subscribe((result) => {
      expect(result).toEqual(mockData);
    });

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/projects/10/time-entries`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ data: mockData });
  });

  it('should get time entries with page param', () => {
    service.getTimeEntries(10, 3).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/projects/10/time-entries`);
    expect(req.request.params.get('page')).toBe('3');
    req.flush({ data: { data: [], total: 0 } });
  });

  // --- Create Time Entry ---

  it('should create time entry via POST', () => {
    const entryData: CreateTimeEntryData = {
      minutes: 30,
      description: 'Face swap task',
      description_hu: 'Arccsere feladat',
      work_type: 'face_swap',
    };

    service.createTimeEntry(10, entryData).subscribe((result) => {
      expect(result).toEqual({ id: 5 });
    });

    const req = httpMock.expectOne(`${baseUrl}/projects/10/time-entries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(entryData);
    req.flush({ data: { id: 5 } });
  });

  // --- Delete Time Entry ---

  it('should delete time entry via DELETE', () => {
    service.deleteTimeEntry(10, 5).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/projects/10/time-entries/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // --- Confirm Overage ---

  it('should confirm overage via POST', () => {
    service.confirmOverage(10).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/projects/10/confirm-overage`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
