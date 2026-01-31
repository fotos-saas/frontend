import { Component, ChangeDetectionStrategy, computed, input, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissingUser } from '../../../core/models/poke.models';

/**
 * Missing User Card Component
 *
 * Egy hiányzó felhasználó kártyája bökés gombbal.
 */
@Component({
  selector: 'app-missing-user-card',
  imports: [CommonModule],
  templateUrl: './missing-user-card.component.html',
  styleUrls: ['./missing-user-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingUserCardComponent {
  /** User input signal */
  readonly user = input.required<MissingUser>();

  /** Sikeres bökés jelzése - átmeneti állapot */
  readonly justPoked = signal<boolean>(false);

  readonly poke = output<MissingUser>();
  readonly pokeClick = output<MissingUser>();

  /**
   * Initials generálása - computed signal
   */
  readonly initials = computed(() => {
    const parts = this.user().name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return this.user().name.substring(0, 2).toUpperCase();
  });

  /**
   * Bökés státusz tooltip - computed signal
   */
  readonly pokeTooltip = computed(() => {
    if (this.user().pokeStatus.canPoke) {
      return 'bökj rá!';
    }
    return this.user().pokeStatus.reasonHu || 'nem bökhető';
  });

  /**
   * Bökés számláló szöveg - computed signal
   */
  readonly pokeCountText = computed(() => {
    const sent = this.user().pokeStatus.totalPokesSent;
    const max = this.user().pokeStatus.maxPokes;
    if (sent !== undefined && max !== undefined && sent > 0) {
      return `${sent}/${max}`;
    }
    return null;
  });

  /**
   * Bökés gomb kattintás
   */
  onPokeClick(): void {
    if (this.user().pokeStatus.canPoke) {
      this.poke.emit(this.user());
      this.pokeClick.emit(this.user());
    }
  }

  /**
   * Sikeres bökés jelölése - parent komponensből hívható
   * 2 másodperc után automatikusan visszaáll
   */
  markAsPoked(): void {
    this.justPoked.set(true);
    setTimeout(() => this.justPoked.set(false), 2000);
  }
}
