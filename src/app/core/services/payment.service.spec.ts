import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { ElectronService } from './electron.service';
import { LoggerService } from './logger.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const mockElectronService = {
    isElectron: false,
    onPaymentSuccess: vi.fn(),
    onPaymentCancelled: vi.fn(),
    openStripeCheckout: vi.fn(),
    openStripePortal: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ElectronService, useValue: mockElectronService },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isDesktop', () => {
    it('false ha nem Electron', () => {
      expect(service.isDesktop).toBe(false);
    });
  });

  describe('completeRegistration', () => {
    it('POST kérést küld a session_id-vel', async () => {
      const promise = firstValueFrom(service.completeRegistration('sess_123'));
      const req = httpMock.expectOne((r) => r.url.includes('/complete-registration'));
      expect(req.request.body.session_id).toBe('sess_123');
      req.flush({ message: 'OK' });

      const result = await promise;
      expect(result.message).toBe('OK');
    });
  });

  describe('verifySession', () => {
    it('POST kérést küld', async () => {
      const promise = firstValueFrom(service.verifySession('sess_123'));
      const req = httpMock.expectOne((r) => r.url.includes('/verify'));
      req.flush({ status: 'complete', payment_status: 'paid' });

      const result = await promise;
      expect(result.status).toBe('complete');
    });
  });

  describe('onPaymentSuccess / onPaymentCancelled', () => {
    it('observable-öket biztosít', () => {
      expect(service.onPaymentSuccess).toBeTruthy();
      expect(service.onPaymentCancelled).toBeTruthy();
    });
  });
});
