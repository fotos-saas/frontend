import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { TabManagerService } from '../../services/tab-manager.service';
import { TabContextMenuComponent } from '../tab-context-menu/tab-context-menu.component';
import { DEFAULT_TAB_URL } from '../../models/tab.model';
import type { Tab } from '../../models/tab.model';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [DragDropModule, LucideAngularModule, MatTooltipModule, TabContextMenuComponent],
  templateUrl: './tab-bar.component.html',
  styleUrl: './tab-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBarComponent {
  readonly tabManager = inject(TabManagerService);
  readonly ICONS = ICONS;
  readonly DEFAULT_TAB_URL = DEFAULT_TAB_URL;

  // Kontextus menu allapot
  readonly contextMenuTab = signal<Tab | null>(null);
  readonly contextMenuX = signal(0);
  readonly contextMenuY = signal(0);

  /** Drag & drop esemeny */
  onTabDrop(event: CdkDragDrop<Tab[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.tabManager.moveTab(event.previousIndex, event.currentIndex);
    }
  }

  /** Kozepso kattintas — tab bezarasa */
  onMiddleClick(event: MouseEvent, tabId: string): void {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.tabManager.closeTab(tabId);
    }
  }

  /** Tab bezaro gomb kattintas */
  closeTab(event: MouseEvent, tabId: string): void {
    event.stopPropagation();
    this.tabManager.closeTab(tabId);
  }

  /** Kontextus menu megnyitasa */
  openContextMenu(event: MouseEvent, tab: Tab): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuTab.set(tab);
    this.contextMenuX.set(event.clientX);
    this.contextMenuY.set(event.clientY);
  }

  /** Kontextus menu bezarasa */
  closeContextMenu(): void {
    this.contextMenuTab.set(null);
  }

  /** Tab billentyuzet kezeles (nyilak, Enter, Delete) */
  onTabKeydown(event: KeyboardEvent, tabId: string): void {
    const tabs = this.tabManager.tabs();
    const index = tabs.findIndex(t => t.id === tabId);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        if (index < tabs.length - 1) {
          this.tabManager.activateTab(tabs[index + 1].id);
        }
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          this.tabManager.activateTab(tabs[index - 1].id);
        }
        break;

      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.tabManager.closeTab(tabId);
        break;

      case 'Home':
        event.preventDefault();
        if (tabs.length > 0) {
          this.tabManager.activateTab(tabs[0].id);
        }
        break;

      case 'End':
        event.preventDefault();
        if (tabs.length > 0) {
          this.tabManager.activateTab(tabs[tabs.length - 1].id);
        }
        break;
    }
  }
}
