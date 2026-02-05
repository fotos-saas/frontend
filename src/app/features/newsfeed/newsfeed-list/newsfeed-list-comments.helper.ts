import { WritableSignal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { NewsfeedComment, NewsfeedPost } from '../../../core/services/newsfeed.service';

/**
 * Komment map segédfüggvények
 *
 * Újrahasználható helper-ek a komment-térképek kezeléséhez
 * (beszúrás, törlés, flag kezelés, reakció frissítés, scroll).
 */

/** Komment beszúrása a map-be (top-level vagy reply) */
export function insertCommentInMap(
  commentsMap: WritableSignal<Map<number, NewsfeedComment[]>>,
  postId: number,
  newComment: NewsfeedComment,
  parentId?: number
): void {
  const map = new Map(commentsMap());
  const existing = map.get(postId) || [];

  if (parentId) {
    map.set(postId, existing.map(c =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies || []), newComment] }
        : c
    ));
  } else {
    map.set(postId, [...existing, newComment]);
  }
  commentsMap.set(map);
}

/** Komment eltávolítása a map-ből */
export function removeCommentFromMap(
  commentsMap: WritableSignal<Map<number, NewsfeedComment[]>>,
  postId: number,
  commentId: number
): void {
  const map = new Map(commentsMap());
  const existing = map.get(postId) || [];
  map.set(postId, existing.filter(c => c.id !== commentId));
  commentsMap.set(map);
}

/** Komment reakció frissítése a map-ben (top-level + reply) */
export function updateCommentReactionInMap(
  commentsMap: WritableSignal<Map<number, NewsfeedComment[]>>,
  postId: number,
  commentId: number,
  userReaction: string | null | undefined,
  reactions: Record<string, number> | undefined
): void {
  const map = new Map(commentsMap());
  const existing = map.get(postId) || [];
  map.set(postId, existing.map(c => {
    if (c.id === commentId) {
      return { ...c, userReaction, reactions };
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: c.replies.map(r =>
          r.id === commentId ? { ...r, userReaction, reactions } : r
        )
      };
    }
    return c;
  }));
  commentsMap.set(map);
}

/** Scrollozás az újonnan hozzáadott kommenthez (késleltetett) */
export function scheduleScrollToComment(
  destroyRef: DestroyRef,
  parentId?: number
): void {
  timer(100).pipe(
    take(1),
    takeUntilDestroyed(destroyRef)
  ).subscribe(() => {
    const selector = parentId
      ? `.newsfeed-card__comment-thread[data-comment-id="${parentId}"] .comment-item--new`
      : `.newsfeed-card .comment-item--new`;
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/** isNew flag eltávolítása az animáció után (késleltetett) */
export function scheduleClearNewFlag(
  commentsMap: WritableSignal<Map<number, NewsfeedComment[]>>,
  destroyRef: DestroyRef,
  postId: number,
  commentId: number,
  parentId?: number
): void {
  timer(2500).pipe(
    take(1),
    takeUntilDestroyed(destroyRef)
  ).subscribe(() => {
    const currentMap = new Map(commentsMap());
    const currentComments = currentMap.get(postId) || [];

    if (parentId) {
      currentMap.set(postId, currentComments.map(c =>
        c.id === parentId && c.replies
          ? { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, isNew: false } : r) }
          : c
      ));
    } else {
      currentMap.set(postId, currentComments.map(c =>
        c.id === commentId ? { ...c, isNew: false } : c
      ));
    }
    commentsMap.set(currentMap);
  });
}

/** Generikus Map signal frissítő */
export function updateMapSignal<K, V>(
  mapSignal: WritableSignal<Map<K, V>>,
  key: K,
  value: V
): void {
  const map = new Map(mapSignal());
  map.set(key, value);
  mapSignal.set(map);
}
