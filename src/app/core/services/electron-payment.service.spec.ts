import { TestBed } from '@angular/core/testing';
import { ElectronPaymentService } from './electron-payment.service';
import { LoggerService } from './logger.service';

describe('ElectronPaymentService', () => {
  let service: ElectronPaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(ElectronPaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openStripeCheckout', () => {
    it('érvénytelen URL-re hibát ad (javascript: protocol)', async () => {
      const result = await service.openStripeCheckout('javascript:alert(1)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Érvénytelen');
    });

    it('üres URL-re hibát ad', async () => {
      const result = await service.openStripeCheckout('');
      expect(result.success).toBe(false);
    });
  });

  describe('openStripePortal', () => {
    it('érvénytelen URL-re hibát ad (ftp: protocol)', async () => {
      const result = await service.openStripePortal('ftp://bad.com');
      expect(result.success).toBe(false);
    });

    it('data: protocol-ra hibát ad', async () => {
      const result = await service.openStripePortal('data:text/html,test');
      expect(result.success).toBe(false);
    });
  });

  describe('deep link handlers', () => {
    it('onDeepLink nem dob hibát böngészőben', () => {
      expect(() => service.onDeepLink(vi.fn())).not.toThrow();
    });

    it('onPaymentSuccess nem dob hibát böngészőben', () => {
      expect(() => service.onPaymentSuccess(vi.fn())).not.toThrow();
    });

    it('onPaymentCancelled nem dob hibát böngészőben', () => {
      expect(() => service.onPaymentCancelled(vi.fn())).not.toThrow();
    });
  });
});
