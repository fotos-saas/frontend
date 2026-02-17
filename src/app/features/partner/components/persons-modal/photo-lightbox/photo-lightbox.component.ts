import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';

/**
 * Lightbox komponens képek nagyított nézetéhez navigációval.
 */
@Component({
  selector: 'app-photo-lightbox',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (person()) {
      <div class="lightbox" (click)="close.emit()">
        <div class="lightbox-content" (click)="$event.stopPropagation()">
          <img [src]="person()!.photoUrl!" [alt]="person()!.name" />
          <div class="lightbox-caption">
            <span class="lightbox-name">{{ person()!.name }}</span>
            <span class="lightbox-type">{{ person()!.type === 'student' ? 'Diák' : 'Tanár' }}</span>
          </div>
        </div>
        <button class="lightbox-close" (click)="close.emit()">
          <lucide-icon [name]="ICONS.X" [size]="24" />
        </button>
        <!-- Navigation -->
        @if (canNavigatePrev()) {
          <button class="lightbox-nav lightbox-nav--prev" (click)="navigatePrev($event)">
            <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="32" />
          </button>
        }
        @if (canNavigateNext()) {
          <button class="lightbox-nav lightbox-nav--next" (click)="navigateNext($event)">
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="32" />
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .lightbox-content {
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: scaleIn 0.2s ease;
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .lightbox-content img {
      max-width: 100%;
      max-height: calc(85vh - 60px);
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .lightbox-caption {
      margin-top: 16px;
      text-align: center;
      color: #fff;
    }

    .lightbox-name {
      display: block;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .lightbox-type {
      display: block;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4px;
    }

    .lightbox-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .lightbox-nav--prev {
      left: 16px;
    }

    .lightbox-nav--next {
      right: 16px;
    }

    @media (max-width: 480px) {
      .lightbox-nav {
        width: 40px;
        height: 40px;
      }

      .lightbox-nav--prev {
        left: 8px;
      }

      .lightbox-nav--next {
        right: 8px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .lightbox,
      .lightbox-content {
        animation-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  }
})
export class PhotoLightboxComponent {
  readonly ICONS = ICONS;

  /** Aktuálisan megjelenített személy */
  readonly person = input<TabloPersonItem | null>(null);

  /** Képes személyek listája navigációhoz */
  readonly personsWithPhotos = input<TabloPersonItem[]>([]);

  readonly close = output<void>();
  readonly navigate = output<TabloPersonItem>();

  readonly canNavigatePrev = computed(() => {
    const p = this.person();
    if (!p) return false;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    return idx > 0;
  });

  readonly canNavigateNext = computed(() => {
    const p = this.person();
    if (!p) return false;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    return idx < list.length - 1;
  });

  onKeydown(event: KeyboardEvent): void {
    if (!this.person()) return;

    switch (event.key) {
      case 'Escape':
        event.stopImmediatePropagation();
        this.close.emit();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigatePrevInternal();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateNextInternal();
        break;
    }
  }

  navigatePrev(event: MouseEvent): void {
    event.stopPropagation();
    this.navigatePrevInternal();
  }

  navigateNext(event: MouseEvent): void {
    event.stopPropagation();
    this.navigateNextInternal();
  }

  private navigatePrevInternal(): void {
    const p = this.person();
    if (!p) return;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    if (idx > 0) {
      this.navigate.emit(list[idx - 1]);
    }
  }

  private navigateNextInternal(): void {
    const p = this.person();
    if (!p) return;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    if (idx < list.length - 1) {
      this.navigate.emit(list[idx + 1]);
    }
  }
}
