import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OrderValidationService } from './order-validation.service';

describe('OrderValidationService', () => {
  let service: OrderValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isValidEmail should accept valid email', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
  });

  it('isValidEmail should reject empty', () => {
    expect(service.isValidEmail('')).toBe(false);
  });

  it('isValidEmail should reject invalid format', () => {
    expect(service.isValidEmail('notanemail')).toBe(false);
  });

  it('isValidPhone should accept +36 format', () => {
    expect(service.isValidPhone('+36301234567')).toBe(true);
  });

  it('isValidPhone should accept 06 format', () => {
    expect(service.isValidPhone('06301234567')).toBe(true);
  });

  it('isValidPhone should reject invalid', () => {
    expect(service.isValidPhone('12345')).toBe(false);
  });

  it('isNotEmpty should return true for non-empty', () => {
    expect(service.isNotEmpty('hello')).toBe(true);
  });

  it('isNotEmpty should return false for empty/null', () => {
    expect(service.isNotEmpty('')).toBe(false);
    expect(service.isNotEmpty(null)).toBe(false);
    expect(service.isNotEmpty(undefined)).toBe(false);
  });

  it('isWithinMaxLength should validate length', () => {
    expect(service.isWithinMaxLength('abc', 5)).toBe(true);
    expect(service.isWithinMaxLength('abcdef', 5)).toBe(false);
    expect(service.isWithinMaxLength(null, 5)).toBe(true);
  });

  it('validateContactData should return errors for empty data', () => {
    const result = service.validateContactData({ name: '', email: '', phone: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateContactData should pass for valid data', () => {
    const result = service.validateContactData({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+36301234567',
    });
    expect(result.valid).toBe(true);
  });

  it('isContactDataValid should return boolean', () => {
    expect(service.isContactDataValid({ name: '', email: '', phone: '' })).toBe(false);
  });
});
