import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { PokeService } from '../../../core/services/poke.service';
import { Poke } from '../../../core/models/poke.models';
import { DateUtilsService } from '../../services/date-utils.service';

/** Kategória címkék */
const CATEGORY_LABELS: Record<string, string> = {
  voting: 'Szavazás',
  photoshoot: 'Fotózás',
  image_selection: 'Képválasztás',
  general: 'Általános'
};

/**
 * Poke Detail Dialog Component
 *
 * Egy bökés részleteinek megjelenítése dialógusban.
 * Értesítésből kattintáskor jelenik meg.
 */
@Component({
  selector: 'app-poke-detail-dialog',
  standalone: true,
  imports: [],
  templateUrl: './poke-detail-dialog.component.html',
  styleUrl: './poke-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeDetailDialogComponent extends BaseDialogComponent implements OnInit {
  private readonly pokeService = inject(PokeService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Bökés ID (értesítésből jön) */
  readonly pokeId = input.required<number>();

  /** Bezárás event */
  readonly closed = output<void>();

  /** Betöltött bökés */
  readonly poke = signal<Poke | null>(null);

  /** Betöltés állapot */
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadPoke();
  }

  /**
   * Bökés betöltése
   * Először a sent pokes-ből próbáljuk, ha nincs, a received-ből
   */
  private loadPoke(): void {
    const id = this.pokeId();

    // Keresés a küldött bökések között
    const sentPoke = this.pokeService.sentPokes().find(p => p.id === id);
    if (sentPoke) {
      this.poke.set(sentPoke);
      this.loading.set(false);
      return;
    }

    // Keresés a kapott bökések között
    const receivedPoke = this.pokeService.receivedPokes().find(p => p.id === id);
    if (receivedPoke) {
      this.poke.set(receivedPoke);
      this.loading.set(false);
      return;
    }

    // Ha nincs meg, frissítsük a listákat
    this.pokeService.loadSentPokes().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        const poke = this.pokeService.sentPokes().find(p => p.id === id);
        this.poke.set(poke || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateStr: string): string {
    return this.dateUtils.getRelativeTime(dateStr);
  }

  protected onSubmit(): void {
    // Nincs submit
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
