import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../constants/icons.constants';

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

const PINNED_TAB_IDS: ProjectDetailTab[] = ['overview', 'tasks'];

@Component({
  selector: 'app-project-detail-tabs',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs-nav">
      @for (tab of pinnedTabs(); track tab.id) {
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

      @if (moreTabs().length > 0) {
        <div class="more-dropdown">
          <button
            class="tab-btn more-btn"
            [class.tab-btn--active]="!!activeMoreTab()"
            (click)="toggleDropdown($event)"
          >
            <lucide-icon [name]="ICONS.MORE_HORIZONTAL" [size]="16" />
            <span>{{ activeMoreTab()?.label || 'Továbbiak' }}</span>
            <lucide-icon [name]="ICONS.CHEVRON_DOWN" [size]="14" class="more-chevron" />
          </button>
          @if (dropdownOpen()) {
            <div class="more-backdrop" (click)="dropdownOpen.set(false)"></div>
            <div class="more-menu">
              @for (tab of moreTabs(); track tab.id) {
                <button
                  class="more-menu__item"
                  [class.more-menu__item--active]="activeTab() === tab.id"
                  (click)="selectMoreTab(tab.id)"
                >
                  <lucide-icon [name]="tab.icon" [size]="16" />
                  <span>{{ tab.label }}</span>
                  @if (getBadge(tab.id); as badge) {
                    <span class="tab-badge">{{ badge }}</span>
                  }
                </button>
              }
            </div>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    .tabs-nav {
      display: flex;
      align-items: stretch;
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

    .more-dropdown {
      position: relative;
      margin-left: auto;
    }

    .more-btn .more-chevron {
      margin-left: 4px;
      margin-right: 0;
    }

    .more-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 19;
    }

    .more-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 2px);
      min-width: 200px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      z-index: 20;
      padding: 4px;
      white-space: nowrap;
    }

    .more-menu__item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      border-radius: 6px;
      color: #475569;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;

      lucide-icon {
        margin-right: 8px;
        flex-shrink: 0;
      }

      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      &--active {
        background: #eff6ff;
        color: var(--color-primary, #1e3a5f);
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

      .more-menu__item lucide-icon {
        display: none;
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
  readonly ICONS = ICONS;

  activeTab = input.required<ProjectDetailTab>();
  tabChange = output<ProjectDetailTab>();

  hiddenTabs = input<ProjectDetailTab[]>([]);
  extraPinnedTabs = input<ProjectDetailTab[]>([]);
  badges = input<Partial<Record<ProjectDetailTab, number>>>({});

  dropdownOpen = signal(false);

  private allPinnedIds = computed(() => [...PINNED_TAB_IDS, ...this.extraPinnedTabs()]);

  pinnedTabs = computed(() => {
    const hidden = this.hiddenTabs();
    const pinned = this.allPinnedIds();
    return PROJECT_DETAIL_TABS
      .filter(tab => pinned.includes(tab.id))
      .filter(tab => !hidden.includes(tab.id));
  });

  moreTabs = computed(() => {
    const hidden = this.hiddenTabs();
    const pinned = this.allPinnedIds();
    return PROJECT_DETAIL_TABS
      .filter(tab => !pinned.includes(tab.id))
      .filter(tab => !hidden.includes(tab.id));
  });

  activeMoreTab = computed(() => {
    const active = this.activeTab();
    const more = this.moreTabs();
    return more.find(tab => tab.id === active) ?? null;
  });

  getBadge(tabId: ProjectDetailTab): number | null {
    const val = this.badges()[tabId];
    return val && val > 0 ? val : null;
  }

  toggleDropdown(e: Event): void {
    e.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  selectMoreTab(id: ProjectDetailTab): void {
    this.tabChange.emit(id);
    this.dropdownOpen.set(false);
  }
}
