import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Workflow Security Service
 *
 * Felelősség: IDOR védelem (Insecure Direct Object Reference)
 *
 * Ellenőrzi, hogy a felhasználó jogosult-e az adott galériához
 * és szűri a hibás fotó ID-ket.
 *
 * FONTOS: Minden gallery ID és photo ID validáció itt történik!
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowSecurityService {
  private readonly authService = inject(AuthService);

  /**
   * Gallery ID validáció - IDOR védelem
   *
   * Ellenőrzi, hogy a galleryId megegyezik-e az AuthService-ből
   * kapott projekt tabloGalleryId-jával.
   *
   * @param galleryId A validálandó galéria ID
   * @throws Error - Jogosultsági hiba esetén (frontend védelmi réteg)
   *
   * PÉLDA:
   * ```typescript
   * try {
   *   this.securityService.validateGalleryAccess(123);
   * } catch (error) {
   *   console.error('Jogosultsági hiba:', error.message);
   * }
   * ```
   */
  validateGalleryAccess(galleryId: number): void {
    const project = this.authService.getProject();

    if (!project) {
      throw new Error('Nincs bejelentkezett projekt. Kérlek jelentkezz be újra!');
    }

    const authorizedGalleryId = project.tabloGalleryId;

    if (!authorizedGalleryId) {
      throw new Error('A projekthez nincs hozzárendelt galéria.');
    }

    if (galleryId !== authorizedGalleryId) {
      throw new Error('Nincs jogosultságod ehhez a galériához.');
    }
  }

  /**
   * Photo ID-k validálása és tisztítása - IDOR védelem
   *
   * Szűri a negatív, NaN és duplikált ID-ket.
   * Csak pozitív integer értékeket enged át.
   *
   * @param photoIds A validálandó fotó ID-k (lehet szennyezett FormData)
   * @returns Tisztított és deduplikált fotó ID tömb
   *
   * PÉLDA:
   * ```typescript
   * const rawIds = ['1', '2', 'invalid', '-1', '2']; // FormData stringek
   * const cleanIds = this.securityService.sanitizePhotoIds(rawIds);
   * // cleanIds = [1, 2]
   * ```
   */
  sanitizePhotoIds(photoIds: number[]): number[] {
    if (!Array.isArray(photoIds)) {
      return [];
    }

    // Negatív ID-k, NaN értékek szűrése és deduplikáció
    const validIds = photoIds
      .filter(id => typeof id === 'number' && id > 0 && !isNaN(id))
      .filter((id, index, self) => self.indexOf(id) === index); // deduplikáció

    return validIds;
  }

  /**
   * Single photo ID validálása
   * @param photoId A validálandó fotó ID
   * @returns true ha valid (pozitív integer), false egyébként
   */
  isValidPhotoId(photoId: number): boolean {
    return typeof photoId === 'number' && photoId > 0 && !isNaN(photoId);
  }
}
