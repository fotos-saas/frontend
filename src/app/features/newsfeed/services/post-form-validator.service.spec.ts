import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PostFormValidatorService } from './post-form-validator.service';

describe('PostFormValidatorService', () => {
  let service: PostFormValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostFormValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('validateTitle should return error for empty', () => {
    expect(service.validateTitle('')).toBeTruthy();
  });

  it('validateTitle should return error for short', () => {
    expect(service.validateTitle('ab')).toBeTruthy();
  });

  it('validateTitle should return undefined for valid', () => {
    expect(service.validateTitle('Valid Title')).toBeUndefined();
  });

  it('validateTitle should return error for too long', () => {
    expect(service.validateTitle('a'.repeat(256))).toBeTruthy();
  });

  it('validateContent should return undefined for short text', () => {
    expect(service.validateContent(100)).toBeUndefined();
  });

  it('validateContent should return error for too long text', () => {
    expect(service.validateContent(5001)).toBeTruthy();
  });

  it('validateEventDate should return error for empty', () => {
    expect(service.validateEventDate('')).toBeTruthy();
  });

  it('validate should return errors for invalid data', () => {
    const errors = service.validate({
      postType: 'event',
      title: '',
      contentTextLength: 0,
      eventDate: '',
    });
    expect(service.hasErrors(errors)).toBe(true);
  });

  it('validate should return no errors for valid announcement', () => {
    const errors = service.validate({
      postType: 'announcement',
      title: 'Valid Title',
      contentTextLength: 100,
      eventDate: '',
    });
    expect(service.hasErrors(errors)).toBe(false);
  });

  it('validateMediaFile should reject oversized file', () => {
    const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    expect(service.validateMediaFile(file).valid).toBe(false);
  });

  it('validateMediaFile should reject invalid type', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    expect(service.validateMediaFile(file).valid).toBe(false);
  });

  it('validateMediaFile should accept valid image', () => {
    const file = new File(['x'], 'img.jpg', { type: 'image/jpeg' });
    expect(service.validateMediaFile(file).valid).toBe(true);
  });

  it('isFormValid should check title length', () => {
    expect(service.isFormValid('ab', 'announcement', '')).toBe(false);
    expect(service.isFormValid('abc', 'announcement', '')).toBe(true);
  });

  it('isFormValid should check event date for events', () => {
    expect(service.isFormValid('Valid', 'event', '')).toBe(false);
    expect(service.isFormValid('Valid', 'event', '2025-06-01')).toBe(true);
  });

  it('getMinDate should return today format', () => {
    const minDate = service.getMinDate();
    expect(minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
