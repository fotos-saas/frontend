/**
 * Post/Newsfeed media interface
 * Közös struktúra a fórum és hírfolyam csatolmányokhoz.
 */
export interface PostMedia {
  id: number;
  url: string;
  fileName: string;
  isImage: boolean;
}
