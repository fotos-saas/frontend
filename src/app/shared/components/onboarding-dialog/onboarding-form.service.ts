import { Injectable, signal, computed } from '@angular/core';
import { PersonSearchResult } from '../../../core/models/guest.models';

/** Onboarding lépés */
export type OnboardingStep = 'search' | 'nickname' | 'email';

/** Validációs hibák */
export interface OnboardingErrors {
  search?: string;
  nickname?: string;
  email?: string;
}

/**
 * Onboarding Form Service
 *
 * Validációs és stepper logika az OnboardingDialogComponent-ből kiemelve.
 */
@Injectable()
export class OnboardingFormService {
  /** Aktuális lépés */
  readonly currentStep = signal<OnboardingStep>('search');

  /** Kiválasztott személy */
  readonly selectedPerson = signal<PersonSearchResult | null>(null);

  /** "Nem találom magam" kiválasztva */
  readonly notFoundSelected = signal(false);

  /** Keresési eredmények */
  readonly searchResults = signal<PersonSearchResult[]>([]);

  /** Keresés folyamatban */
  readonly isSearching = signal(false);

  /** Validációs hibák */
  errors: OnboardingErrors = {};

  /** Lépés címek */
  readonly stepTitles: Record<OnboardingStep, string> = {
    search: 'Keresd meg magad!',
    nickname: 'Mi legyen a beceneved?',
    email: 'Email cím'
  };

  /** Lépés leírások */
  readonly stepDescriptions: Record<OnboardingStep, string> = {
    search: 'Írd be a neved és válaszd ki magad a listából, hogy az osztálytársaid felismerjenek.',
    nickname: 'Ezen a néven fogsz megjelenni az appban.',
    email: 'Az email címedre küldünk egy linket, amivel más eszközön is beléphetsz.'
  };

  /** Lépés számozott indexe */
  readonly stepIndex = computed(() => {
    const step = this.currentStep();
    return step === 'search' ? 1 : step === 'nickname' ? 2 : 3;
  });

  /** Van-e kiválasztás (személy vagy "Nem találom") */
  readonly hasSelection = computed(() =>
    this.selectedPerson() !== null || this.notFoundSelected()
  );

  /**
   * Személy kiválasztása a listából
   */
  selectPerson(person: PersonSearchResult): string {
    this.selectedPerson.set(person);
    this.notFoundSelected.set(false);
    this.searchResults.set([]);

    // Becenév előre töltése a keresztnévvel
    return person.name.split(' ').pop() || person.name;
  }

  /**
   * "Nem találom magam" gomb - visszaadja a becenév javaslatot
   */
  selectNotFound(searchQuery: string): string {
    this.selectedPerson.set(null);
    this.notFoundSelected.set(true);
    this.searchResults.set([]);
    return searchQuery;
  }

  /**
   * Keresési input változáskor töröljük a kiválasztást
   */
  clearSelection(): void {
    this.errors = {};
    if (this.selectedPerson()) {
      this.selectedPerson.set(null);
    }
    this.notFoundSelected.set(false);
  }

  /**
   * Hibák törlése (template-ből hívható)
   */
  clearErrors(): void {
    this.errors = {};
  }

  /**
   * Következő lépésre váltás (ha valid)
   * @returns true ha sikerült továbblépni
   */
  goToNextStep(searchQuery: string, nickname: string): boolean {
    const step = this.currentStep();

    if (step === 'search') {
      if (!this.validateSearch(searchQuery, nickname)) return false;
      this.currentStep.set('nickname');
      return true;
    } else if (step === 'nickname') {
      if (!this.validateNickname(nickname)) return false;
      this.currentStep.set('email');
      return true;
    }
    return false;
  }

  /**
   * Előző lépésre vissza
   */
  goToPrevStep(): void {
    const step = this.currentStep();

    if (step === 'nickname') {
      this.currentStep.set('search');
    } else if (step === 'email') {
      this.currentStep.set('nickname');
    }
  }

  /**
   * Keresés validálása
   * @returns [isValid, updatedNickname]
   */
  validateSearch(searchQuery: string, currentNickname: string): boolean {
    this.errors = {};

    if (!this.selectedPerson() && !this.notFoundSelected()) {
      if (searchQuery.trim().length < 2) {
        this.errors.search = 'Írd be a neved a kereséshez!';
        return false;
      }
      // Ha van keresési szöveg de nincs kiválasztás, automatikusan "Nem találom"
      this.notFoundSelected.set(true);
    }

    return true;
  }

  /**
   * Becenév validálása
   */
  validateNickname(nickname: string): boolean {
    this.errors = {};
    const trimmed = nickname.trim();

    if (!trimmed) {
      this.errors.nickname = 'Add meg a beceneved!';
      return false;
    }

    if (trimmed.length < 2) {
      this.errors.nickname = 'A becenév legalább 2 karakter legyen.';
      return false;
    }

    if (trimmed.length > 100) {
      this.errors.nickname = 'A becenév maximum 100 karakter lehet.';
      return false;
    }

    return true;
  }

  /**
   * Email validálása (KÖTELEZŐ)
   */
  validateEmail(email: string): boolean {
    this.errors = {};
    const trimmed = email.trim();

    // Email kötelező
    if (!trimmed) {
      this.errors.email = 'Az email cím megadása kötelező.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      this.errors.email = 'Érvénytelen email cím.';
      return false;
    }

    return true;
  }

  /**
   * Form érvényes-e az aktuális lépésben
   */
  isStepValid(searchQuery: string, nickname: string, email?: string): boolean {
    const step = this.currentStep();
    switch (step) {
      case 'search':
        return this.hasSelection() || searchQuery.trim().length >= 2;
      case 'nickname':
        return nickname.trim().length >= 2;
      case 'email':
        // Email kötelező - legalább validnak kell lennie
        if (!email) return false;
        const trimmed = email.trim();
        if (!trimmed) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed);
    }
  }

  /**
   * Tovább gomb szöveg
   */
  getNextButtonText(isSubmitting: boolean): string {
    const step = this.currentStep();
    if (step === 'email') {
      return isSubmitting ? 'Regisztráció...' : 'Kész!';
    }
    return 'Tovább';
  }

  /**
   * Reset
   */
  reset(): void {
    this.currentStep.set('search');
    this.selectedPerson.set(null);
    this.notFoundSelected.set(false);
    this.searchResults.set([]);
    this.isSearching.set(false);
    this.errors = {};
  }
}
