import { describe, it, expect } from 'vitest';
import {
  calculateOptimisticReaction,
  calculateLikesCount,
} from './optimistic-reaction.util';
import type { ReactionEmoji, ReactionsSummary } from '@shared/constants';

describe('optimistic-reaction.util', () => {
  // ==========================================================================
  // calculateOptimisticReaction
  // ==========================================================================
  describe('calculateOptimisticReaction', () => {
    describe('új reakció hozzáadása (nincs korábbi)', () => {
      it('should add a new reaction when user has no prior reaction', () => {
        const reactions: ReactionsSummary = { '❤️': 3 };
        const result = calculateOptimisticReaction(reactions, null, '👀');

        expect(result.optimisticReactions['👀']).toBe(1);
        expect(result.optimisticReactions['❤️']).toBe(3);
        expect(result.optimisticUserReaction).toBe('👀');
      });

      it('should increment existing emoji count', () => {
        const reactions: ReactionsSummary = { '❤️': 5 };
        const result = calculateOptimisticReaction(reactions, null, '❤️');

        expect(result.optimisticReactions['❤️']).toBe(6);
        expect(result.optimisticUserReaction).toBe('❤️');
      });

      it('should handle null reactions', () => {
        const result = calculateOptimisticReaction(null, null, '💀');

        expect(result.optimisticReactions['💀']).toBe(1);
        expect(result.optimisticUserReaction).toBe('💀');
      });

      it('should handle undefined reactions', () => {
        const result = calculateOptimisticReaction(undefined, undefined, '😭');

        expect(result.optimisticReactions['😭']).toBe(1);
        expect(result.optimisticUserReaction).toBe('😭');
      });
    });

    describe('ugyanaz a reakció toggle (eltávolítás)', () => {
      it('should remove reaction when clicking same emoji', () => {
        const reactions: ReactionsSummary = { '❤️': 3 };
        const result = calculateOptimisticReaction(reactions, '❤️', '❤️');

        expect(result.optimisticReactions['❤️']).toBe(2);
        expect(result.optimisticUserReaction).toBeNull();
      });

      it('should delete emoji key when count reaches 0', () => {
        const reactions: ReactionsSummary = { '❤️': 1 };
        const result = calculateOptimisticReaction(reactions, '❤️', '❤️');

        expect(result.optimisticReactions['❤️']).toBeUndefined();
        expect(result.optimisticUserReaction).toBeNull();
      });
    });

    describe('reakció váltás (másik emojira kattintás)', () => {
      it('should switch from one emoji to another', () => {
        const reactions: ReactionsSummary = { '❤️': 3, '👀': 2 };
        const result = calculateOptimisticReaction(reactions, '❤️', '👀');

        expect(result.optimisticReactions['❤️']).toBe(2);
        expect(result.optimisticReactions['👀']).toBe(3);
        expect(result.optimisticUserReaction).toBe('👀');
      });

      it('should remove old emoji key when its count reaches 0', () => {
        const reactions: ReactionsSummary = { '❤️': 1, '👀': 2 };
        const result = calculateOptimisticReaction(reactions, '❤️', '👀');

        expect(result.optimisticReactions['❤️']).toBeUndefined();
        expect(result.optimisticReactions['👀']).toBe(3);
      });

      it('should create new emoji key when switching to non-existent emoji', () => {
        const reactions: ReactionsSummary = { '❤️': 2 };
        const result = calculateOptimisticReaction(reactions, '❤️', '💀');

        expect(result.optimisticReactions['❤️']).toBe(1);
        expect(result.optimisticReactions['💀']).toBe(1);
        expect(result.optimisticUserReaction).toBe('💀');
      });
    });

    describe('rollback', () => {
      it('should restore original state on rollback', () => {
        const reactions: ReactionsSummary = { '❤️': 3 };
        const result = calculateOptimisticReaction(reactions, '❤️', '❤️');

        // Az optimista állapot eltávolította
        expect(result.optimisticUserReaction).toBeNull();

        // Rollback
        const original = result.rollback();
        expect(original.reactions['❤️']).toBe(3);
        expect(original.userReaction).toBe('❤️');
      });

      it('should return null userReaction in rollback when original was null', () => {
        const result = calculateOptimisticReaction({}, null, '❤️');

        const original = result.rollback();
        expect(original.userReaction).toBeNull();
      });

      it('should not affect optimistic state when rollback is called', () => {
        const reactions: ReactionsSummary = { '❤️': 2 };
        const result = calculateOptimisticReaction(reactions, null, '❤️');

        result.rollback();

        // Az optimista állapot nem változik
        expect(result.optimisticReactions['❤️']).toBe(3);
        expect(result.optimisticUserReaction).toBe('❤️');
      });
    });

    describe('immutability', () => {
      it('should not mutate original reactions object', () => {
        const reactions: ReactionsSummary = { '❤️': 3 };
        calculateOptimisticReaction(reactions, '❤️', '❤️');

        expect(reactions['❤️']).toBe(3);
      });
    });
  });

  // ==========================================================================
  // calculateLikesCount
  // ==========================================================================
  describe('calculateLikesCount', () => {
    it('should return 0 for null', () => {
      expect(calculateLikesCount(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(calculateLikesCount(undefined)).toBe(0);
    });

    it('should return 0 for empty object', () => {
      expect(calculateLikesCount({})).toBe(0);
    });

    it('should sum all reaction counts', () => {
      const reactions: ReactionsSummary = { '❤️': 3, '👀': 2, '💀': 1 };
      expect(calculateLikesCount(reactions)).toBe(6);
    });

    it('should handle single reaction', () => {
      expect(calculateLikesCount({ '❤️': 10 })).toBe(10);
    });
  });
});
