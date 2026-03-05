import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PartnerFinalizationService } from './partner-finalization.service';

describe('PartnerFinalizationService', () => {
  let service: PartnerFinalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartnerFinalizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
