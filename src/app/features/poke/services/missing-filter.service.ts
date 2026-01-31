import { Injectable, signal, computed } from '@angular/core';
import { MissingUser, MissingCategory } from '../../../core/models/poke.models';

/** Szűrő típusok */
export type PersonTab = 'student' | 'teacher';
export type CategoryTab = 'photoshoot' | 'voting' | 'image_selection';

/**
 * Missing Filter Service
 *
 * Hiányzó felhasználók szűrési logikáját kezeli.
 * Kiemelve a MissingPageComponent-ből a 300 soros limit miatt.
 */
@Injectable()
export class MissingFilterService {
  /** Keresési kifejezés */
  readonly searchQuery = signal<string>('');

  /** Személy tab (diák/tanár) - csak fotózásnál releváns */
  readonly personTab = signal<PersonTab>('student');

  /** Aktív kategória tab */
  readonly activeCategory = signal<CategoryTab>('photoshoot');

  /** Van aktív szűrő? (csak keresés) */
  readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim() !== ''
  );

  /** Person tabs látható-e (csak fotózásnál) */
  readonly showPersonTabs = computed(() =>
    this.activeCategory() === 'photoshoot'
  );

  /**
   * Kategória váltás
   */
  setCategory(category: CategoryTab): void {
    this.activeCategory.set(category);
    // Ha nem fotózás, alaphelyzetbe állítjuk a person tabot
    if (category !== 'photoshoot') {
      this.personTab.set('student');
    }
  }

  /**
   * Személy tab váltás
   */
  setPersonTab(tab: PersonTab): void {
    this.personTab.set(tab);
  }

  /**
   * Keresés törlése
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * Összes szűrő törlése
   */
  clearAllFilters(): void {
    this.searchQuery.set('');
  }

  /**
   * Aktív kategória adatainak lekérdezése
   */
  getActiveCategoryData(categories: {
    voting: MissingCategory | null;
    photoshoot: MissingCategory | null;
    image_selection: MissingCategory | null;
  }): MissingCategory | null {
    switch (this.activeCategory()) {
      case 'photoshoot':
        return categories.photoshoot ?? null;
      case 'voting':
        return categories.voting ?? null;
      case 'image_selection':
        return categories.image_selection ?? null;
      default:
        return null;
    }
  }

  /**
   * Felhasználók szűrése
   */
  filterUsers(data: MissingCategory | null): MissingUser[] {
    if (!data) return [];

    let users = [...data.users];

    // Keresés
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(query)
      );
    }

    // Személy tab szűrés (csak fotózásnál)
    if (this.activeCategory() === 'photoshoot') {
      users = users.filter(u => u.type === this.personTab());
    }

    return users;
  }

  /**
   * Diákok száma a megadott kategóriában
   */
  getStudentCount(photoshootData: MissingCategory | null): number {
    if (!photoshootData) return 0;
    return photoshootData.users.filter(u => u.type === 'student').length;
  }

  /**
   * Tanárok száma a megadott kategóriában
   */
  getTeacherCount(photoshootData: MissingCategory | null): number {
    if (!photoshootData) return 0;
    return photoshootData.users.filter(u => u.type === 'teacher').length;
  }
}
