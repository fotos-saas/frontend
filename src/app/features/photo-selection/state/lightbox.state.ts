import { signal, computed } from '@angular/core';
import { LightboxMediaItem } from '../../../shared/components/media-lightbox/media-lightbox.types';
import { WorkflowPhoto } from '../models/workflow.models';

/**
 * Lightbox State
 *
 * Kezeli a lightbox megjelenítését és navigációját.
 */
export class LightboxState {
  /** Lightbox nyitva */
  readonly isOpen = signal<boolean>(false);

  /** Lightbox current index */
  readonly currentIndex = signal<number>(0);

  /**
   * Lightbox megnyitása
   */
  open(index: number): void {
    this.currentIndex.set(index);
    this.isOpen.set(true);
  }

  /**
   * Lightbox bezárása
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Lightbox navigáció
   */
  navigate(index: number): void {
    this.currentIndex.set(index);
  }

  /**
   * Reset
   */
  reset(): void {
    this.isOpen.set(false);
    this.currentIndex.set(0);
  }

  /**
   * Készít egy computed-et a lightbox media adatokhoz
   * @param photos A fotók signal-ja
   */
  static createMediaComputed(photos: () => WorkflowPhoto[]) {
    return computed<LightboxMediaItem[]>(() =>
      photos().map(photo => ({
        id: photo.id,
        url: photo.url,
        fileName: photo.filename,
      }))
    );
  }
}
