import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { ClientRegisterFormService } from './client-register-form.service';
import { ClientService } from '../../services/client.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('ClientRegisterFormService', () => {
  let service: ClientRegisterFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientRegisterFormService,
        { provide: ClientService, useValue: { register: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(ClientRegisterFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.isSubmitting()).toBe(false);
    expect(service.apiError()).toBeNull();
    expect(service.errors()).toEqual({});
  });

  it('validate should fail for empty email', () => {
    service.email = '';
    service.password = 'password1';
    service.passwordConfirmation = 'password1';
    expect(service.validate()).toBe(false);
  });

  it('validate should fail for invalid email', () => {
    service.email = 'notvalid';
    service.password = 'password1';
    service.passwordConfirmation = 'password1';
    expect(service.validate()).toBe(false);
  });

  it('validate should fail for short password', () => {
    service.email = 'test@test.com';
    service.password = '1234567';
    service.passwordConfirmation = '1234567';
    expect(service.validate()).toBe(false);
  });

  it('validate should fail for mismatched passwords', () => {
    service.email = 'test@test.com';
    service.password = 'password1';
    service.passwordConfirmation = 'password2';
    service.setPasswordStrengthValidator(() => true);
    expect(service.validate()).toBe(false);
  });

  it('onInputChange should clear errors', () => {
    service.email = 'bad';
    service.validate();
    service.onInputChange();
    expect(service.errors()).toEqual({});
    expect(service.apiError()).toBeNull();
  });
});
