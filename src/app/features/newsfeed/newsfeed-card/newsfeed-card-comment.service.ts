import { Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * NewsfeedCardCommentService - Komment kezeles logika a newsfeed-card-hoz.
 *
 * Kezeli: reply allapot, replies expand/collapse, scroll.
 * Nem providedIn: 'root' - minden kartya sajat peldanyt kap.
 */
@Injectable()
export class NewsfeedCardCommentService {
  /** Melyik kommentek reply-ai vannak kinyitva */
  readonly expandedReplies = signal<Set<number>>(new Set());

  /**
   * Reply-k toggle (expand/collapse).
   * Kinyitaskor az utolso valaszokhoz gorget.
   */
  toggleReplies(commentId: number, destroyRef: DestroyRef): void {
    const current = this.expandedReplies();
    const newSet = new Set(current);
    const wasExpanded = newSet.has(commentId);

    if (wasExpanded) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    this.expandedReplies.set(newSet);

    if (!wasExpanded) {
      this.scrollToLastReplies(commentId, destroyRef);
    }
  }

  /**
   * Reply-k lathatoak-e.
   */
  areRepliesExpanded(commentId: number): boolean {
    return this.expandedReplies().has(commentId);
  }

  /**
   * Reply ID hozzaadasa az expanded sethez (valasz eseten).
   */
  ensureRepliesExpanded(commentId: number): void {
    const current = this.expandedReplies();
    if (!current.has(commentId)) {
      const newSet = new Set(current);
      newSet.add(commentId);
      this.expandedReplies.set(newSet);
    }
  }

  /**
   * Gorgetese az utolso valaszokhoz (max 3).
   */
  private scrollToLastReplies(commentId: number, destroyRef: DestroyRef): void {
    timer(150).pipe(
      take(1),
      takeUntilDestroyed(destroyRef)
    ).subscribe(() => {
      const commentThread = document.querySelector(
        `.newsfeed-card__comment-thread[data-comment-id="${commentId}"]`
      );
      if (!commentThread) return;

      const repliesContainer = commentThread.querySelector('.newsfeed-card__replies');
      if (!repliesContainer) return;

      const replyItems = repliesContainer.querySelectorAll('.newsfeed-card__reply-item');
      if (replyItems.length === 0) return;

      const targetIndex = replyItems.length <= 3 ? 0 : replyItems.length - 3;
      const targetElement = replyItems[targetIndex] as HTMLElement;

      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}
