/**
 * Sample item interface for samples lightbox
 */
export interface SampleLightboxItem {
  id: number;
  url: string;
  thumbUrl?: string;
  fileName: string;
  createdAt: string;
  description?: string;
}
