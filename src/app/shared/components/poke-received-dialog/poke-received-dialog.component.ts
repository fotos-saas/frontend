import {
  Component,
  output,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  AfterViewInit,
  OnDestroy,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PokeService } from '../../../core/services/poke.service';
import { DateUtilsService } from '../../services/date-utils.service';
import { POKE_REACTIONS, PokeReaction, Poke } from '../../../core/models/poke.models';
import { createBackdropHandler } from '../../utils/dialog.util';

/**
 * Poke Received Dialog Component
 *
 * Kapott bökések megjelenítése dialógusban.
 * Signal-based, glassmorphism design.
 *
 * Funkciók:
 * - Kapott bökések listázása
 * - Olvasatlan/olvasott megkülönböztetés
 * - Automatikus mark as read megnyitáskor
 * - Reakció küldés lehetőség
 * - Empty state kezelés
 */
@Component({
  selector: 'app-poke-received-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poke-received-dialog.component.html',
  styleUrls: ['./poke-received-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeReceivedDialogComponent implements AfterViewInit, OnDestroy {
  private readonly pokeService = inject(PokeService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal-based outputs */
  readonly closedEvent = output<void>();

  // Pokes from service
  readonly pokes = this.pokeService.receivedPokes;
  readonly unreadCount = this.pokeService.unreadCount;

  // Available reactions
  readonly reactions = POKE_REACTIONS;

  // Currently expanded poke for reaction picker
  readonly expandedPokeId = signal<number | null>(null);

  // Loading state for reaction
  readonly sendingReactionFor = signal<number | null>(null);

  /** Backdrop handler - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  readonly backdropHandler = createBackdropHandler(() => this.close());

  // Computed subtitle
  readonly subtitle = computed(() => {
    const count = this.pokes().length;
    const unread = this.unreadCount();
    if (count === 0) return 'Még nem érkezett bökés';
    if (unread > 0) return `${unread} új bökés`;
    return `${count} bökés összesen`;
  });

  ngAfterViewInit(): void {
    // Mark all as read when dialog opens
    if (this.unreadCount() > 0) {
      this.pokeService.markAllAsRead().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    }
    // Body scroll lock
    document.body.classList.add('dialog-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('dialog-open');
  }

  close(): void {
    this.closedEvent.emit();
  }

  formatTime(dateStr: string): string {
    return this.dateUtils.getRelativeTime(dateStr);
  }

  /**
   * Toggle reaction picker for a poke
   */
  toggleReactionPicker(poke: Poke): void {
    // Don't allow if already has reaction
    if (poke.reaction) return;

    const currentId = this.expandedPokeId();
    this.expandedPokeId.set(currentId === poke.id ? null : poke.id);
  }

  /**
   * Check if reaction picker is open for a poke
   */
  isPickerOpen(pokeId: number): boolean {
    return this.expandedPokeId() === pokeId;
  }

  /**
   * Send reaction to a poke
   */
  sendReaction(poke: Poke, reaction: PokeReaction): void {
    if (this.sendingReactionFor() === poke.id) return;

    this.sendingReactionFor.set(poke.id);

    this.pokeService.addReaction(poke.id, reaction).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.sendingReactionFor.set(null);
        this.expandedPokeId.set(null);
      },
      error: () => {
        this.sendingReactionFor.set(null);
      }
    });
  }

  /**
   * Check if sending reaction for a specific poke
   */
  isSendingReaction(pokeId: number): boolean {
    return this.sendingReactionFor() === pokeId;
  }

  /**
   * Get tooltip text for a reaction emoji
   */
  getReactionTooltip(reaction: PokeReaction): string {
    const tooltips: Record<PokeReaction, string> = {
      '💀': 'Meghaltam',
      '😭': 'Bocs!',
      '🫡': 'Igenis!',
      '❤️': 'Köszi!',
      '👀': 'Mivan???'
    };
    return tooltips[reaction] || '';
  }
}
