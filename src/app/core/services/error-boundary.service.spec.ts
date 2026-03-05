import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorBoundaryService } from './error-boundary.service';

/**
 * ErrorBoundaryService unit tesztek
 *
 * Hiba UI állapot kezelés: dialog megjelenítés, dismiss, retry, goHome.
 */
describe('ErrorBoundaryService', () => {
  let service: ErrorBoundaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorBoundaryService],
    });
    service = TestBed.inject(ErrorBoundaryService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('alapállapot', () => {
    it('nincs hiba és a dialógus zárt', () => {
      expect(service.showDialog()).toBe(false);
      expect(service.errorInfo()).toBeNull();
      expect(service.hasError()).toBe(false);
      expect(service.shortEventId()).toBeNull();
      expect(service.userFeedback()).toBe('');
    });
  });

  describe('reportError', () => {
    it('beállítja a hiba információkat és megnyitja a dialógust', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api/test' });
      service.reportError(error, 'abc12345-6789');

      expect(service.showDialog()).toBe(true);
      expect(service.hasError()).toBe(true);

      const info = service.errorInfo()!;
      expect(info.statusCode).toBe(500);
      expect(info.url).toBe('/api/test');
      expect(info.eventId).toBe('abc12345-6789');
      expect(info.originalError).toBe(error);
      expect(info.timestamp).toBeInstanceOf(Date);
    });

    it('ismeretlen URL esetén "unknown"-t állít be', () => {
      const error = new HttpErrorResponse({ status: 503 });
      service.reportError(error, 'event-1');

      expect(service.errorInfo()!.url).toBe('unknown');
    });
  });

  describe('shortEventId', () => {
    it('az event ID első 8 karakterét adja vissza', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'abc12345-long-event-id');

      expect(service.shortEventId()).toBe('abc12345');
    });

    it('null ha nincs hiba', () => {
      expect(service.shortEventId()).toBeNull();
    });
  });

  describe('dismiss', () => {
    it('bezárja a dialógust', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'event-1');
      service.dismiss();

      expect(service.showDialog()).toBe(false);
    });

    it('300ms késleltetés után törli az error info-t és a feedback-et', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'event-1');
      service.setFeedback('Felhasználói feedback');

      service.dismiss();

      // Még nem törlődött
      expect(service.errorInfo()).not.toBeNull();
      expect(service.userFeedback()).toBe('Felhasználói feedback');

      // 300ms után törlődik
      vi.advanceTimersByTime(300);

      expect(service.errorInfo()).toBeNull();
      expect(service.userFeedback()).toBe('');
    });
  });

  describe('setFeedback', () => {
    it('beállítja a felhasználói feedback szöveget', () => {
      service.setFeedback('Valami hiba történt');
      expect(service.userFeedback()).toBe('Valami hiba történt');
    });
  });

  describe('retry', () => {
    it('meghívja a dismiss-t és bezárja a dialógust', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'event-1');

      const dismissSpy = vi.spyOn(service, 'dismiss');
      // window.location.reload nem mockolható jsdom-ban, ezért try/catch
      try {
        service.retry();
      } catch {
        // reload hiba jsdom-ban elfogadható
      }

      expect(dismissSpy).toHaveBeenCalled();
      expect(service.showDialog()).toBe(false);

      dismissSpy.mockRestore();
    });
  });

  describe('goHome', () => {
    it('meghívja a dismiss-t és bezárja a dialógust', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'event-1');

      // goHome hívása: dismiss + location.href = '/'
      // jsdom-ban href setter nem mockolható közvetlenül,
      // de a dismiss-t és dialog állapotot tesztelhetjük
      const dismissSpy = vi.spyOn(service, 'dismiss');
      service.goHome();

      expect(dismissSpy).toHaveBeenCalled();
      expect(service.showDialog()).toBe(false);

      dismissSpy.mockRestore();
    });
  });

  describe('hasError computed', () => {
    it('true ha van error info', () => {
      const error = new HttpErrorResponse({ status: 500, url: '/api' });
      service.reportError(error, 'event-1');
      expect(service.hasError()).toBe(true);
    });

    it('false ha nincs error info', () => {
      expect(service.hasError()).toBe(false);
    });
  });
});
