import { describe, it, expect } from 'vitest';
import {
  trackById,
  trackByStringId,
  trackByKey,
  trackByIndex,
  trackBySlug,
  trackByName,
  trackByFileName,
  trackByMediaId,
  trackByDeadline,
  trackByUuid,
  trackByValue,
  createTrackBy
} from './track-by.utils';

describe('track-by.utils', () => {

  // ============================================================================
  // trackById
  // ============================================================================
  describe('trackById', () => {
    it('should return numeric id from object', () => {
      const item = { id: 123, name: 'Test' };
      expect(trackById(0, item)).toBe(123);
    });

    it('should work with any index', () => {
      const item = { id: 456 };
      expect(trackById(99, item)).toBe(456);
    });
  });

  // ============================================================================
  // trackByStringId
  // ============================================================================
  describe('trackByStringId', () => {
    it('should return string id from object', () => {
      const item = { id: 'abc-123', name: 'Test' };
      expect(trackByStringId(0, item)).toBe('abc-123');
    });
  });

  // ============================================================================
  // trackByKey
  // ============================================================================
  describe('trackByKey', () => {
    it('should return key from object', () => {
      const item = { key: 'my-key', value: 'test' };
      expect(trackByKey(0, item)).toBe('my-key');
    });
  });

  // ============================================================================
  // trackByIndex
  // ============================================================================
  describe('trackByIndex', () => {
    it('should return index', () => {
      expect(trackByIndex(0)).toBe(0);
      expect(trackByIndex(5)).toBe(5);
      expect(trackByIndex(100)).toBe(100);
    });
  });

  // ============================================================================
  // trackBySlug
  // ============================================================================
  describe('trackBySlug', () => {
    it('should return slug from object', () => {
      const item = { slug: 'my-slug', title: 'Test' };
      expect(trackBySlug(0, item)).toBe('my-slug');
    });
  });

  // ============================================================================
  // trackByName
  // ============================================================================
  describe('trackByName', () => {
    it('should return name from object', () => {
      const item = { name: 'Test Name', id: 1 };
      expect(trackByName(0, item)).toBe('Test Name');
    });
  });

  // ============================================================================
  // trackByFileName
  // ============================================================================
  describe('trackByFileName', () => {
    it('should return file name from File object', () => {
      const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
      expect(trackByFileName(0, file)).toBe('test-file.txt');
    });
  });

  // ============================================================================
  // trackByMediaId
  // ============================================================================
  describe('trackByMediaId', () => {
    it('should return media id from object', () => {
      const media = { id: 789, url: 'https://example.com/image.jpg' };
      expect(trackByMediaId(0, media)).toBe(789);
    });
  });

  // ============================================================================
  // trackByDeadline
  // ============================================================================
  describe('trackByDeadline', () => {
    it('should return deadline string from object', () => {
      const item = { deadline: '2025-01-15', title: 'Vote' };
      expect(trackByDeadline(0, item)).toBe('2025-01-15');
    });
  });

  // ============================================================================
  // trackByUuid
  // ============================================================================
  describe('trackByUuid', () => {
    it('should return uuid from object', () => {
      const item = { uuid: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' };
      expect(trackByUuid(0, item)).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  // ============================================================================
  // trackByValue
  // ============================================================================
  describe('trackByValue', () => {
    it('should return string value', () => {
      expect(trackByValue(0, 'test-string')).toBe('test-string');
    });

    it('should return number value', () => {
      expect(trackByValue(0, 42)).toBe(42);
    });
  });

  // ============================================================================
  // createTrackBy
  // ============================================================================
  describe('createTrackBy', () => {
    it('should create custom trackBy function', () => {
      interface CustomItem {
        customField: string;
        otherData: number;
      }

      const trackByCustomField = createTrackBy<CustomItem, string>(
        item => item.customField
      );

      const item: CustomItem = { customField: 'unique-value', otherData: 123 };
      expect(trackByCustomField(0, item)).toBe('unique-value');
    });

    it('should work with nested properties', () => {
      interface NestedItem {
        data: {
          nested: {
            id: number;
          };
        };
      }

      const trackByNestedId = createTrackBy<NestedItem, number>(
        item => item.data.nested.id
      );

      const item: NestedItem = { data: { nested: { id: 999 } } };
      expect(trackByNestedId(0, item)).toBe(999);
    });

    it('should work with computed values', () => {
      interface Item {
        firstName: string;
        lastName: string;
      }

      const trackByFullName = createTrackBy<Item, string>(
        item => `${item.firstName}-${item.lastName}`
      );

      const item: Item = { firstName: 'John', lastName: 'Doe' };
      expect(trackByFullName(0, item)).toBe('John-Doe');
    });
  });
});
