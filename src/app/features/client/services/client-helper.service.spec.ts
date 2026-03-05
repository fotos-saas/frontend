import { describe, it, expect } from 'vitest';
import { ClientHelperService } from './client-helper.service';

describe('ClientHelperService', () => {
  const service = new ClientHelperService();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStatusLabel should return label for known statuses', () => {
    expect(service.getStatusLabel('draft')).toBeTruthy();
    expect(service.getStatusLabel('completed')).toBeTruthy();
  });

  it('getStatusColor should return CSS classes', () => {
    expect(service.getStatusColor('draft')).toBeTruthy();
  });

  it('getTypeLabel should return label', () => {
    expect(service.getTypeLabel('selection')).toBeTruthy();
    expect(service.getTypeLabel('tablo')).toBeTruthy();
  });
});
