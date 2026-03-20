import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EmailHubAiCostsComponent } from './email-hub-ai-costs.component';
import { EmailHubService } from '../../services/email-hub.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { AiCostSummary, AiDailyCost } from '../../models/email-hub.models';

describe('EmailHubAiCostsComponent', () => {
  let component: EmailHubAiCostsComponent;
  let fixture: ComponentFixture<EmailHubAiCostsComponent>;
  let service: jasmine.SpyObj<EmailHubService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockSummary: AiCostSummary = {
    totalCostUsd: 12.5678,
    totalInputTokens: 2_500_000,
    totalOutputTokens: 850,
    byModel: [{ model: 'gpt-4', costUsd: 10, callCount: 5 }],
    byAction: [{ action: 'draft', costUsd: 8, callCount: 4 }],
  };

  const mockDailyCosts: AiDailyCost[] = [
    { date: '2026-01-01', costUsd: 0.5, callCount: 3 },
    { date: '2026-01-02', costUsd: 1.2, callCount: 7 },
    { date: '2026-01-03', costUsd: 0.1, callCount: 1 },
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj('EmailHubService', ['getAiCosts', 'getAiCostsDaily']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    service.getAiCosts.and.returnValue(of(mockSummary));
    service.getAiCostsDaily.and.returnValue(of(mockDailyCosts));

    await TestBed.configureTestingModule({
      imports: [EmailHubAiCostsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EmailHubService, useValue: service },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubAiCostsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    fixture.detectChanges();

    expect(service.getAiCosts).toHaveBeenCalled();
    expect(service.getAiCostsDaily).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummary);
    expect(component.dailyCosts()).toEqual(mockDailyCosts);
    expect(component.loading()).toBeFalse();
  });

  it('should handle getAiCosts error', () => {
    service.getAiCosts.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should format USD values with 4 decimals', () => {
    expect(component.formatUsd(0.1234)).toBe('$0.1234');
    expect(component.formatUsd(12.5)).toBe('$12.5000');
    expect(component.formatUsd(0)).toBe('$0.0000');
  });

  it('should format tokens as M for millions', () => {
    expect(component.formatTokens(2_500_000)).toBe('2.5M');
    expect(component.formatTokens(1_000_000)).toBe('1.0M');
  });

  it('should format tokens as K for thousands', () => {
    expect(component.formatTokens(5_000)).toBe('5K');
    expect(component.formatTokens(1_500)).toBe('2K');
  });

  it('should format tokens as plain number for small values', () => {
    expect(component.formatTokens(850)).toBe('850');
    expect(component.formatTokens(0)).toBe('0');
  });

  it('should compute barHeight as percentage of max daily cost', () => {
    fixture.detectChanges();

    // max is 1.2
    expect(component.barHeight(1.2)).toBe('100%');
    expect(component.barHeight(0.6)).toBe('50%');
  });

  it('should return minimum 2% for barHeight', () => {
    fixture.detectChanges();

    expect(component.barHeight(0)).toBe('2%');
  });

  it('should return 1 as maxDailyCost when no daily costs', () => {
    service.getAiCostsDaily.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.maxDailyCost()).toBe(1);
  });
});
