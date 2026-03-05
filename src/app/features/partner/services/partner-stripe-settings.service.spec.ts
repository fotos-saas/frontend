import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerStripeSettingsService } from './partner-stripe-settings.service';

describe('PartnerStripeSettingsService', () => {
  let service: PartnerStripeSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerStripeSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(service.settings()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.validating()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('loadSettings should GET and update signals', () => {
    service.loadSettings();
    expect(service.loading()).toBe(true);
    const req = httpMock.expectOne('/api/partner/stripe-settings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { stripe_settings: { publishable_key: 'pk_test' } } });
    expect(service.loading()).toBe(false);
    expect(service.settings()).toBeTruthy();
  });

  it('loadSettings should set error on failure', () => {
    service.loadSettings();
    const req = httpMock.expectOne('/api/partner/stripe-settings');
    req.error(new ProgressEvent('error'));
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });
});
