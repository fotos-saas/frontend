import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ErrorFeedbackDialogComponent } from './error-feedback-dialog.component';
import { LoggerService } from '@core/services/logger.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ErrorBoundaryService } from '../../../core/services/error-boundary.service';
import { SentryService } from '../../../core/services/sentry.service';

describe('ErrorFeedbackDialogComponent', () => {
  let component: ErrorFeedbackDialogComponent;
  let fixture: ComponentFixture<ErrorFeedbackDialogComponent>;

  beforeEach(async () => {
    const mockLoggerService = {};
    const mockClipboardService = {
      copy: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockErrorBoundaryService = {
      showDialog: vi.fn().mockReturnValue(null),
      errorInfo: vi.fn().mockReturnValue(null),
      shortEventId: vi.fn().mockReturnValue(null),
      dismiss: vi.fn().mockReturnValue(null),
      retry: vi.fn().mockReturnValue(null),
      goHome: vi.fn().mockReturnValue(null)
    };
    const mockSentryService = {
      captureMessage: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ErrorFeedbackDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ClipboardService, useValue: mockClipboardService },
        { provide: ErrorBoundaryService, useValue: mockErrorBoundaryService },
        { provide: SentryService, useValue: mockSentryService }
      ],
    })
    .overrideComponent(ErrorFeedbackDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorFeedbackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
