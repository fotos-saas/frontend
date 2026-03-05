import { describe, it, expect } from 'vitest';
import {
  updatePostInTree,
  findPostInTree,
  removePostFromTree,
  addPostToTree,
  type PostLike,
  type PostWithParent,
} from './post-tree-updater.util';

// =============================================================================
// Test helper - hierarchikus post fa
// =============================================================================
interface TestPost extends PostWithParent {
  id: number;
  content: string;
  replies?: TestPost[];
  parentId?: number | null;
}

function createTestTree(): TestPost[] {
  return [
    {
      id: 1,
      content: 'Top-level 1',
      replies: [
        {
          id: 11,
          content: 'Reply 1.1',
          parentId: 1,
          replies: [
            { id: 111, content: 'Reply 1.1.1', parentId: 11 },
          ],
        },
        { id: 12, content: 'Reply 1.2', parentId: 1 },
      ],
    },
    {
      id: 2,
      content: 'Top-level 2',
      replies: [],
    },
    {
      id: 3,
      content: 'Top-level 3',
    },
  ];
}

describe('post-tree-updater.util', () => {
  // ==========================================================================
  // updatePostInTree
  // ==========================================================================
  describe('updatePostInTree', () => {
    it('should update a top-level post', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 2, (p) => ({
        ...p,
        content: 'Módosított',
      }));

      expect(updated[1].content).toBe('Módosított');
    });

    it('should update a nested reply', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 11, (p) => ({
        ...p,
        content: 'Reply módosítva',
      }));

      expect(updated[0].replies![0].content).toBe('Reply módosítva');
    });

    it('should update a deeply nested reply', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 111, (p) => ({
        ...p,
        content: 'Mély módosítás',
      }));

      expect((updated[0].replies![0] as TestPost).replies![0].content).toBe('Mély módosítás');
    });

    it('should be immutable - not modify original tree', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 1, (p) => ({
        ...p,
        content: 'Változtatás',
      }));

      expect(tree[0].content).toBe('Top-level 1');
      expect(updated[0].content).toBe('Változtatás');
      expect(updated).not.toBe(tree);
    });

    it('should return same references for unaffected posts', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 2, (p) => ({
        ...p,
        content: 'Módosított',
      }));

      // Post 3 nem változott, a referencia marad
      expect(updated[2]).toBe(tree[2]);
    });

    it('should return original array structure if ID not found', () => {
      const tree = createTestTree();
      const updated = updatePostInTree(tree, 999, (p) => ({
        ...p,
        content: 'Nem létező',
      }));

      // Tartalmilag nem változott
      expect(updated[0].content).toBe('Top-level 1');
      expect(updated[1].content).toBe('Top-level 2');
    });

    it('should handle empty array', () => {
      const result = updatePostInTree([], 1, (p) => p);
      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // findPostInTree
  // ==========================================================================
  describe('findPostInTree', () => {
    it('should find a top-level post', () => {
      const tree = createTestTree();
      const found = findPostInTree(tree, 1);
      expect(found?.content).toBe('Top-level 1');
    });

    it('should find a nested reply', () => {
      const tree = createTestTree();
      const found = findPostInTree(tree, 12);
      expect(found?.content).toBe('Reply 1.2');
    });

    it('should find a deeply nested reply', () => {
      const tree = createTestTree();
      const found = findPostInTree(tree, 111);
      expect(found?.content).toBe('Reply 1.1.1');
    });

    it('should return undefined for non-existent ID', () => {
      const tree = createTestTree();
      expect(findPostInTree(tree, 999)).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      expect(findPostInTree([], 1)).toBeUndefined();
    });

    it('should return the actual reference (not a copy)', () => {
      const tree = createTestTree();
      const found = findPostInTree(tree, 2);
      expect(found).toBe(tree[1]);
    });
  });

  // ==========================================================================
  // removePostFromTree
  // ==========================================================================
  describe('removePostFromTree', () => {
    it('should remove a top-level post', () => {
      const tree = createTestTree();
      const result = removePostFromTree(tree, 2);

      expect(result.length).toBe(2);
      expect(findPostInTree(result, 2)).toBeUndefined();
    });

    it('should remove a nested reply', () => {
      const tree = createTestTree();
      const result = removePostFromTree(tree, 12);

      expect(result[0].replies!.length).toBe(1);
      expect(findPostInTree(result, 12)).toBeUndefined();
    });

    it('should remove a deeply nested reply', () => {
      const tree = createTestTree();
      const result = removePostFromTree(tree, 111);

      const reply11 = findPostInTree(result, 11) as TestPost;
      expect(reply11.replies!.length).toBe(0);
    });

    it('should be immutable - not modify original tree', () => {
      const tree = createTestTree();
      removePostFromTree(tree, 2);

      expect(tree.length).toBe(3);
    });

    it('should return same array if ID not found', () => {
      const tree = createTestTree();
      const result = removePostFromTree(tree, 999);

      expect(result.length).toBe(3);
    });

    it('should handle empty array', () => {
      expect(removePostFromTree([], 1)).toEqual([]);
    });
  });

  // ==========================================================================
  // addPostToTree
  // ==========================================================================
  describe('addPostToTree', () => {
    it('should add top-level post (no parentId)', () => {
      const tree = createTestTree();
      const newPost: TestPost = { id: 99, content: 'Új post' };
      const result = addPostToTree(tree, newPost);

      expect(result.length).toBe(4);
      expect(result[3].id).toBe(99);
      expect(result[3].content).toBe('Új post');
    });

    it('should add reply to top-level post', () => {
      const tree = createTestTree();
      const newPost: TestPost = { id: 100, content: 'Válasz', parentId: 2 };
      const result = addPostToTree(tree, newPost);

      const parent = findPostInTree(result, 2) as TestPost;
      expect(parent.replies!.length).toBe(1);
      expect(parent.replies![0].id).toBe(100);
    });

    it('should add reply to nested post', () => {
      const tree = createTestTree();
      const newPost: TestPost = { id: 200, content: 'Mély válasz', parentId: 11 };
      const result = addPostToTree(tree, newPost);

      const parent = findPostInTree(result, 11) as TestPost;
      expect(parent.replies!.length).toBe(2); // 111 + 200
      expect(parent.replies![1].id).toBe(200);
    });

    it('should add reply to post without existing replies', () => {
      const tree = createTestTree();
      const newPost: TestPost = { id: 300, content: 'Első válasz', parentId: 3 };
      const result = addPostToTree(tree, newPost);

      const parent = findPostInTree(result, 3) as TestPost;
      expect(parent.replies!.length).toBe(1);
      expect(parent.replies![0].id).toBe(300);
    });

    it('should be immutable - not modify original tree', () => {
      const tree = createTestTree();
      addPostToTree(tree, { id: 99, content: 'Új' } as TestPost);

      expect(tree.length).toBe(3);
    });

    it('should treat parentId: null as top-level', () => {
      const tree = createTestTree();
      const newPost: TestPost = { id: 99, content: 'Top', parentId: null };
      const result = addPostToTree(tree, newPost);

      expect(result.length).toBe(4);
    });

    it('should handle empty tree', () => {
      const newPost: TestPost = { id: 1, content: 'Első' };
      const result = addPostToTree([], newPost);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });
  });
});
