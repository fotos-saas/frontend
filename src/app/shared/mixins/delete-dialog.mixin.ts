import { signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ConfirmDialogResult } from '../components/confirm-dialog/confirm-dialog.component';

/**
 * DeleteDialogMixin
 *
 * Közös törlés dialógus logika a komponensekhez.
 * Használat: forum-detail, newsfeed-list
 *
 * @example
 * class MyComponent<T extends { id: number }> {
 *   private deleteMixin = new DeleteDialogMixin<T>(this.destroyRef);
 *
 *   // Template-ben:
 *   // @if (deleteMixin.showDialog() && deleteMixin.itemToDelete()) {
 *   //   <app-confirm-dialog ... [isSubmitting]="deleteMixin.isDeleting()" (result)="onDeleteResult($event)" />
 *   // }
 *
 *   onDeleteClick(item: T) { this.deleteMixin.requestDelete(item); }
 *   onDeleteResult(result: ConfirmDialogResult) {
 *     this.deleteMixin.handleResult(result, (item) => this.service.delete(item.id), () => this.loadData());
 *   }
 * }
 */
export class DeleteDialogMixin<T> {
  /** Dialógus megjelenítése */
  readonly showDialog = signal<boolean>(false);

  /** Törlendő elem */
  readonly itemToDelete = signal<T | null>(null);

  /** Törlés folyamatban */
  readonly isDeleting = signal<boolean>(false);

  constructor(private destroyRef: DestroyRef) {}

  /**
   * Törlés kérés - dialógus megnyitása
   */
  requestDelete(item: T): void {
    this.itemToDelete.set(item);
    this.showDialog.set(true);
  }

  /**
   * Dialógus eredmény kezelése
   *
   * @param result A dialógus eredménye
   * @param deleteAction A törlést végrehajtó Observable factory
   * @param onSuccess Sikeres törlés utáni callback
   * @param onError Hiba esetén callback
   */
  handleResult(
    result: ConfirmDialogResult,
    deleteAction: (item: T) => Observable<unknown>,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ): void {
    if (result.action === 'cancel') {
      this.closeDialog();
      return;
    }

    const item = this.itemToDelete();
    if (!item) return;

    this.isDeleting.set(true);

    deleteAction(item)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDialog();
          this.isDeleting.set(false);
          onSuccess?.();
        },
        error: (err) => {
          this.closeDialog();
          this.isDeleting.set(false);
          onError?.(err);
        }
      });
  }

  /**
   * Dialógus bezárása
   */
  closeDialog(): void {
    this.showDialog.set(false);
    this.itemToDelete.set(null);
  }
}
