import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';
import { SentryService } from '../services/sentry.service';
import { ErrorBoundaryService } from '../services/error-boundary.service';
import { AuthService } from '../services/auth.service';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: { error: ReturnType<typeof vi.fn> };
  let loggerService: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastService = { error: vi.fn() };
    loggerService = { error: vi.fn() };

    const sentryServiceMock = {
      captureException: vi.fn().mockReturnValue('test-event-id')
    };
    const errorBoundaryMock = {
      reportError: vi.fn()
    };
    const authServiceMock = {
      logoutAdmin: vi.fn()
    };
    const routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService },
        { provide: SentryService, useValue: sentryServiceMock },
        { provide: ErrorBoundaryService, useValue: errorBoundaryMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful responses', () => {
    const testData = { message: 'success' };

    httpClient.get('/api/test').subscribe({
      next: (data) => {
        expect(data).toEqual(testData);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(testData);

    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should handle 400 Bad Request', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Érvénytelen kérés',
      'Bad request',
      4000
    );
    expect(loggerService.error).toHaveBeenCalled();
  });

  it('should handle 400 with default message when no message in response', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 400, statusText: 'Bad Request' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Érvénytelen kérés',
      'A kérés hibás formátumú.',
      4000
    );
  });

  it('should handle 403 Forbidden', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(403);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Hozzáférés megtagadva',
      'Nincs jogosultságod ehhez a művelethez.',
      4000
    );
  });

  it('should handle 404 Not Found', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Nem található',
      'A keresett erőforrás nem található.',
      4000
    );
  });

  it('should handle 422 Validation Error with Laravel errors format', () => {
    const validationErrors = {
      message: 'The given data was invalid.',
      errors: {
        email: ['Az email cím már foglalt.', 'Érvénytelen formátum.'],
        name: ['A név kötelező.']
      }
    };

    httpClient.post('/api/test', {}).subscribe({
      error: (error) => {
        expect(error.status).toBe(422);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(validationErrors, { status: 422, statusText: 'Unprocessable Entity' });

    // Első mező első hibája jelenik meg
    expect(toastService.error).toHaveBeenCalledWith(
      'Validációs hiba',
      'Az email cím már foglalt.',
      4000
    );
  });

  it('should handle 422 with message fallback when no errors object', () => {
    httpClient.post('/api/test', {}).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Egyedi hibaüzenet' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Validációs hiba',
      'Egyedi hibaüzenet',
      4000
    );
  });

  it('should handle 422 with default message when no message', () => {
    httpClient.post('/api/test', {}).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Validációs hiba',
      'Ellenőrizd a megadott adatokat.',
      4000
    );
  });

  it('should handle 429 Too Many Requests', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(429);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 429, statusText: 'Too Many Requests' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Túl sok kérés',
      'Kérlek várj egy kicsit, majd próbáld újra.',
      4000
    );
  });

  it('should handle 500 Internal Server Error with longer duration', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 500, statusText: 'Internal Server Error' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Szerverhiba',
      'Belső szerverhiba történt. Kérlek próbáld újra később.',
      5000
    );
  });

  it('should handle 502 Bad Gateway', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(502);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 502, statusText: 'Bad Gateway' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Szerver nem elérhető',
      'A szerver ideiglenesen nem elérhető.',
      5000
    );
  });

  it('should handle 503 Service Unavailable', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(503);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 503, statusText: 'Service Unavailable' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Karbantartás',
      'A szerver karbantartás alatt. Kérlek próbáld újra később.',
      5000
    );
  });

  it('should handle 504 Gateway Timeout', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(504);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 504, statusText: 'Gateway Timeout' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Időtúllépés',
      'A szerver nem válaszolt időben. Kérlek próbáld újra.',
      5000
    );
  });

  it('should handle other 5xx errors with generic message', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(507);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 507, statusText: 'Insufficient Storage' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Szerverhiba',
      'Váratlan hiba történt. Kérlek próbáld újra később.',
      5000
    );
  });

  it('should NOT handle 401 Unauthorized (handled by AuthInterceptor)', () => {
    httpClient.get('/api/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    // ErrorInterceptor NEM kezeli a 401-et
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should log all errors to LoggerService', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Error' }, { status: 404, statusText: 'Not Found' });

    expect(loggerService.error).toHaveBeenCalledWith(
      'HTTP Error 404',
      expect.objectContaining({
        url: '/api/test',
        status: 404,
        statusText: 'Not Found'
      })
    );
  });

  it('should extract error message from string response', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Egyszerű szöveges hiba', { status: 400, statusText: 'Bad Request' });

    expect(toastService.error).toHaveBeenCalledWith(
      'Érvénytelen kérés',
      'Egyszerű szöveges hiba',
      4000
    );
  });
});
