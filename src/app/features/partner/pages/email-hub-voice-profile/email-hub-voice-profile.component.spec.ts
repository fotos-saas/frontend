import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EmailHubVoiceProfileComponent } from './email-hub-voice-profile.component';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { VoiceProfile } from '../../models/email-hub.models';

describe('EmailHubVoiceProfileComponent', () => {
  let component: EmailHubVoiceProfileComponent;
  let fixture: ComponentFixture<EmailHubVoiceProfileComponent>;
  let service: jasmine.SpyObj<EmailHubService>;
  let toast: jasmine.SpyObj<ToastService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockProfile: VoiceProfile = {
    id: 1,
    styleDescription: 'Baratsagos, informalis stilus',
    styleData: {},
    formalityMap: {
      'test@example.com': { formality: 'informal', confidence: 0.9 },
      'boss@example.com': { formality: 'formal', confidence: 0.85 },
    },
    analyzedEmailCount: 50,
    draftApprovedCount: 30,
    draftEditedCount: 10,
    draftRejectedCount: 5,
    approvalRate: 0.6,
    lastBuiltAt: '2026-01-15T10:30:00Z',
    lastRefinedAt: null,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('EmailHubService', ['getVoiceProfile', 'rebuildVoiceProfile']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    service.getVoiceProfile.and.returnValue(of(mockProfile));
    service.rebuildVoiceProfile.and.returnValue(of({ status: 'queued' }));

    await TestBed.configureTestingModule({
      imports: [EmailHubVoiceProfileComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EmailHubService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailHubVoiceProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load profile on init', () => {
    fixture.detectChanges();

    expect(service.getVoiceProfile).toHaveBeenCalled();
    expect(component.profile()).toEqual(mockProfile);
    expect(component.loading()).toBeFalse();
  });

  it('should handle profile load error', () => {
    service.getVoiceProfile.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.profile()).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return correct formality labels', () => {
    expect(component.formalityLabel('informal')).toBe('Tegez');
    expect(component.formalityLabel('formal')).toBe('Magáz');
    expect(component.formalityLabel('mixed')).toBe('Vegyes');
    expect(component.formalityLabel('unknown')).toBe('Vegyes');
  });

  it('should format date for valid date string', () => {
    const result = component.formatDate('2026-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Még nem készült');
  });

  it('should return placeholder for null date', () => {
    expect(component.formatDate(null)).toBe('Még nem készült');
  });

  it('should call rebuildVoiceProfile and show toast', () => {
    fixture.detectChanges();

    component.rebuild();

    expect(service.rebuildVoiceProfile).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(component.rebuilding()).toBeFalse();
  });

  it('should handle rebuild error', () => {
    fixture.detectChanges();
    service.rebuildVoiceProfile.and.returnValue(throwError(() => new Error('fail')));

    component.rebuild();

    expect(toast.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(component.rebuilding()).toBeFalse();
  });

  it('should return formality entries from profile', () => {
    fixture.detectChanges();

    const entries = component.formalityEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].email).toBe('test@example.com');
    expect(entries[0].formality).toBe('informal');
    expect(entries[1].email).toBe('boss@example.com');
    expect(entries[1].formality).toBe('formal');
  });

  it('should return empty entries when no profile', () => {
    expect(component.formalityEntries()).toEqual([]);
  });
});
