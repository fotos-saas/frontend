/**
 * Gallery Photo interface (guest/public nézet, camelCase)
 * Represents a single photo from a TabloGallery.
 * NE keverd össze: partner/models/gallery.models.ts → partner admin nézet (snake_case, más mezők)
 */
export interface GalleryPhoto {
  id: number;
  url: string;
  thumbUrl: string;
  previewUrl: string;
  fileName: string;
  size: string;
  createdAt: string;
}

/**
 * Gallery Info interface
 * Basic information about a gallery
 */
export interface GalleryInfo {
  id: number;
  name: string;
  photosCount: number;
}

/**
 * Gallery Photos API Response
 */
export interface GalleryPhotosResponse {
  success: boolean;
  message?: string;
  data: GalleryPhoto[];
  gallery: GalleryInfo | null;
}
