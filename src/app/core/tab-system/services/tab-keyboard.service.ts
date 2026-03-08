/**
 * TabKeyboardService — billentyuparancsok kezelese
 *
 * Ctrl/Cmd+T: uj tab
 * Ctrl/Cmd+W: tab bezaras
 * Ctrl+Tab: kovetkezo tab
 * Ctrl+Shift+Tab: elozo tab
 * Ctrl/Cmd+1-9: tab valtas index alapjan
 */

import { Injectable, inject, DestroyRef, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { ElectronService } from '../../services/electron.service';
import { TabManagerService } from './tab-manager.service';
import { DEFAULT_TAB_URL } from '../models/tab.model';

@Injectable({ providedIn: 'root' })
export class TabKeyboardService {
  private readonly tabManager = inject(TabManagerService);
  private readonly electronService = inject(ElectronService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private cleanupFns: Array<() => void> = [];

  /** Billentyuparancsok es middle-click inicializalasa */
  initialize(): void {
    if (!this.tabManager.isTabSystemEnabled()) return;

    this.setupBrowserKeyboardShortcuts();
    this.setupElectronIpcShortcuts();
    this.setupMiddleClickHandler();

    this.destroyRef.onDestroy(() => {
      this.cleanupFns.forEach(fn => fn());
      this.cleanupFns = [];
    });
  }

  /** Angular oldalon kezelt billentyuk (fallback ha az Electron IPC nem fogja el) */
  private setupBrowserKeyboardShortcuts(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      const isMod = this.electronService.isMac ? event.metaKey : event.ctrlKey;
      if (!isMod) return;

      switch (event.key) {
        case 't':
        case 'T':
          event.preventDefault();
          this.tabManager.createTab(DEFAULT_TAB_URL);
          break;

        case 'w':
        case 'W': {
          event.preventDefault();
          const activeId = this.tabManager.activeTabId();
          if (activeId) this.tabManager.closeTab(activeId);
          break;
        }

        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            this.tabManager.previousTab();
          } else {
            this.tabManager.nextTab();
          }
          break;

        default: {
          // Ctrl/Cmd+1-9
          const num = parseInt(event.key, 10);
          if (num >= 1 && num <= 9) {
            event.preventDefault();
            this.tabManager.switchToTabByIndex(num - 1);
          }
          break;
        }
      }
    });
  }

  /** Globalis middle-click handler — routerLink elemeken uj tab-ot nyit */
  private setupMiddleClickHandler(): void {
    fromEvent<MouseEvent>(document, 'auxclick').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      if (event.button !== 1) return; // Csak kozepso gomb

      // Keressuk a legkozelebbi [routerLink] vagy [href] elemet
      const target = event.target as HTMLElement;
      const linkEl = target.closest<HTMLAnchorElement>('a[routerLink], a[ng-reflect-router-link]');
      if (!linkEl) return;

      const href = linkEl.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//')) return;

      event.preventDefault();
      event.stopPropagation();
      this.tabManager.createTab(href, { activate: false });
    });
  }

  /** Electron IPC-n erkezo billentyuparancsok (before-input-event) */
  private setupElectronIpcShortcuts(): void {
    if (!this.electronService.isElectron || !window.electronAPI?.tab) return;

    const api = window.electronAPI!.tab;

    const c1 = api.onNewTab(() => {
      this.ngZone.run(() => this.tabManager.createTab(DEFAULT_TAB_URL));
    });
    this.cleanupFns.push(c1);

    const c2 = api.onCloseTab(() => {
      this.ngZone.run(() => {
        const activeId = this.tabManager.activeTabId();
        if (activeId) this.tabManager.closeTab(activeId);
      });
    });
    this.cleanupFns.push(c2);

    const c3 = api.onNextTab(() => {
      this.ngZone.run(() => this.tabManager.nextTab());
    });
    this.cleanupFns.push(c3);

    const c4 = api.onPrevTab(() => {
      this.ngZone.run(() => this.tabManager.previousTab());
    });
    this.cleanupFns.push(c4);

    const c5 = api.onSwitchTo((index: number) => {
      this.ngZone.run(() => this.tabManager.switchToTabByIndex(index - 1));
    });
    this.cleanupFns.push(c5);
  }
}
