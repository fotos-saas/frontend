import { describe, it, expect, vi } from 'vitest';
import { handleHttpError, handleVotingError, handleAuthError, handleClientError } from './http-error.util';

describe('http-error.util', () => {

  // ============================================================================
  // handleHttpError
  // ============================================================================
  describe('handleHttpError', () => {
    it('error.message-t használja ha van', () => {
      const error = { status: 500, error: { message: 'Szerver hiba' } };
      expect(handleHttpError(error).message).toBe('Szerver hiba');
    });

    it('401 → jogosultság hibaüzenet', () => {
      const error = { status: 401 };
      expect(handleHttpError(error).message).toBe('Nincs jogosultságod ehhez a művelethez');
    });

    it('403 → hozzáférés megtagadva', () => {
      const error = { status: 403 };
      expect(handleHttpError(error).message).toBe('A hozzáférés megtagadva');
    });

    it('404 → alapértelmezett üzenet', () => {
      const error = { status: 404 };
      expect(handleHttpError(error).message).toBe('A keresett elem nem található');
    });

    it('404 → egyedi notFoundMessage', () => {
      const error = { status: 404 };
      const result = handleHttpError(error, { notFoundMessage: 'Projekt nem található' });
      expect(result.message).toBe('Projekt nem található');
    });

    it('422 → érvénytelen adatok', () => {
      const error = { status: 422 };
      expect(handleHttpError(error).message).toBe('Érvénytelen adatok');
    });

    it('429 → túl sok kérés', () => {
      const error = { status: 429 };
      expect(handleHttpError(error).message).toBe('Túl sok kérés, kérlek várj egy kicsit');
    });

    it('ismeretlen status → alapértelmezett üzenet', () => {
      const error = { status: 502 };
      expect(handleHttpError(error).message).toBe('Ismeretlen hiba történt');
    });

    it('Error objektumot ad vissza', () => {
      const error = { status: 500 };
      expect(handleHttpError(error)).toBeInstanceOf(Error);
    });
  });

  // ============================================================================
  // handleVotingError
  // ============================================================================
  describe('handleVotingError', () => {
    it('error.message-t használja ha van', () => {
      const error = { error: { message: 'Egyedi hiba' } };
      expect(handleVotingError(error).message).toBe('Egyedi hiba');
    });

    it('status 0 → nincs internet', () => {
      const error = { status: 0 };
      expect(handleVotingError(error).message).toBe('Nincs internetkapcsolat.');
    });

    it('422 + requires_class_size → osztálylétszám hiba', () => {
      const error = { status: 422, error: { requires_class_size: true } };
      expect(handleVotingError(error).message).toBe('Először állítsd be az osztálylétszámot!');
    });

    it('ismeretlen hiba → generic retry', () => {
      const error = { status: 500 };
      expect(handleVotingError(error).message).toContain('Hiba történt');
    });

    it('Error objektumot ad vissza', () => {
      expect(handleVotingError({ status: 500 })).toBeInstanceOf(Error);
    });
  });

  // ============================================================================
  // handleAuthError
  // ============================================================================
  describe('handleAuthError', () => {
    it('ErrorEvent → hálózati hiba', () => {
      const error = { error: new ErrorEvent('network error') };
      const result = handleAuthError(error, {});
      expect(result.message).toBe('Hálózati hiba. Ellenőrizd az internetkapcsolatot.');
    });

    it('error.message-t használja ha van', () => {
      const error = { status: 400, error: { message: 'Hibás adatok' } };
      const result = handleAuthError(error, { 400: 'Más üzenet' });
      expect(result.message).toBe('Hibás adatok');
    });

    it('statusMessages mapping-et használja', () => {
      const error = { status: 401 };
      const result = handleAuthError(error, { 401: 'Érvénytelen jelszó' });
      expect(result.message).toBe('Érvénytelen jelszó');
    });

    it('fallbackMessage-et használja ha nincs match', () => {
      const error = { status: 999 };
      const result = handleAuthError(error, {}, 'Egyedi fallback');
      expect(result.message).toBe('Egyedi fallback');
    });

    it('alapértelmezett fallback', () => {
      const error = { status: 999 };
      const result = handleAuthError(error, {});
      expect(result.message).toBe('Hiba történt');
    });
  });

  // ============================================================================
  // handleClientError
  // ============================================================================
  describe('handleClientError', () => {
    it('401 + onUnauthorized callback → meghívja és lejárt üzenetet ad', () => {
      const onUnauthorized = vi.fn();
      const error = { status: 401 };
      const result = handleClientError(error, onUnauthorized);

      expect(onUnauthorized).toHaveBeenCalled();
      expect(result.message).toContain('munkamenet lejárt');
    });

    it('401 onUnauthorized nélkül → nem hívja', () => {
      const error = { status: 401, error: { message: 'Unauthorized' } };
      const result = handleClientError(error);
      expect(result.message).toBe('Unauthorized');
    });

    it('error.message-t használja', () => {
      const error = { status: 400, error: { message: 'Hibás kérés' } };
      expect(handleClientError(error).message).toBe('Hibás kérés');
    });

    it('error.message nélkül → generic retry polite', () => {
      const error = { status: 500 };
      expect(handleClientError(error).message).toContain('Hiba történt');
    });
  });
});
