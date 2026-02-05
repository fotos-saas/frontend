/**
 * Gallery fotó (Spatie Media)
 */
export interface GalleryPhoto {
  id: number;
  name: string;
  title: string;
  thumb_url: string;
  preview_url: string;
  original_url: string;
  size: number;
  createdAt: string;
}

/**
 * Galéria részletek (API response)
 */
export interface GalleryDetails {
  id: number;
  name: string;
  photosCount: number;
  totalSizeMb: number;
  maxRetouchPhotos: number;
  photos: GalleryPhoto[];
  createdAt: string;
}

/**
 * Galéria API válasz (getGallery)
 */
export interface GalleryResponse {
  hasGallery: boolean;
  gallery: GalleryDetails | null;
}

/**
 * Galéria létrehozás válasz
 */
export interface CreateGalleryResponse {
  success: boolean;
  created: boolean;
  gallery: GalleryDetails;
}

/**
 * Galéria progress (diák workflow haladás)
 */
export interface GalleryProgress {
  totalUsers: number;
  claiming: number;
  retouch: number;
  tablo: number;
  completed: number;
  finalized: number;
}
