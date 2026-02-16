import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { DragScrollDirective } from '../../../../../../shared/directives/drag-scroll/drag-scroll.directive';

export type GalleryTab = 'gallery' | 'monitoring';

interface GalleryTabDef {
  id: GalleryTab;
  label: string;
  icon: string;
}

const GALLERY_TABS: GalleryTabDef[] = [
  { id: 'gallery', label: 'Galéria kezelés', icon: ICONS.IMAGE },
  { id: 'monitoring', label: 'Nyomon követés', icon: ICONS.ACTIVITY },
];

@Component({
  selector: 'app-gallery-tabs',
  standalone: true,
  imports: [LucideAngularModule, DragScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs-nav" appDragScroll>
      @for (tab of tabs; track tab.id) {
        <button
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === tab.id"
          (click)="tabChange.emit(tab.id)"
        >
          <lucide-icon [name]="tab.icon" [size]="16" />
          <span>{{ tab.label }}</span>
        </button>
      }
    </nav>
  `,
  styles: [`
    .tabs-nav {
      display: flex;
      border-bottom: 2px solid #e2e8f0;
      margin: -4px;
      margin-bottom: 24px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      margin: 4px;
      padding: 10px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      lucide-icon {
        margin-right: 6px;
      }

      &:focus {
        outline: none;
      }

      &:hover {
        color: #1e293b;
      }

      &--active {
        color: var(--color-primary, #1e3a5f);
        border-bottom-color: var(--color-primary, #1e3a5f);
        font-weight: 600;
      }
    }

    @media (max-width: 480px) {
      .tab-btn {
        padding: 8px 10px;
        font-size: 0.8125rem;

        lucide-icon {
          display: none;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition-duration: 0.01ms !important;
      }
    }
  `],
})
export class GalleryTabsComponent {
  activeTab = input.required<GalleryTab>();
  tabChange = output<GalleryTab>();

  readonly tabs = GALLERY_TABS;
}
