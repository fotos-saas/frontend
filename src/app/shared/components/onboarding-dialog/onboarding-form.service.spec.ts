import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OnboardingFormService } from './onboarding-form.service';
import type { PersonSearchResult } from '../../../core/models/guest.models';

describe('OnboardingFormService', () => {
  let service: OnboardingFormService;

  const mockPerson: PersonSearchResult = {
    id: 1,
    name: 'Kiss Janos',
    type: 'student',
    hasPhoto: true,
    photoThumbUrl: '/thumb.jpg',
  } as PersonSearchResult;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OnboardingFormService],
    });
    service = TestBed.inject(OnboardingFormService);
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('currentStep "search"', () => {
      expect(service.currentStep()).toBe('search');
    });

    it('selectedPerson null', () => {
      expect(service.selectedPerson()).toBeNull();
    });

    it('notFoundSelected false', () => {
      expect(service.notFoundSelected()).toBe(false);
    });

    it('searchResults ures tomb', () => {
      expect(service.searchResults()).toEqual([]);
    });

    it('isSearching false', () => {
      expect(service.isSearching()).toBe(false);
    });

    it('errors ures objektum', () => {
      expect(service.errors).toEqual({});
    });
  });

  // ============================================================================
  // computed-ok
  // ============================================================================
  describe('computed-ok', () => {
    it('stepIndex 1 a search lepesnel', () => {
      expect(service.stepIndex()).toBe(1);
    });

    it('stepIndex 2 a nickname lepesnel', () => {
      service.currentStep.set('nickname');
      expect(service.stepIndex()).toBe(2);
    });

    it('stepIndex 3 az email lepesnel', () => {
      service.currentStep.set('email');
      expect(service.stepIndex()).toBe(3);
    });

    it('hasSelection false ha nincs kivalasztas', () => {
      expect(service.hasSelection()).toBe(false);
    });

    it('hasSelection true ha van selectedPerson', () => {
      service.selectedPerson.set(mockPerson);
      expect(service.hasSelection()).toBe(true);
    });

    it('hasSelection true ha notFoundSelected', () => {
      service.notFoundSelected.set(true);
      expect(service.hasSelection()).toBe(true);
    });
  });

  // ============================================================================
  // selectPerson()
  // ============================================================================
  describe('selectPerson()', () => {
    it('beallitja a kivalasztott szemelyt', () => {
      service.selectPerson(mockPerson);
      expect(service.selectedPerson()).toEqual(mockPerson);
    });

    it('notFoundSelected false-ra allit', () => {
      service.notFoundSelected.set(true);
      service.selectPerson(mockPerson);
      expect(service.notFoundSelected()).toBe(false);
    });

    it('torli a keresesi eredmenyeket', () => {
      service.searchResults.set([mockPerson]);
      service.selectPerson(mockPerson);
      expect(service.searchResults()).toEqual([]);
    });

    it('visszaadja a keresztnevet becenev javaslatnak', () => {
      const result = service.selectPerson(mockPerson);
      expect(result).toBe('Janos');
    });

    it('egytagunev eseten a teljes nevet adja vissza', () => {
      const singleName = { ...mockPerson, name: 'Madonna' };
      const result = service.selectPerson(singleName as PersonSearchResult);
      expect(result).toBe('Madonna');
    });
  });

  // ============================================================================
  // selectNotFound()
  // ============================================================================
  describe('selectNotFound()', () => {
    it('selectedPerson null-ra allit', () => {
      service.selectedPerson.set(mockPerson);
      service.selectNotFound('teszt');
      expect(service.selectedPerson()).toBeNull();
    });

    it('notFoundSelected true-ra allit', () => {
      service.selectNotFound('teszt');
      expect(service.notFoundSelected()).toBe(true);
    });

    it('torli a keresesi eredmenyeket', () => {
      service.searchResults.set([mockPerson]);
      service.selectNotFound('teszt');
      expect(service.searchResults()).toEqual([]);
    });

    it('visszaadja a keresesi szoveget', () => {
      const result = service.selectNotFound('Janos');
      expect(result).toBe('Janos');
    });
  });

  // ============================================================================
  // clearSelection()
  // ============================================================================
  describe('clearSelection()', () => {
    it('torli az errors-t', () => {
      service.errors = { search: 'hiba' };
      service.clearSelection();
      expect(service.errors).toEqual({});
    });

    it('torli a selectedPerson-t ha volt', () => {
      service.selectedPerson.set(mockPerson);
      service.clearSelection();
      expect(service.selectedPerson()).toBeNull();
    });

    it('torli a notFoundSelected-et', () => {
      service.notFoundSelected.set(true);
      service.clearSelection();
      expect(service.notFoundSelected()).toBe(false);
    });
  });

  // ============================================================================
  // clearErrors()
  // ============================================================================
  describe('clearErrors()', () => {
    it('ures objektumra allitja az errors-t', () => {
      service.errors = { nickname: 'hiba' };
      service.clearErrors();
      expect(service.errors).toEqual({});
    });
  });

  // ============================================================================
  // goToNextStep()
  // ============================================================================
  describe('goToNextStep()', () => {
    it('search -> nickname ha valid a kivalasztas', () => {
      service.selectedPerson.set(mockPerson);
      const result = service.goToNextStep('Kiss', 'Janos');
      expect(result).toBe(true);
      expect(service.currentStep()).toBe('nickname');
    });

    it('search -> false ha nincs kivalasztas es rovid query', () => {
      const result = service.goToNextStep('K', 'Janos');
      expect(result).toBe(false);
      expect(service.currentStep()).toBe('search');
    });

    it('search: automatikusan "nem talalom" ha van keresesi szoveg de nincs kivalasztas', () => {
      const result = service.goToNextStep('Kiss Janos', 'Janos');
      expect(result).toBe(true);
      expect(service.notFoundSelected()).toBe(true);
      expect(service.currentStep()).toBe('nickname');
    });

    it('nickname -> email ha valid becenev', () => {
      service.currentStep.set('nickname');
      const result = service.goToNextStep('', 'Jancsi');
      expect(result).toBe(true);
      expect(service.currentStep()).toBe('email');
    });

    it('nickname -> false ha ures becenev', () => {
      service.currentStep.set('nickname');
      const result = service.goToNextStep('', '');
      expect(result).toBe(false);
      expect(service.currentStep()).toBe('nickname');
    });

    it('email lepesnel false-t ad vissza (nincs tovabb)', () => {
      service.currentStep.set('email');
      const result = service.goToNextStep('', 'Jancsi');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // goToPrevStep()
  // ============================================================================
  describe('goToPrevStep()', () => {
    it('nickname -> search', () => {
      service.currentStep.set('nickname');
      service.goToPrevStep();
      expect(service.currentStep()).toBe('search');
    });

    it('email -> nickname', () => {
      service.currentStep.set('email');
      service.goToPrevStep();
      expect(service.currentStep()).toBe('nickname');
    });

    it('search lepesnel nem valtozik', () => {
      service.goToPrevStep();
      expect(service.currentStep()).toBe('search');
    });
  });

  // ============================================================================
  // validateSearch()
  // ============================================================================
  describe('validateSearch()', () => {
    it('false ha nincs kivalasztas es rovid query', () => {
      const result = service.validateSearch('K', 'nick');
      expect(result).toBe(false);
      expect(service.errors.search).toBeDefined();
    });

    it('true ha van selectedPerson', () => {
      service.selectedPerson.set(mockPerson);
      const result = service.validateSearch('', 'nick');
      expect(result).toBe(true);
    });

    it('true ha notFoundSelected', () => {
      service.notFoundSelected.set(true);
      const result = service.validateSearch('', 'nick');
      expect(result).toBe(true);
    });

    it('automatikusan notFoundSelected-et allit ha van eleg hosszu query', () => {
      const result = service.validateSearch('Kiss Janos', 'nick');
      expect(result).toBe(true);
      expect(service.notFoundSelected()).toBe(true);
    });
  });

  // ============================================================================
  // validateNickname()
  // ============================================================================
  describe('validateNickname()', () => {
    it('false ha ures', () => {
      expect(service.validateNickname('')).toBe(false);
      expect(service.errors.nickname).toBe('Add meg a beceneved!');
    });

    it('false ha 1 karakter', () => {
      expect(service.validateNickname('A')).toBe(false);
      expect(service.errors.nickname).toContain('legalább 2');
    });

    it('false ha tul hosszu', () => {
      expect(service.validateNickname('A'.repeat(101))).toBe(false);
      expect(service.errors.nickname).toContain('maximum 100');
    });

    it('true ha valid', () => {
      expect(service.validateNickname('Jancsi')).toBe(true);
      expect(service.errors.nickname).toBeUndefined();
    });
  });

  // ============================================================================
  // validateEmail()
  // ============================================================================
  describe('validateEmail()', () => {
    it('false ha ures', () => {
      expect(service.validateEmail('')).toBe(false);
      expect(service.errors.email).toContain('kötelező');
    });

    it('false ha ervenytelen', () => {
      expect(service.validateEmail('nemvalid')).toBe(false);
      expect(service.errors.email).toContain('Érvénytelen');
    });

    it('true ha valid', () => {
      expect(service.validateEmail('test@example.com')).toBe(true);
      expect(service.errors.email).toBeUndefined();
    });
  });

  // ============================================================================
  // isStepValid()
  // ============================================================================
  describe('isStepValid()', () => {
    it('search: true ha van kivalasztas', () => {
      service.selectedPerson.set(mockPerson);
      expect(service.isStepValid('', '')).toBe(true);
    });

    it('search: true ha eleg hosszu query', () => {
      expect(service.isStepValid('Ki', '')).toBe(true);
    });

    it('search: false ha rovid query es nincs kivalasztas', () => {
      expect(service.isStepValid('K', '')).toBe(false);
    });

    it('nickname: true ha eleg hosszu', () => {
      service.currentStep.set('nickname');
      expect(service.isStepValid('', 'Jancsi')).toBe(true);
    });

    it('nickname: false ha rovid', () => {
      service.currentStep.set('nickname');
      expect(service.isStepValid('', 'J')).toBe(false);
    });

    it('email: true ha valid email', () => {
      service.currentStep.set('email');
      expect(service.isStepValid('', '', 'test@example.com')).toBe(true);
    });

    it('email: false ha nincs email', () => {
      service.currentStep.set('email');
      expect(service.isStepValid('', '')).toBe(false);
    });

    it('email: false ha ervenytelen email', () => {
      service.currentStep.set('email');
      expect(service.isStepValid('', '', 'invalid')).toBe(false);
    });
  });

  // ============================================================================
  // getNextButtonText()
  // ============================================================================
  describe('getNextButtonText()', () => {
    it('"Tovabb" search lepesnel', () => {
      expect(service.getNextButtonText(false)).toBe('Tovább');
    });

    it('"Tovabb" nickname lepesnel', () => {
      service.currentStep.set('nickname');
      expect(service.getNextButtonText(false)).toBe('Tovább');
    });

    it('"Kesz!" email lepesnel', () => {
      service.currentStep.set('email');
      expect(service.getNextButtonText(false)).toBe('Kész!');
    });

    it('"Regisztracio..." email lepesnel ha submitting', () => {
      service.currentStep.set('email');
      expect(service.getNextButtonText(true)).toBe('Regisztráció...');
    });
  });

  // ============================================================================
  // reset()
  // ============================================================================
  describe('reset()', () => {
    it('minden allapotot visszaallit', () => {
      service.currentStep.set('email');
      service.selectedPerson.set(mockPerson);
      service.notFoundSelected.set(true);
      service.searchResults.set([mockPerson]);
      service.isSearching.set(true);
      service.errors = { search: 'hiba' };

      service.reset();

      expect(service.currentStep()).toBe('search');
      expect(service.selectedPerson()).toBeNull();
      expect(service.notFoundSelected()).toBe(false);
      expect(service.searchResults()).toEqual([]);
      expect(service.isSearching()).toBe(false);
      expect(service.errors).toEqual({});
    });
  });
});
