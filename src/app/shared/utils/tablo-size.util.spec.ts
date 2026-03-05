import { describe, it, expect } from 'vitest';
import { selectTabloSize, resolveProjectTabloSize } from './tablo-size.util';

// TabloSize és TabloSizeThreshold típusok helyi definíciói (egyszerű interface-ek)
interface TabloSize {
  label: string;
  value: string;
}

interface TabloSizeThreshold {
  threshold: number;
  below: string;
  above: string;
}

describe('tablo-size.util', () => {

  const sizes: TabloSize[] = [
    { label: '30x40', value: '30x40' },
    { label: '40x50', value: '40x50' },
    { label: '50x70', value: '50x70' },
  ];

  const threshold: TabloSizeThreshold = {
    threshold: 25,
    below: '30x40',
    above: '40x50',
  };

  // ============================================================================
  // selectTabloSize
  // ============================================================================
  describe('selectTabloSize', () => {
    it('üres méretek → null', () => {
      expect(selectTabloSize(10, [], null)).toBeNull();
    });

    it('threshold nélkül az első méretet adja', () => {
      const result = selectTabloSize(10, sizes, null);
      expect(result).toEqual(sizes[0]);
    });

    it('threshold alatt → below méretet adja', () => {
      const result = selectTabloSize(20, sizes, threshold);
      expect(result?.value).toBe('30x40');
    });

    it('threshold felett → above méretet adja', () => {
      const result = selectTabloSize(30, sizes, threshold);
      expect(result?.value).toBe('40x50');
    });

    it('pontosan threshold-on → above méretet adja', () => {
      const result = selectTabloSize(25, sizes, threshold);
      expect(result?.value).toBe('40x50');
    });

    it('threshold below értéke nem létezik → első méretet adja', () => {
      const badThreshold = { threshold: 25, below: 'nem_letezo', above: '40x50' };
      const result = selectTabloSize(20, sizes, badThreshold);
      expect(result).toEqual(sizes[0]);
    });

    it('threshold above értéke nem létezik → első méretet adja', () => {
      const badThreshold = { threshold: 25, below: '30x40', above: 'nem_letezo' };
      const result = selectTabloSize(30, sizes, badThreshold);
      expect(result).toEqual(sizes[0]);
    });
  });

  // ============================================================================
  // resolveProjectTabloSize
  // ============================================================================
  describe('resolveProjectTabloSize', () => {
    it('projekt tabloSize-t prioritizálja', () => {
      const project = { tabloSize: '50x70', personsCount: 10 };
      const result = resolveProjectTabloSize(project, sizes, threshold);
      expect(result?.value).toBe('50x70');
    });

    it('projekt tabloSize null → automatikus számítás', () => {
      const project = { tabloSize: null, personsCount: 20 };
      const result = resolveProjectTabloSize(project, sizes, threshold);
      expect(result?.value).toBe('30x40'); // 20 < 25 → below
    });

    it('projekt tabloSize üres string → automatikus számítás', () => {
      const project = { tabloSize: '', personsCount: 30 };
      const result = resolveProjectTabloSize(project, sizes, threshold);
      expect(result?.value).toBe('40x50'); // 30 >= 25 → above
    });

    it('projekt tabloSize nem létező méret → automatikus számítás', () => {
      const project = { tabloSize: 'nem_letezo', personsCount: 30 };
      const result = resolveProjectTabloSize(project, sizes, threshold);
      expect(result?.value).toBe('40x50');
    });

    it('üres sizes → null', () => {
      const project = { tabloSize: null, personsCount: 10 };
      expect(resolveProjectTabloSize(project, [], null)).toBeNull();
    });
  });
});
