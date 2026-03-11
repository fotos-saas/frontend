import { Component, ChangeDetectionStrategy, inject, output, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PrintShopConnectionService, AvailablePrintShop } from '../../../../services/print-shop-connection.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

/**
 * PrintShopSearchDialogComponent
 *
 * Nyomda keresés és kapcsolódási kérelem küldés dialógus.
 * - Debounced keresés
 * - Találati lista
 * - Kérelem küldése
 */
@Component({
  selector: 'app-print-shop-search-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, DialogWrapperComponent],
  templateUrl: './print-shop-search-dialog.component.html',
  styleUrls: ['./print-shop-search-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopSearchDialogComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly connectionService = inject(PrintShopConnectionService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  protected readonly ICONS = ICONS;

  /** Dialógus bezárása */
  close = output<void>();

  /** Sikeres kapcsolódási kérelem (újratöltés szükséges) */
  connectionSent = output<void>();

  /** Keresési szöveg */
  searchTerm = signal('');

  /** Keresés eredményei */
  results = signal<AvailablePrintShop[]>([]);

  /** Keresés folyamatban */
  isSearching = signal(false);

  /** Kérelem küldés folyamatban (adott print shop ID) */
  sendingId = signal<number | null>(null);

  /** Keresés volt-e már */
  hasSearched = signal(false);

  /** Keresés subject debounce-hoz */
  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.isSearching.set(true);
          this.hasSearched.set(true);
        }),
        switchMap(term =>
          this.connectionService.searchAvailablePrintShops(term).pipe(
            catchError(err => {
              this.logger.error('Nyomda keresés hiba:', err);
              this.toastService.error('Hiba', 'Nem sikerült keresni a nyomdákat.');
              this.isSearching.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.results.set(response.data);
          this.isSearching.set(false);
        }
      });
  }

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
    if (term.trim().length >= 2) {
      this.searchSubject.next(term.trim());
    } else {
      this.results.set([]);
      this.hasSearched.set(false);
    }
  }

  sendRequest(printShop: AvailablePrintShop): void {
    this.sendingId.set(printShop.id);
    this.connectionService.sendConnectionRequest(printShop.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.toastService.success('Siker', response.message);
          this.sendingId.set(null);
          // Eltávolítjuk a listából
          this.results.update(list => list.filter(ps => ps.id !== printShop.id));
          this.connectionSent.emit();
        },
        error: (err) => {
          this.logger.error('Kapcsolódási kérelem hiba:', err);
          const message = err.error?.message || 'Nem sikerült elküldeni a kérelmet.';
          this.toastService.error('Hiba', message);
          this.sendingId.set(null);
        }
      });
  }
}
