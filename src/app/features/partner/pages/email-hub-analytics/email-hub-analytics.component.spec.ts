import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { EmailHubAnalyticsComponent } from './email-hub-analytics.component';
import { LoggerService } from '../../../../core/services/logger.service';

describe('EmailHubAnalyticsComponent', () => {
  let component: EmailHubAnalyticsComponent;
  let fixture: ComponentFixture<EmailHubAnalyticsComponent>;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockReport = {
    overview: {
      total_projects: 10,
      total_hours: 120,
      total_included_hours: 100,
      total_overage_hours: 20,
      total_overage_revenue: 50000,
      avg_utilization_pct: 85,
    },
    work_type_stats: [
      { work_type: 'face_swap', entry_count: 15, avg_minutes: 30, min_minutes: 10, max_minutes: 60, std_dev: 12 },
      { work_type: 'retouch', entry_count: 8, avg_minutes: 45, min_minutes: 20, max_minutes: 90, std_dev: 18 },
    ],
    ai_accuracy: {
      total_compared: 50,
      overall_accuracy: 82,
      by_work_type: {
        face_swap: { count: 20, avg_accuracy_pct: 85, avg_estimated: 28, avg_actual: 30, bias: -2 },
        retouch: { count: 10, avg_accuracy_pct: 78, avg_estimated: 50, avg_actual: 45, bias: 5 },
      },
    },
    revenue: {
      total_overage_revenue_ft: 50000,
      projects_with_overage: 3,
      projects_within_budget: 7,
      avg_overage_per_project: 16666,
      max_overage: 25000,
    },
  };

  beforeEach(async () => {
    httpClient = jasmine.createSpyObj('HttpClient', ['get']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    httpClient.get.and.returnValue(of({ data: mockReport }));

    await TestBed.configureTestingModule({
      imports: [EmailHubAnalyticsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: HttpClient, useValue: httpClient },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubAnalyticsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load report on init', () => {
    fixture.detectChanges();

    expect(httpClient.get).toHaveBeenCalled();
    expect(component.report()).toEqual(mockReport);
    expect(component.loading()).toBeFalse();
  });

  it('should handle load error', () => {
    httpClient.get.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.report()).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return correct work type labels', () => {
    expect(component.workTypeLabel('face_swap')).toBe('Arccsere');
    expect(component.workTypeLabel('retouch')).toBe('Retusálás');
    expect(component.workTypeLabel('background_change')).toBe('Háttércsere');
    expect(component.workTypeLabel('text_correction')).toBe('Szövegjavítás');
    expect(component.workTypeLabel('layout_change')).toBe('Elrendezés');
    expect(component.workTypeLabel('color_adjustment')).toBe('Szín korrekció');
    expect(component.workTypeLabel('photo_replacement')).toBe('Fotócsere');
    expect(component.workTypeLabel('other')).toBe('Egyéb');
  });

  it('should return raw value for unknown work type', () => {
    expect(component.workTypeLabel('something_else')).toBe('something_else');
  });

  it('should return overestimate bias label for positive bias > 2', () => {
    expect(component.biasLabel(5)).toBe('+5p túlbecslés');
    expect(component.biasLabel(3)).toBe('+3p túlbecslés');
  });

  it('should return underestimate bias label for negative bias < -2', () => {
    expect(component.biasLabel(-5)).toBe('-5p alulbecslés');
    expect(component.biasLabel(-3)).toBe('-3p alulbecslés');
  });

  it('should return accurate label for small bias', () => {
    expect(component.biasLabel(0)).toBe('pontos');
    expect(component.biasLabel(1)).toBe('pontos');
    expect(component.biasLabel(-1)).toBe('pontos');
    expect(component.biasLabel(2)).toBe('pontos');
    expect(component.biasLabel(-2)).toBe('pontos');
  });

  it('should compute barWidth as percentage of max avg_minutes', () => {
    fixture.detectChanges();

    // max is 45 (retouch)
    expect(component.barWidth(45)).toBe('100%');
    expect(component.barWidth(22.5)).toBe('50%');
  });

  it('should return minimum 5% for barWidth', () => {
    fixture.detectChanges();

    expect(component.barWidth(0)).toBe('5%');
  });

  it('should return 1 as maxBarValue when no stats', () => {
    httpClient.get.and.returnValue(of({ data: { ...mockReport, work_type_stats: [] } }));
    fixture.detectChanges();

    expect(component.maxBarValue()).toBe(1);
  });
});
