import { Component, ChangeDetectionStrategy, input, output, computed, inject, ElementRef, HostListener } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { TabManagerService } from '../../services/tab-manager.service';
import type { Tab, TabContextMenuAction } from '../../models/tab.model';

@Component({
  selector: 'app-tab-context-menu',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="tab-context-menu"
         [style.left.px]="x()"
         [style.top.px]="y()"
         role="menu"
         aria-label="Tab muveletek">
      @for (action of menuActions(); track action.id) {
        @if (action.separator) {
          <div class="menu-separator" role="separator"></div>
        } @else {
          <button class="menu-item"
                  role="menuitem"
                  [disabled]="action.disabled"
                  (click)="onAction(action.id)">
            @if (action.icon) {
              <lucide-icon [name]="action.icon" [size]="14" />
            }
            <span>{{ action.label }}</span>
          </button>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      z-index: 10000;
    }

    .tab-context-menu {
      position: absolute;
      min-width: 200px;
      background: var(--ctx-bg, #fff);
      border: 1px solid var(--ctx-border, rgba(0,0,0,0.12));
      border-radius: 8px;
      padding: 4px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);

      :host-context(.dark) & {
        --ctx-bg: #2d2d30;
        --ctx-border: rgba(255,255,255,0.1);
      }
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: none;
      color: var(--ctx-text, #333);
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      border-radius: 0;
      min-height: 32px;

      :host-context(.dark) & {
        --ctx-text: #ccc;
      }

      &:hover:not(:disabled) {
        background: var(--ctx-hover, rgba(0,0,0,0.06));

        :host-context(.dark) & {
          --ctx-hover: rgba(255,255,255,0.08);
        }
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary-500, #7c3aed);
        outline-offset: -2px;
      }
    }

    .menu-separator {
      height: 1px;
      background: var(--ctx-border, rgba(0,0,0,0.08));
      margin: 4px 0;

      :host-context(.dark) & {
        --ctx-border: rgba(255,255,255,0.08);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContextMenuComponent {
  readonly tab = input.required<Tab>();
  readonly x = input<number>(0);
  readonly y = input<number>(0);
  readonly closed = output<void>();

  private readonly tabManager = inject(TabManagerService);
  private readonly elementRef = inject(ElementRef);

  readonly menuActions = computed<TabContextMenuAction[]>(() => {
    const tab = this.tab();
    const tabs = this.tabManager.tabs();
    const tabIndex = tabs.findIndex(t => t.id === tab.id);
    const hasTabsToRight = tabIndex < tabs.length - 1;
    const hasOtherTabs = tabs.length > 1;
    const activeId = this.tabManager.activeTabId();
    const canSplit = activeId !== tab.id && hasOtherTabs;

    return [
      {
        id: 'pin',
        label: tab.isPinned ? 'Feloldas' : 'Tab rogzitese',
        icon: ICONS.PIN,
      },
      {
        id: 'duplicate',
        label: 'Tab duplikalasa',
        icon: ICONS.COPY,
      },
      { id: 'sep1', label: '', separator: true },
      {
        id: 'close-others',
        label: 'Tobbi tab bezarasa',
        icon: ICONS.X,
        disabled: !hasOtherTabs,
      },
      {
        id: 'close-right',
        label: 'Jobbra levo tabok bezarasa',
        disabled: !hasTabsToRight,
      },
      { id: 'sep2', label: '', separator: true },
      {
        id: 'split-h',
        label: 'Felosztott nezet - Vizszintes',
        icon: ICONS.COLUMNS_3,
        disabled: !canSplit,
      },
      {
        id: 'split-v',
        label: 'Felosztott nezet - Fuggoleges',
        icon: ICONS.ROWS_3,
        disabled: !canSplit,
      },
      { id: 'sep3', label: '', separator: true },
      {
        id: 'close',
        label: 'Tab bezarasa',
        icon: ICONS.X,
        disabled: tab.isPinned,
      },
    ];
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onAction(actionId: string): void {
    const tabId = this.tab().id;

    switch (actionId) {
      case 'pin':
        this.tabManager.togglePinTab(tabId);
        break;
      case 'duplicate':
        this.tabManager.duplicateTab(tabId);
        break;
      case 'close-others':
        this.tabManager.closeOtherTabs(tabId);
        break;
      case 'close-right':
        this.tabManager.closeTabsToRight(tabId);
        break;
      case 'split-h':
        this.splitWithActiveTab('horizontal');
        break;
      case 'split-v':
        this.splitWithActiveTab('vertical');
        break;
      case 'close':
        this.tabManager.closeTab(tabId);
        break;
    }

    this.closed.emit();
  }

  private splitWithActiveTab(mode: 'horizontal' | 'vertical'): void {
    const activeId = this.tabManager.activeTabId();
    const tabId = this.tab().id;
    if (activeId && activeId !== tabId) {
      this.tabManager.splitView(activeId, tabId, mode);
    }
  }
}
