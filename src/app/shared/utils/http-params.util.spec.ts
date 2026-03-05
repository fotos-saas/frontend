import { describe, it, expect } from 'vitest';
import { buildHttpParams } from './http-params.util';

describe('http-params.util', () => {

  describe('buildHttpParams', () => {
    it('string értéket beállítja', () => {
      const params = buildHttpParams({ search: 'teszt' });
      expect(params.get('search')).toBe('teszt');
    });

    it('number értéket string-gé alakítja', () => {
      const params = buildHttpParams({ page: 1 });
      expect(params.get('page')).toBe('1');
    });

    it('boolean értéket string-gé alakítja', () => {
      const params = buildHttpParams({ active: true });
      expect(params.get('active')).toBe('true');
    });

    it('null értéket kihagyja', () => {
      const params = buildHttpParams({ search: null });
      expect(params.has('search')).toBe(false);
    });

    it('undefined értéket kihagyja', () => {
      const params = buildHttpParams({ search: undefined });
      expect(params.has('search')).toBe(false);
    });

    it('üres string-et kihagyja', () => {
      const params = buildHttpParams({ search: '' });
      expect(params.has('search')).toBe(false);
    });

    it('0 értéket megtartja', () => {
      const params = buildHttpParams({ page: 0 });
      expect(params.get('page')).toBe('0');
    });

    it('false értéket megtartja', () => {
      const params = buildHttpParams({ active: false });
      expect(params.get('active')).toBe('false');
    });

    it('vegyes értékeket kezel', () => {
      const params = buildHttpParams({
        search: 'teszt',
        page: 1,
        active: true,
        filter: null,
        sort: undefined,
        empty: '',
      });
      expect(params.get('search')).toBe('teszt');
      expect(params.get('page')).toBe('1');
      expect(params.get('active')).toBe('true');
      expect(params.has('filter')).toBe(false);
      expect(params.has('sort')).toBe(false);
      expect(params.has('empty')).toBe(false);
    });

    it('üres objektumra üres params-ot ad', () => {
      const params = buildHttpParams({});
      expect(params.toString()).toBe('');
    });
  });
});
