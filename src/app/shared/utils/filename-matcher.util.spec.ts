import { describe, it, expect } from 'vitest';
import { matchFilesToPersons, FileMatchResult } from './filename-matcher.util';

// Mock File objektum
function createFile(name: string): File {
  return new File([''], name, { type: 'image/jpeg' });
}

describe('filename-matcher.util', () => {

  describe('matchFilesToPersons', () => {
    it('pontos egyezést talál', () => {
      const files = [createFile('Kiss János.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results).toHaveLength(1);
      expect(results[0].personId).toBe(1);
      expect(results[0].matchType).toBe('matched');
      expect(results[0].confidence).toBe(100);
    });

    it('ékezet nélküli fájlnevet is felismeri', () => {
      const files = [createFile('Kiss Janos.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
      expect(results[0].confidence).toBeGreaterThanOrEqual(50);
    });

    it('fordított névsorrend felismerés', () => {
      const files = [createFile('János Kiss.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
      expect(results[0].matchType).toBe('matched');
    });

    it('aláhúzásos fájlnevet felismeri', () => {
      const files = [createFile('Kiss_Janos.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
    });

    it('kötőjeles fájlnevet felismeri', () => {
      const files = [createFile('Kiss-Janos.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
    });

    it('nem egyező fájlt unmatched-ként jelöli', () => {
      const files = [createFile('random_photo.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].matchType).toBe('unmatched');
      expect(results[0].personId).toBeNull();
      expect(results[0].confidence).toBe(0);
    });

    it('üres fájllistára üres eredményt ad', () => {
      const results = matchFilesToPersons([], [{ id: 1, name: 'Kiss' }]);
      expect(results).toHaveLength(0);
    });

    it('üres személylistára unmatched eredményt ad', () => {
      const files = [createFile('Kiss.jpg')];
      const results = matchFilesToPersons(files, []);
      expect(results).toHaveLength(1);
      expect(results[0].matchType).toBe('unmatched');
    });

    it('több fájlt párosít különböző személyekhez', () => {
      const files = [
        createFile('Kiss János.jpg'),
        createFile('Nagy Péter.jpg'),
      ];
      const persons = [
        { id: 1, name: 'Kiss János' },
        { id: 2, name: 'Nagy Péter' },
      ];
      const results = matchFilesToPersons(files, persons);

      expect(results).toHaveLength(2);
      expect(results[0].personId).toBe(1);
      expect(results[1].personId).toBe(2);
    });

    it('greedy assignment: személyt csak egyszer rendeli hozzá', () => {
      const files = [
        createFile('Kiss János.jpg'),
        createFile('Kiss Janos 2.jpg'),
      ];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      // Az első megkapja az 1-es személyt
      expect(results[0].personId).toBe(1);
      // A második unmatched lesz (mert az 1-es már foglalt)
      expect(results[1].matchType).toBe('unmatched');
    });

    it('fájlnév végén lévő számot levágja', () => {
      const files = [createFile('Kiss János 1.jpg')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
    });

    it('kiterjesztés nélküli fájlnevet is kezeli', () => {
      const files = [createFile('Kiss János')];
      const persons = [{ id: 1, name: 'Kiss János' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
    });

    it('magyar ékezeteket (ő, ű) is kezeli', () => {
      const files = [createFile('Kővári Ödön.jpg')];
      const persons = [{ id: 1, name: 'Kővári Ödön' }];
      const results = matchFilesToPersons(files, persons);

      expect(results[0].personId).toBe(1);
    });
  });
});
