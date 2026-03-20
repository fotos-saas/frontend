import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EmailHubDraftsComponent } from './email-hub-drafts.component';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { DraftResponse } from '../../models/email-hub.models';

describe('EmailHubDraftsComponent', () => {
  let component: EmailHubDraftsComponent;
  let fixture: ComponentFixture<EmailHubDraftsComponent>;
  let service: jasmine.SpyObj<EmailHubService>;
  let toast: jasmine.SpyObj<ToastService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockDraft: DraftResponse = {
    id: 1,
    responseType: 'auto',
    responseTypeLabel: 'Automatikus',
    status: 'pending',
    statusLabel: 'Függőben',
    draftSubject: 'Test Subject',
    draftBody: 'Test Body',
    draftBodyHtml: null,
    finalBody: null,
    aiConfidence: 0.92,
    aiModel: 'gpt-4',
    aiReasoning: null,
    requiresProductionApproval: false,
    productionApproved: null,
    fewShotEmailIds: null,
    approvedAt: null,
    sentAt: null,
    rejectedAt: null,
    createdAt: '2026-01-01T10:00:00Z',
  };

  const mockPaginatedDrafts = {
    items: [mockDraft],
    pagination: { currentPage: 1, lastPage: 3, perPage: 15, total: 45 },
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('EmailHubService', ['getDrafts', 'approveDraft', 'rejectDraft']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    service.getDrafts.and.returnValue(of(mockPaginatedDrafts));
    service.approveDraft.and.returnValue(of(mockDraft));
    service.rejectDraft.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [EmailHubDraftsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EmailHubService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubDraftsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load drafts on init', () => {
    fixture.detectChanges();

    expect(service.getDrafts).toHaveBeenCalledWith({ page: 1, status: 'pending' });
    expect(component.drafts()).toEqual([mockDraft]);
    expect(component.totalPages()).toBe(3);
    expect(component.loading()).toBeFalse();
  });

  it('should reset page on setFilter', () => {
    fixture.detectChanges();
    service.getDrafts.calls.reset();

    component.goToPage(2);
    expect(component.currentPage()).toBe(2);

    component.setFilter('sent');
    expect(component.filter()).toBe('sent');
    expect(component.currentPage()).toBe(1);
    expect(service.getDrafts).toHaveBeenCalledWith({ page: 1, status: 'sent' });
  });

  it('should call approveDraft and reload', () => {
    fixture.detectChanges();
    service.getDrafts.calls.reset();

    component.approve(mockDraft);

    expect(service.approveDraft).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
    expect(service.getDrafts).toHaveBeenCalled();
  });

  it('should show error toast on approve failure', () => {
    fixture.detectChanges();
    service.approveDraft.and.returnValue(throwError(() => new Error('fail')));

    component.approve(mockDraft);

    expect(toast.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should call rejectDraft and reload', () => {
    fixture.detectChanges();
    service.getDrafts.calls.reset();

    component.reject(mockDraft);

    expect(service.rejectDraft).toHaveBeenCalledWith(1);
    expect(toast.info).toHaveBeenCalled();
    expect(service.getDrafts).toHaveBeenCalled();
  });

  it('should show error toast on reject failure', () => {
    fixture.detectChanges();
    service.rejectDraft.and.returnValue(throwError(() => new Error('fail')));

    component.reject(mockDraft);

    expect(toast.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return confidence percent string', () => {
    expect(component.confidencePercent(0.923)).toBe('92%');
    expect(component.confidencePercent(1)).toBe('100%');
    expect(component.confidencePercent(0)).toBe('0%');
  });

  it('should return correct confidence class', () => {
    expect(component.confidenceClass(0.9)).toBe('confidence--high');
    expect(component.confidenceClass(0.85)).toBe('confidence--high');
    expect(component.confidenceClass(0.7)).toBe('confidence--medium');
    expect(component.confidenceClass(0.5)).toBe('confidence--medium');
    expect(component.confidenceClass(0.3)).toBe('confidence--low');
  });
});
