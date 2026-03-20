import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EmailHubModificationsComponent } from './email-hub-modifications.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { ModificationRound } from '../../models/email-hub.models';

describe('EmailHubModificationsComponent', () => {
  let component: EmailHubModificationsComponent;
  let fixture: ComponentFixture<EmailHubModificationsComponent>;
  let service: jasmine.SpyObj<EmailHubService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockRound: ModificationRound = {
    id: 1,
    roundNumber: 2,
    status: 'in_progress',
    statusLabel: 'Folyamatban',
    statusColor: 'blue',
    isFree: false,
    priceHuf: 5000,
    paymentStatus: 'paid',
    paymentStatusLabel: 'Fizetve',
    aiSummary: 'Arccsere 2 tanulonal',
    totalTasks: 4,
    completedTasks: 2,
    progressPercent: 50,
    requestedAt: '2026-01-10T08:00:00Z',
    completedAt: null,
    createdAt: '2026-01-10T08:00:00Z',
  };

  const mockPaginated = {
    items: [mockRound],
    pagination: { currentPage: 1, lastPage: 2, perPage: 15, total: 20 },
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('EmailHubService', ['getModificationRounds']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    service.getModificationRounds.and.returnValue(of(mockPaginated));

    await TestBed.configureTestingModule({
      imports: [EmailHubModificationsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EmailHubService, useValue: service },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubModificationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load rounds on init', () => {
    fixture.detectChanges();

    expect(service.getModificationRounds).toHaveBeenCalledWith({ page: 1 });
    expect(component.rounds()).toEqual([mockRound]);
    expect(component.totalPages()).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should handle load error', () => {
    service.getModificationRounds.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const result = component.formatDate('2026-01-10T08:00:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
  });

  it('should return dash for null date', () => {
    expect(component.formatDate(null)).toBe('—');
  });

  it('should format price in HUF', () => {
    const result = component.formatPrice(5000);
    expect(result).toContain('Ft');
    expect(result).toContain('5');
  });

  it('should return Ingyenes for null price', () => {
    expect(component.formatPrice(null)).toBe('Ingyenes');
  });

  it('should return Ingyenes for zero price', () => {
    expect(component.formatPrice(0)).toBe('Ingyenes');
  });

  it('should return correct status color', () => {
    expect(component.statusColor('amber')).toBe('#f59e0b');
    expect(component.statusColor('blue')).toBe('#3b82f6');
    expect(component.statusColor('green')).toBe('#22c55e');
    expect(component.statusColor('gray')).toBe('#94a3b8');
  });

  it('should fallback to gray for unknown color', () => {
    expect(component.statusColor('unknown')).toBe('#94a3b8');
  });

  it('should update page and reload on goToPage', () => {
    fixture.detectChanges();
    service.getModificationRounds.calls.reset();

    component.goToPage(2);

    expect(component.currentPage()).toBe(2);
    expect(service.getModificationRounds).toHaveBeenCalledWith({ page: 2 });
  });
});
