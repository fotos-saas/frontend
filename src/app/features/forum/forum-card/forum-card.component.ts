import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Discussion } from '../../../core/services/forum.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

/**
 * Forum Card Component
 *
 * Egy beszélgetés kártyája a listában:
 * - Cím, állapot (kitűzött, lezárt)
 * - Hozzászólások száma
 * - Utolsó hozzászólás ideje
 */
@Component({
    selector: 'app-forum-card',
    imports: [CommonModule, TimeAgoPipe],
    templateUrl: './forum-card.component.html',
    styleUrls: ['./forum-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumCardComponent {
  /** Discussion input (Signal API) */
  readonly discussion = input.required<Discussion>();

  /** Kitűzött-e (computed signal) */
  readonly isPinned = computed(() => this.discussion().isPinned);

  /** Lezárt-e (computed signal) */
  readonly isLocked = computed(() => this.discussion().isLocked);

  /** Utolsó aktivitás dátuma (TimeAgoPipe-hoz) (computed signal) */
  readonly lastActivityDate = computed(() =>
    this.discussion().lastPostAt || this.discussion().createdAt
  );

  /** Utolsó aktivitás szöveg (computed signal) */
  readonly lastActivity = computed(() => {
    const d = this.discussion();
    if (d.lastPostBy) {
      return `${d.lastPostBy} válaszolt`;
    }
    return `${d.creatorName} hozta létre`;
  });

  /** Sablon kapcsolat (computed signal) */
  readonly hasTemplate = computed(() => !!this.discussion().templateId);
}
