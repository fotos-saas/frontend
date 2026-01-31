import { ReactionEmoji, ReactionsSummary } from '@shared/constants';

/**
 * Optimistic Reaction Calculation Result
 */
export interface OptimisticReactionResult {
  /** Az optimista reactions összesítő */
  optimisticReactions: ReactionsSummary;
  /** Az optimista userReaction (null ha eltávolítottuk) */
  optimisticUserReaction: ReactionEmoji | null;
  /** Rollback függvény - visszaállítja az eredeti értékeket */
  rollback: () => { reactions: ReactionsSummary; userReaction: ReactionEmoji | null };
}

/**
 * Optimista reakció kalkuláció
 *
 * Azonnal kiszámítja a várható állapotot a reakció toggle után,
 * mielőtt az API válasz megérkezne.
 *
 * @param currentReactions - Jelenlegi reakciók összesítője
 * @param currentUserReaction - Jelenlegi felhasználói reakció (null ha nincs)
 * @param newReaction - Az újonnan kiválasztott reakció
 * @returns Optimista értékek + rollback függvény
 *
 * @example
 * // Komponensben:
 * const { optimisticReactions, optimisticUserReaction, rollback } =
 *   calculateOptimisticReaction(post.reactions, post.userReaction, '❤️');
 *
 * // Azonnal frissítjük az UI-t
 * post.reactions = optimisticReactions;
 * post.userReaction = optimisticUserReaction;
 *
 * // API hívás
 * api.toggleReaction(postId, '❤️').subscribe({
 *   next: (result) => { ... },
 *   error: () => {
 *     const original = rollback();
 *     post.reactions = original.reactions;
 *     post.userReaction = original.userReaction;
 *   }
 * });
 */
export function calculateOptimisticReaction(
  currentReactions: ReactionsSummary | null | undefined,
  currentUserReaction: ReactionEmoji | string | null | undefined,
  newReaction: ReactionEmoji
): OptimisticReactionResult {
  // Eredeti értékek mentése rollback-hez
  const originalReactions = { ...(currentReactions || {}) };
  const originalUserReaction = (currentUserReaction as ReactionEmoji) || null;

  // Új reactions másolat
  const optimisticReactions: ReactionsSummary = { ...(currentReactions || {}) };
  let optimisticUserReaction: ReactionEmoji | null;

  if (currentUserReaction === newReaction) {
    // Ugyanarra kattintott - eltávolítás
    optimisticUserReaction = null;
    if (optimisticReactions[newReaction]) {
      optimisticReactions[newReaction]--;
      if (optimisticReactions[newReaction] <= 0) {
        delete optimisticReactions[newReaction];
      }
    }
  } else {
    // Másik reakció vagy új reakció
    // Ha volt korábbi reakció, csökkentjük annak számlálóját
    if (currentUserReaction && optimisticReactions[currentUserReaction as ReactionEmoji]) {
      optimisticReactions[currentUserReaction as ReactionEmoji]--;
      if (optimisticReactions[currentUserReaction as ReactionEmoji] <= 0) {
        delete optimisticReactions[currentUserReaction as ReactionEmoji];
      }
    }

    // Új reakció hozzáadása
    optimisticReactions[newReaction] = (optimisticReactions[newReaction] || 0) + 1;
    optimisticUserReaction = newReaction;
  }

  // Rollback függvény
  const rollback = () => ({
    reactions: originalReactions,
    userReaction: originalUserReaction
  });

  return {
    optimisticReactions,
    optimisticUserReaction,
    rollback
  };
}

/**
 * Likescount kiszámítása a reactions összesítőből
 */
export function calculateLikesCount(reactions: ReactionsSummary | null | undefined): number {
  if (!reactions) return 0;
  return Object.values(reactions).reduce((sum, count) => sum + count, 0);
}
