import { describe, it, expect } from 'vitest';
import { DiscussionFormValidatorService } from './discussion-form-validator.service';

describe('DiscussionFormValidatorService', () => {
  const service = new DiscussionFormValidatorService();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('validate should return empty errors for valid data', () => {
    const errors = service.validate({
      title: 'Valid Title',
      content: 'This is valid content text here',
      contentTextLength: 30,
      useRichEditor: false,
    });
    expect(service.hasErrors(errors)).toBe(false);
  });

  it('validate should return title error for empty title', () => {
    const errors = service.validate({
      title: '',
      content: 'Some content here',
      contentTextLength: 20,
      useRichEditor: false,
    });
    expect(errors.title).toBeTruthy();
  });

  it('validate should return title error for short title', () => {
    const errors = service.validate({
      title: 'AB',
      content: 'Some content here',
      contentTextLength: 20,
      useRichEditor: false,
    });
    expect(errors.title).toBeTruthy();
  });

  it('validate should return content error for short plain content', () => {
    const errors = service.validate({
      title: 'Valid Title',
      content: 'Short',
      contentTextLength: 5,
      useRichEditor: false,
    });
    expect(errors.content).toBeTruthy();
  });

  it('validate should use contentTextLength for rich editor', () => {
    const errors = service.validate({
      title: 'Valid Title',
      content: '<p>x</p>',
      contentTextLength: 5,
      useRichEditor: true,
    });
    expect(errors.content).toBeTruthy();
  });

  it('isFormValid should return true for valid data', () => {
    expect(service.isFormValid('Valid Title', 20, 'Some long enough content', false)).toBe(true);
  });

  it('isFormValid should return false for short title', () => {
    expect(service.isFormValid('AB', 20, 'Some content', false)).toBe(false);
  });

  it('hasErrors should detect errors', () => {
    expect(service.hasErrors({ title: 'Error' })).toBe(true);
    expect(service.hasErrors({})).toBe(false);
  });
});
