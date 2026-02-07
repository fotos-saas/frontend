import { Injectable, DestroyRef } from '@angular/core';

/**
 * LightboxThumbnailService - Thumbnail lazy loading es IntersectionObserver kezeles.
 *
 * Komponens szintu scope - minden lightbox peldany sajatot kap.
 */
@Injectable()
export class LightboxThumbnailService {
  private thumbnailObserver: IntersectionObserver | null = null;
  private readonly loadedThumbnails = new Set<number>();

  /**
   * IntersectionObserver letrehozasa a lazy loading-hoz.
   */
  setupLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    this.thumbnailObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const templateId = parseInt(img.dataset['templateId'] || '0', 10);

          if (!this.loadedThumbnails.has(templateId)) {
            const actualSrc = img.dataset['src'];
            if (actualSrc) {
              img.src = actualSrc;
              img.classList.remove('lightbox__thumbnail-image--loading');
              this.loadedThumbnails.add(templateId);
            }
          }
          this.thumbnailObserver?.unobserve(img);
        }
      });
    }, options);
  }

  /**
   * Thumbnail kepek megfigyelese az observer-rel.
   */
  observeThumbnails(galleryTrackElement: HTMLElement | null): void {
    if (!this.thumbnailObserver || !galleryTrackElement) return;

    const images = galleryTrackElement.querySelectorAll('.lightbox__thumbnail-image');
    images.forEach(img => {
      this.thumbnailObserver?.observe(img);
    });
  }

  /**
   * Thumbnail URL lekerdezese (lazy loading allapot alapjan).
   */
  getThumbnailUrl(templateId: number, thumbnailUrl: string): string {
    if (this.loadedThumbnails.has(templateId)) {
      return thumbnailUrl;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  /**
   * Betoltott-e a thumbnail.
   */
  isThumbnailLoaded(templateId: number): boolean {
    return this.loadedThumbnails.has(templateId);
  }

  /**
   * Takaritas - observer leallitasa.
   */
  destroy(): void {
    if (this.thumbnailObserver) {
      this.thumbnailObserver.disconnect();
      this.thumbnailObserver = null;
    }
  }
}
