import { TestBed } from '@angular/core/testing';
import { SentryService, SentryErrorHandler } from './sentry.service';
import { Router } from '@angular/router';

// Mock Sentry since it requires browser context
vi.mock('@sentry/angular', () => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn().mockReturnValue('event-id'),
  captureMessage: vi.fn().mockReturnValue('msg-id'),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  startInactiveSpan: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  TraceService: class {},
}));

describe('SentryService', () => {
  let service: SentryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SentryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('nem inicializál DSN nélkül', () => {
      service.init();
      // Nincs DSN → skip
    });
  });

  describe('setUser', () => {
    it('null user-t is elfogad', () => {
      expect(() => service.setUser(null)).not.toThrow();
    });

    it('user adatokkal hívható', () => {
      expect(() => service.setUser({ id: '1', email: 'a@a.com' })).not.toThrow();
    });
  });

  describe('captureException', () => {
    it('nem inicializált állapotban undefined-et ad', () => {
      expect(service.captureException(new Error('test'))).toBeUndefined();
    });
  });

  describe('captureMessage', () => {
    it('nem inicializált állapotban undefined-et ad', () => {
      expect(service.captureMessage('test')).toBeUndefined();
    });
  });

  describe('addBreadcrumb', () => {
    it('nem inicializált állapotban nem dob hibát', () => {
      expect(() => service.addBreadcrumb('test')).not.toThrow();
    });
  });

  describe('setTag', () => {
    it('nem inicializált állapotban nem dob hibát', () => {
      expect(() => service.setTag('key', 'value')).not.toThrow();
    });
  });

  describe('setContext', () => {
    it('nem inicializált állapotban nem dob hibát', () => {
      expect(() => service.setContext('ctx', { foo: 'bar' })).not.toThrow();
    });
  });

  describe('startTransaction', () => {
    it('nem inicializált állapotban undefined-et ad', () => {
      expect(service.startTransaction('name', 'op')).toBeUndefined();
    });
  });
});

describe('SentryErrorHandler', () => {
  let handler: SentryErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SentryErrorHandler],
    });
    handler = TestBed.inject(SentryErrorHandler);
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('handleError nem dob hibát', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => handler.handleError(new Error('test'))).not.toThrow();
    consoleSpy.mockRestore();
  });
});
