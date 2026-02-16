import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';

export type ProjectDetailTab = 'overview' | 'users' | 'samples' | 'settings' | 'print';

export interface TabDefinition {
  id: ProjectDetailTab;
  label: string;
  icon: string;
}

export const PROJECT_DETAIL_TABS: TabDefinition[] = [
  { id: 'overview', label: 'Áttekintés', icon: ICONS.LAYOUT_DASHBOARD },
  { id: 'users', label: 'Felhasználók', icon: ICONS.USERS },
  { id: 'samples', label: 'Minták', icon: ICONS.PALETTE },
  { id: 'print', label: 'Nyomda', icon: ICONS.PRINTER },
  { id: 'settings', label: 'Beállítások', icon: ICONS.SETTINGS },
];

@Component({
  selector: 'app-project-detail-tabs',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs-nav">
      @for (tab of visibleTabs(); track tab.id) {
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
        padding: 8px 12px;
        font-size: 0.8125rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition-duration: 0.01ms !important;
      }
    }
  `],
})
export class ProjectDetailTabsComponent {
  activeTab = input.required<ProjectDetailTab>();
  tabChange = output<ProjectDetailTab>();

  /** Ha megadva, csak ezek a tab-ok jelennek meg */
  hiddenTabs = input<ProjectDetailTab[]>([]);

  visibleTabs = computed(() => {
    const hidden = this.hiddenTabs();
    if (hidden.length === 0) return PROJECT_DETAIL_TABS;
    return PROJECT_DETAIL_TABS.filter(tab => !hidden.includes(tab.id));
  });
}
