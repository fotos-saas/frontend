import { describe, it, expect } from 'vitest';
import { safeJsonParse } from './safe-json-parse';

describe('safe-json-parse', () => {

  describe('safeJsonParse', () => {
    it('érvényes JSON-t parse-ol', () => {
      expect(safeJsonParse('{"name":"Test"}', null)).toEqual({ name: 'Test' });
    });

    it('tömböt parse-ol', () => {
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('stringet parse-ol', () => {
      expect(safeJsonParse('"hello"', '')).toBe('hello');
    });

    it('számot parse-ol', () => {
      expect(safeJsonParse('42', 0)).toBe(42);
    });

    it('boolean-t parse-ol', () => {
      expect(safeJsonParse('true', false)).toBe(true);
    });

    it('null bemenetnél fallback-et ad', () => {
      expect(safeJsonParse(null, { theme: 'light' })).toEqual({ theme: 'light' });
    });

    it('üres string-nél fallback-et ad', () => {
      expect(safeJsonParse('', 'default')).toBe('default');
    });

    it('érvénytelen JSON-nél fallback-et ad', () => {
      expect(safeJsonParse('{invalid json}', null)).toBeNull();
    });

    it('részleges JSON-nél fallback-et ad', () => {
      expect(safeJsonParse('{"name":', [])).toEqual([]);
    });

    it('fallback null is lehet', () => {
      expect(safeJsonParse('invalid', null)).toBeNull();
    });

    it('komplex objektumot parse-ol', () => {
      const json = '{"user":{"name":"Test","age":25},"active":true}';
      const result = safeJsonParse<{ user: { name: string; age: number }; active: boolean }>(json, { user: { name: '', age: 0 }, active: false });
      expect(result.user.name).toBe('Test');
      expect(result.active).toBe(true);
    });
  });
});
