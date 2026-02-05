import { Component, ChangeDetectionStrategy, inject, computed, input, output } from '@angular/core';
import { ReactionPickerComponent, ReactionEmoji } from '@shared/components/reaction-picker/reaction-picker.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { DateUtilsService } from '@shared/services/date-utils.service';
import { trackById } from '@shared/utils/track-by.utils';
import { Poke } from '@core/models/poke.models';
import { createBackdropHandler } from '@shared/utils/dialog.util';

/**
 * Received Pokes Dialog Component
 *
 * Kapott bökések listája dialógusban.
 */
@Component({
  selector: 'app-received-pokes-dialog',
  imports: [ReactionPickerComponent, EmptyStateComponent],
  templateUrl: './received-pokes-dialog.component.html',
  styleUrls: ['./received-pokes-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceivedPokesDialogComponent {
  private readonly dateUtils = inject(DateUtilsService);

  /** Signal-based inputs */
  readonly pokes = input.required<Poke[]>();

  /** Signal-based outputs */
  readonly closeEvent = output<void>();
  readonly reactionAddedEvent = output<{ poke: Poke; reaction: string }>();
  readonly markAllReadEvent = output<void>();

  /** TrackBy function */
  readonly trackByPokeId = trackById;

  /** Backdrop handler - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  readonly backdropHandler = createBackdropHandler(() => this.onClose());

  /** Olvasatlan bökések száma - computed signal */
  readonly unreadCount = computed(() => {
    return this.pokes().filter(p => !p.isRead).length;
  });

  /**
   * Reakció hozzáadása
   */
  onReactionSelect(poke: Poke, reaction: ReactionEmoji): void {
    if (!poke.reaction) {
      this.reactionAddedEvent.emit({ poke, reaction });
    }
  }

  /**
   * Összes olvasottnak jelölése
   */
  onMarkAllRead(): void {
    this.markAllReadEvent.emit();
  }

  /**
   * Bezárás
   */
  onClose(): void {
    this.closeEvent.emit();
  }

  /**
   * Relatív idő (DateUtilsService-ből)
   */
  getRelativeTime(dateStr: string): string {
    return this.dateUtils.getRelativeTime(dateStr);
  }
}
