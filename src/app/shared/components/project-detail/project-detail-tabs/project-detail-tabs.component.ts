import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';
import { DragScrollDirective } from '../../../directives/drag-scroll/drag-scroll.directive';

export type ProjectDetailTab = 'overview' | 'emails' | 'users' | 'samples' | 'tasks' | 'settings' | 'print' | 'activity';

export interface TabDefinition {
  id: ProjectDetailTab;
  label: string;
  icon: string;
}

export const PROJECT_DETAIL_TABS: TabDefinition[] = [
  { id: 'overview', label: 'Áttekintés', icon: ICONS.LAYOUT_DASHBOARD },
  { id: 'emails', label: 'E-mailek', icon: ICONS.MAIL },
  { id: 'users', label: 'Felhasználók', icon: ICONS.USERS },
  { id: 'samples', label: 'Minták', icon: ICONS.PALETTE },
  { id: 'tasks', label: 'Feladatok', icon: ICONS.LIST_TODO },
  { id: 'activity', label: 'Aktivitás', icon: ICONS.ACTIVITY },
  { id: 'print', label: 'Nyomda', icon: ICONS.PRINTER },
  { id: 'settings', label: 'Beállítások', icon: ICONS.SETTINGS },
];

@Component({
  selector: 'app-project-detail-tabs',
  standalone: true,
  imports: [LucideAngularModule, DragScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs-nav" appDragScroll>
      @for (tab of visibleTabs(); track tab.id) {
        <button
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === tab.id"
          (click)="tabChange.emit(tab.id)"
        >
          <lucide-icon [name]="tab.icon" [size]="16" />
          <span>{{ tab.label }}</span>
          @if (getBadge(tab.id); as badge) {
            <span class="tab-badge">{{ badge }}</span>
          }
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

    .tab-badge {
      margin-left: 6px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
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
export class ProjectDetailTabsComponent {
  activeTab = input.required<ProjectDetailTab>();
  tabChange = output<ProjectDetailTab>();

  /** Ha megadva, csak ezek a tab-ok jelennek meg */
  hiddenTabs = input<ProjectDetailTab[]>([]);

  /** Badge számok tab-onként (pl. { tasks: 3 }) */
  badges = input<Partial<Record<ProjectDetailTab, number>>>({});

  visibleTabs = computed(() => {
    const hidden = this.hiddenTabs();
    if (hidden.length === 0) return PROJECT_DETAIL_TABS;
    return PROJECT_DETAIL_TABS.filter(tab => !hidden.includes(tab.id));
  });

  getBadge(tabId: ProjectDetailTab): number | null {
    const val = this.badges()[tabId];
    return val && val > 0 ? val : null;
  }
}
