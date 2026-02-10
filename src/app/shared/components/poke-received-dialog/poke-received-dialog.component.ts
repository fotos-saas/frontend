import {
  Component,
  output,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  AfterViewInit,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PokeService } from '../../../core/services/poke.service';
import { DateUtilsService } from '../../services/date-utils.service';
import { Poke } from '../../../core/models/poke.models';
import { REACTION_EMOJIS, ReactionEmoji, REACTION_TOOLTIPS } from '@shared/constants';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-poke-received-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './poke-received-dialog.component.html',
  styleUrls: ['./poke-received-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeReceivedDialogComponent implements AfterViewInit {
  private readonly pokeService = inject(PokeService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Signal-based outputs */
  readonly closedEvent = output<void>();

  // Pokes from service
  readonly pokes = this.pokeService.receivedPokes;
  readonly unreadCount = this.pokeService.unreadCount;

  // Available reactions
  readonly reactions = REACTION_EMOJIS;

  // Currently expanded poke for reaction picker
  readonly expandedPokeId = signal<number | null>(null);

  // Loading state for reaction
  readonly sendingReactionFor = signal<number | null>(null);

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
  }

  close(): void {
    this.closedEvent.emit();
  }

  formatTime(dateStr: string): string {
    return this.dateUtils.getRelativeTime(dateStr);
  }

  toggleReactionPicker(poke: Poke): void {
    if (poke.reaction) return;
    const currentId = this.expandedPokeId();
    this.expandedPokeId.set(currentId === poke.id ? null : poke.id);
  }

  isPickerOpen(pokeId: number): boolean {
    return this.expandedPokeId() === pokeId;
  }

  sendReaction(poke: Poke, reaction: ReactionEmoji): void {
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

  isSendingReaction(pokeId: number): boolean {
    return this.sendingReactionFor() === pokeId;
  }

  getReactionTooltip(reaction: ReactionEmoji): string {
    return REACTION_TOOLTIPS[reaction] || '';
  }
}
