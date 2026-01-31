/**
 * Post Tree Updater Utility
 *
 * Rekurzív post fa frissítése immutábilis módon.
 * Használható: fórum, kommentek hierarchikus struktúrájához.
 */

/**
 * Post-szerű objektum típus (minimum id és opcionális replies)
 */
export interface PostLike {
  id: number;
  replies?: PostLike[];
}

/**
 * Post frissítése a fában ID alapján (immutábilis)
 *
 * Rekurzívan bejárja a post fát és frissíti a megadott ID-jű elemet.
 * Minden érintett szülőt is újra létrehozza (immutábilis frissítés).
 *
 * @param posts - A post tömb (top-level)
 * @param postId - A frissítendő post ID-ja
 * @param updater - A frissítő függvény (post => frissített post)
 * @returns Új tömb a frissített post-tal
 *
 * @example
 * const updated = updatePostInTree(posts, 42, (post) => ({
 *   ...post,
 *   likesCount: post.likesCount + 1
 * }));
 */
export function updatePostInTree<T extends PostLike>(
  posts: T[],
  postId: number,
  updater: (post: T) => T
): T[] {
  return posts.map(post => {
    // Ha ez a keresett post, frissítjük
    if (post.id === postId) {
      return updater(post);
    }

    // Rekurzívan keresünk a reply-k között is
    if (post.replies && post.replies.length > 0) {
      return {
        ...post,
        replies: updatePostInTree(post.replies as T[], postId, updater)
      } as T;
    }

    return post;
  });
}

/**
 * Post keresése a fában ID alapján
 *
 * @param posts - A post tömb
 * @param postId - A keresett post ID-ja
 * @returns A megtalált post vagy undefined
 */
export function findPostInTree<T extends PostLike>(
  posts: T[],
  postId: number
): T | undefined {
  for (const post of posts) {
    if (post.id === postId) {
      return post;
    }

    if (post.replies && post.replies.length > 0) {
      const found = findPostInTree(post.replies as T[], postId);
      if (found) return found;
    }
  }

  return undefined;
}

/**
 * Post törlése a fából ID alapján (immutábilis)
 *
 * @param posts - A post tömb
 * @param postId - A törlendő post ID-ja
 * @returns Új tömb a post nélkül
 */
export function removePostFromTree<T extends PostLike>(
  posts: T[],
  postId: number
): T[] {
  return posts
    .filter(post => post.id !== postId)
    .map(post => {
      if (post.replies && post.replies.length > 0) {
        return {
          ...post,
          replies: removePostFromTree(post.replies as T[], postId)
        } as T;
      }
      return post;
    });
}

/**
 * Post-szerű objektum parentId-vel
 */
export interface PostWithParent extends PostLike {
  parentId?: number | null;
}

/**
 * Új post hozzáadása a fához (immutábilis)
 *
 * - Ha nincs parentId: top-level post → tömb végére
 * - Ha van parentId: reply → szülő replies tömbjébe rekurzívan
 *
 * @param posts - A post tömb (top-level)
 * @param newPost - Az új post (parentId-vel)
 * @returns Új tömb az új post-tal
 *
 * @example
 * // Top-level post hozzáadása
 * const updated = addPostToTree(posts, { id: 99, content: 'Új!' });
 *
 * // Reply hozzáadása
 * const updated = addPostToTree(posts, { id: 100, parentId: 5, content: 'Válasz' });
 */
export function addPostToTree<T extends PostWithParent>(
  posts: T[],
  newPost: T
): T[] {
  // Top-level post (nincs parentId)
  if (!newPost.parentId) {
    return [...posts, newPost];
  }

  // Reply - rekurzívan keressük a szülőt
  return posts.map(post => {
    if (post.id === newPost.parentId) {
      return {
        ...post,
        replies: [...(post.replies || []), newPost]
      } as T;
    }

    if (post.replies && post.replies.length > 0) {
      return {
        ...post,
        replies: addPostToTree(post.replies as T[], newPost)
      } as T;
    }

    return post;
  });
}
