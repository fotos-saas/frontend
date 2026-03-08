import { Injectable } from '@angular/core';

const STORAGE_KEY = 'ps_per_page';
const VALID_OPTIONS = [10, 20, 50, 100, 200];

@Injectable({ providedIn: 'root' })
export class PaginationPreferencesService {
  getPerPage(defaultValue = 20): number {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultValue;
    const num = Number(stored);
    return VALID_OPTIONS.includes(num) ? num : defaultValue;
  }

  setPerPage(value: number): void {
    if (VALID_OPTIONS.includes(value)) {
      sessionStorage.setItem(STORAGE_KEY, String(value));
    }
  }
}
