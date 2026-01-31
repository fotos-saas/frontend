import { Injectable, signal } from '@angular/core';

/**
 * PostEditService
 *
 * Hozzászólás szerkesztési állapot kezelése.
 * 15 perces szerkesztési időlimit támogatással.
 */
@Injectable({
  providedIn: 'root'
})
export class PostEditService {
  /** Szerkesztési időlimit milliszekundumban (15 perc) */
  static readonly EDIT_TIME_LIMIT_MS = 15 * 60 * 1000;

  /** Éppen szerkesztett post ID */
  readonly editingPostId = signal<number | null>(null);

  /** Szerkesztés alatt álló tartalom */
  readonly editingContent = signal<string>('');

  /** Szerkesztés küldés folyamatban */
  readonly isSubmitting = signal<boolean>(false);

  /**
   * Szerkesztés indítása
   */
  startEdit(postId: number, content: string): void {
    this.editingPostId.set(postId);
    this.editingContent.set(content);
  }

  /**
   * Szerkesztés megszakítása
   */
  cancelEdit(): void {
    this.editingPostId.set(null);
    this.editingContent.set('');
  }

  /**
   * Szerkesztés befejezése (siker után)
   */
  finishEdit(): void {
    this.editingPostId.set(null);
    this.editingContent.set('');
    this.isSubmitting.set(false);
  }

  /**
   * Szerkesztés tartalom frissítése
   */
  updateContent(content: string): void {
    this.editingContent.set(content);
  }

  /**
   * Küldés állapot beállítása
   */
  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  /**
   * Hátralévő szerkesztési idő számítása
   *
   * @param createdAt - Post létrehozási időpontja (ISO string)
   * @returns Hátralévő idő magyar szöveggel, vagy üres string ha lejárt
   */
  getRemainingEditTime(createdAt: string): string {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const remainingMs = PostEditService.EDIT_TIME_LIMIT_MS - diffMs;

    if (remainingMs <= 0) return '';

    const remainingMins = Math.floor(remainingMs / (1000 * 60));
    const remainingSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);

    if (remainingMins > 0) {
      return `${remainingMins} perc`;
    }
    return `${remainingSecs} másodperc`;
  }

  /**
   * Szerkesztési idő lejárt-e
   *
   * @param createdAt - Post létrehozási időpontja (ISO string)
   * @returns true ha a 15 perces limit lejárt
   */
  isEditTimeExpired(createdAt: string): boolean {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    return diffMs > PostEditService.EDIT_TIME_LIMIT_MS;
  }

  /**
   * Épp ezt a post-ot szerkesztjük-e
   */
  isEditing(postId: number): boolean {
    return this.editingPostId() === postId;
  }
}
