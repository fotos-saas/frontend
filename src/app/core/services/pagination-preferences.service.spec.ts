import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PaginationPreferencesService } from './pagination-preferences.service';

const STORAGE_KEY = 'ps_per_page';

describe('PaginationPreferencesService', () => {
  let service: PaginationPreferencesService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [PaginationPreferencesService],
    });
    service = TestBed.inject(PaginationPreferencesService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // ============================================================================
  // getPerPage
  // ============================================================================
  describe('getPerPage', () => {
    it('alapértelmezett értéket ad vissza ha nincs mentett adat', () => {
      expect(service.getPerPage()).toBe(20);
    });

    it('egyéni alapértelmezett értéket fogad el', () => {
      expect(service.getPerPage(50)).toBe(50);
    });

    it('visszaadja a mentett érvényes értéket', () => {
      sessionStorage.setItem(STORAGE_KEY, '100');
      expect(service.getPerPage()).toBe(100);
    });

    it('alapértelmezést ad vissza érvénytelen szám esetén', () => {
      sessionStorage.setItem(STORAGE_KEY, '25');
      expect(service.getPerPage()).toBe(20);
    });

    it('alapértelmezést ad vissza nem-szám string esetén', () => {
      sessionStorage.setItem(STORAGE_KEY, 'abc');
      expect(service.getPerPage()).toBe(20);
    });

    it('alapértelmezést ad vissza üres string esetén', () => {
      sessionStorage.setItem(STORAGE_KEY, '');
      expect(service.getPerPage()).toBe(20);
    });

    it('minden érvényes opciót elfogad (10, 20, 50, 100, 200)', () => {
      for (const val of [10, 20, 50, 100, 200]) {
        sessionStorage.setItem(STORAGE_KEY, String(val));
        expect(service.getPerPage()).toBe(val);
      }
    });
  });

  // ============================================================================
  // setPerPage
  // ============================================================================
  describe('setPerPage', () => {
    it('érvényes értéket ment a sessionStorage-ba', () => {
      service.setPerPage(50);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBe('50');
    });

    it('minden érvényes opciót ment (10, 20, 50, 100, 200)', () => {
      for (const val of [10, 20, 50, 100, 200]) {
        service.setPerPage(val);
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe(String(val));
      }
    });

    it('érvénytelen értéket nem ment', () => {
      service.setPerPage(25);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('negatív értéket nem ment', () => {
      service.setPerPage(-10);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('nulla értéket nem ment', () => {
      service.setPerPage(0);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('nem írja felül a meglévő értéket érvénytelen értékkel', () => {
      service.setPerPage(50);
      service.setPerPage(999);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBe('50');
    });
  });

  // ============================================================================
  // getPerPage + setPerPage együtt
  // ============================================================================
  describe('get/set integráció', () => {
    it('setPerPage után getPerPage visszaadja a mentett értéket', () => {
      service.setPerPage(200);
      expect(service.getPerPage()).toBe(200);
    });

    it('érvénytelen setPerPage nem változtatja a getPerPage eredményét', () => {
      service.setPerPage(100);
      service.setPerPage(42);
      expect(service.getPerPage()).toBe(100);
    });
  });
});
