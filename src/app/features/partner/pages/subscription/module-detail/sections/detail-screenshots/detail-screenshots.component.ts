import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ModuleScreenshot } from '../../module-detail.types';

@Component({
  selector: 'app-detail-screenshots',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detail-screenshots.component.html',
  styleUrl: './detail-screenshots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailScreenshotsComponent {
  readonly screenshots = input.required<ModuleScreenshot[]>();
  readonly lightboxIndex = signal<number | null>(null);

  readonly ICONS = ICONS;

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  nextImage(): void {
    const current = this.lightboxIndex();
    if (current === null) return;
    const len = this.screenshots().length;
    this.lightboxIndex.set((current + 1) % len);
  }

  prevImage(): void {
    const current = this.lightboxIndex();
    if (current === null) return;
    const len = this.screenshots().length;
    this.lightboxIndex.set((current - 1 + len) % len);
  }
}
