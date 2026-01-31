import { Component, ChangeDetectionStrategy, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll, PollMedia } from '../../../core/services/voting.service';
import { TextUtilsService } from '../../../shared/services/text-utils.service';
import { DateUtilsService } from '../../../shared/services/date-utils.service';
import { DeleteButtonComponent, EditButtonComponent } from '../../../shared/components/action-buttons';

/**
 * Voting Card Component
 *
 * Egy szavazás kártya megjelenítése.
 * - Cím, típus, státusz
 * - Progress bar (ha van)
 * - Saját szavazat jelzése
 * - Szerkesztés/törlés gombok (kapcsolattartónak)
 * - Teljes keyboard és screen reader támogatás
 */
@Component({
    selector: 'app-voting-card',
    imports: [CommonModule, DeleteButtonComponent, EditButtonComponent],
    templateUrl: './voting-card.component.html',
    styleUrls: ['./voting-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
      'role': 'article',
      '[attr.tabindex]': '0',
      '[attr.aria-label]': 'ariaLabel()',
      '(keydown.enter)': 'onSelect()',
      '(keydown.space)': 'onKeySpace($event)',
      '(click)': 'onCardClick($event)'
    }
})
export class VotingCardComponent {
  private readonly textUtils = inject(TextUtilsService);
  private readonly dateUtils = inject(DateUtilsService);

  /** Signal-based inputs */
  readonly poll = input.required<Poll>();
  readonly isClosed = input<boolean>(false);
  readonly showActions = input<boolean>(false);
  readonly showResultsButton = input<boolean>(false);
  readonly expectedClassSize = input<number | null>(null);

  /** Signal-based outputs */
  readonly selectEvent = output<Poll>();
  readonly editEvent = output<Poll>();
  readonly deleteEvent = output<Poll>();
  readonly viewResultsEvent = output<Poll>();
  readonly closePollEvent = output<Poll>();
  readonly reopenPollEvent = output<Poll>();
  readonly lightboxOpenEvent = output<{ media: PollMedia[], index: number }>();

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  /** Van-e média a szavazáshoz */
  readonly hasMedia = computed(() => {
    const p = this.poll();
    return p.media && p.media.length > 0;
  });

  /** Első média elem (thumbnail-hez) */
  readonly firstMedia = computed(() => this.poll().media?.[0] ?? null);

  /** További képek száma (+N badge-hez) */
  readonly additionalMediaCount = computed(() =>
    Math.max(0, (this.poll().media?.length ?? 0) - 1)
  );

  /** Szavazott-e már */
  readonly hasVoted = computed(() => this.poll().myVotes.length > 0);

  /** Típus badge szöveg */
  readonly typeBadge = computed(() =>
    this.poll().type === 'template' ? 'Sablon' : 'Szabad'
  );

  /** Státusz szöveg */
  readonly statusText = computed(() => {
    const p = this.poll();
    if (!p.isOpen) return 'Lezárt';
    if (this.hasVoted()) return 'Szavaztál';
    return 'Aktív';
  });

  /** Részvételi arány formázása - X/Y fő formátum */
  readonly participationText = computed(() => {
    const p = this.poll();
    if (p.uniqueVoters !== undefined) {
      const classSize = this.expectedClassSize();
      if (classSize) {
        return `${p.uniqueVoters}/${classSize} szavazott`;
      }
      return `${p.uniqueVoters} szavazó`;
    }
    return '';
  });

  /** Lejárat formázása */
  readonly closeAtText = computed(() =>
    this.dateUtils.getDeadlineText(this.poll().closeAt)
  );

  /** Leírás plain text formában (HTML tagek nélkül) */
  readonly plainDescription = computed(() =>
    this.textUtils.htmlToPlainPreview(this.poll().description ?? '', 150)
  );

  /** Aria label a screen readerekhez */
  readonly ariaLabel = computed(() => {
    const p = this.poll();
    const status = p.isOpen ? 'aktív' : 'lezárt';
    const voted = this.hasVoted() ? ', már szavaztál' : '';
    const type = p.type === 'template' ? 'sablon' : 'szabad';
    return `${p.title}, ${type} szavazás, ${status}${voted}`;
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Kártya kattintás kezelése
   */
  onCardClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.voting-card__action-btn')) {
      return;
    }
    this.onSelect();
  }

  /**
   * Kártya kiválasztása (kattintás vagy Enter/Space)
   */
  onSelect(): void {
    this.selectEvent.emit(this.poll());
  }

  /**
   * Space gomb kezelése (preventDefault a scrollozás ellen)
   */
  onKeySpace(event: Event): void {
    event.preventDefault();
    this.onSelect();
  }

  /**
   * Eredmények megtekintése gomb
   */
  onViewResults(event: Event): void {
    event.stopPropagation();
    this.viewResultsEvent.emit(this.poll());
  }

  /**
   * Szavazás lezárása gomb
   */
  onClosePoll(event: Event): void {
    event.stopPropagation();
    this.closePollEvent.emit(this.poll());
  }

  /**
   * Szavazás újranyitása gomb
   */
  onReopenPoll(event: Event): void {
    event.stopPropagation();
    this.reopenPollEvent.emit(this.poll());
  }

  /**
   * Thumbnail kattintás - lightbox megnyitása
   */
  onThumbnailClick(event: Event, index = 0): void {
    event.stopPropagation();
    const p = this.poll();
    if (p.media && p.media.length > 0) {
      this.lightboxOpenEvent.emit({ media: p.media, index });
    }
  }

  /**
   * Szerkesztés
   */
  onEdit(): void {
    this.editEvent.emit(this.poll());
  }

  /**
   * Törlés
   */
  onDelete(): void {
    this.deleteEvent.emit(this.poll());
  }
}
