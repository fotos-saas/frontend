import { Injectable, signal, computed, NgZone, inject, DestroyRef, OnDestroy } from '@angular/core';
import { TabloStorageService } from '../../services/tablo-storage.service';

/**
 * Sidebar mode típusok
 */
export type SidebarMode = 'expanded' | 'collapsed' | 'hidden' | 'overlay';

/**
 * Sidebar State Service
 *
 * Kezeli a sidebar állapotát (nyitva/zárva, kibontott szekciók).
 * Támogatja a responsive viselkedést és localStorage persistenciát.
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarStateService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(TabloStorageService);

  /** Storage key a globális beállításokhoz */
  private readonly STORAGE_KEY = 'sidebar_expanded_sections';

  /** Debounce timeout a resize-hoz */
  private resizeDebounceTimeout?: ReturnType<typeof setTimeout>;
  private readonly DEBOUNCE_DELAY = 100;

  // ============ Private Signals ============

  /** Mobile overlay nyitva van-e */
  private readonly _isOpen = signal(false);

  /** Kibontott szekciók ID-k listája */
  private readonly _expandedSections = signal<string[]>([]);

  /** Mobile mód (< 768px) */
  private readonly _isMobile = signal(false);

  /** Tablet mód (768px - 1023px) */
  private readonly _isTablet = signal(false);

  // ============ Public Readonly Signals ============

  readonly isOpen = this._isOpen.asReadonly();
  readonly expandedSections = this._expandedSections.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();
  readonly isTablet = this._isTablet.asReadonly();

  // ============ Computed Signals ============

  /**
   * Sidebar mód a breakpoint alapján
   * - expanded: desktop (1024px+)
   * - collapsed: tablet (768px - 1023px)
   * - overlay: mobile, menü nyitva
   * - hidden: mobile, menü zárva
   */
  readonly mode = computed<SidebarMode>(() => {
    if (this._isMobile()) {
      return this._isOpen() ? 'overlay' : 'hidden';
    }
    if (this._isTablet()) {
      return 'collapsed';
    }
    return 'expanded';
  });

  /**
   * Sidebar szélesség pixelben
   */
  readonly sidebarWidth = computed(() => {
    const mode = this.mode();
    switch (mode) {
      case 'expanded': return 240;
      case 'collapsed': return 60;
      case 'overlay': return Math.min(window.innerWidth * 0.85, 320);
      default: return 0;
    }
  });

  constructor() {
    this.initResponsiveListeners();
    this.loadExpandedSections();
  }

  ngOnDestroy(): void {
    if (this.resizeDebounceTimeout) {
      clearTimeout(this.resizeDebounceTimeout);
    }
  }

  // ============ Actions ============

  /**
   * Toggle mobile overlay
   */
  toggle(): void {
    this._isOpen.update(v => !v);
  }

  /**
   * Open mobile overlay
   */
  open(): void {
    this._isOpen.set(true);
  }

  /**
   * Close mobile overlay
   */
  close(): void {
    this._isOpen.set(false);
  }

  /**
   * Toggle section expand/collapse
   */
  toggleSection(sectionId: string): void {
    this._expandedSections.update(sections => {
      const isExpanded = sections.includes(sectionId);
      const newSections = isExpanded
        ? sections.filter(s => s !== sectionId)
        : [...sections, sectionId];

      this.saveExpandedSections(newSections);
      return newSections;
    });
  }

  /**
   * Expand a specific section (if not already)
   */
  expandSection(sectionId: string): void {
    this._expandedSections.update(sections => {
      if (!sections.includes(sectionId)) {
        const newSections = [...sections, sectionId];
        this.saveExpandedSections(newSections);
        return newSections;
      }
      return sections;
    });
  }

  /**
   * Collapse a specific section
   */
  collapseSection(sectionId: string): void {
    this._expandedSections.update(sections => {
      if (sections.includes(sectionId)) {
        const newSections = sections.filter(s => s !== sectionId);
        this.saveExpandedSections(newSections);
        return newSections;
      }
      return sections;
    });
  }

  /**
   * Check if section is expanded
   */
  isSectionExpanded(sectionId: string): boolean {
    return this._expandedSections().includes(sectionId);
  }

  // ============ Private Methods ============

  /**
   * Initialize responsive breakpoint listeners
   */
  private initResponsiveListeners(): void {
    const checkBreakpoints = () => {
      this._isMobile.set(window.innerWidth < 768);
      this._isTablet.set(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    // Initial check
    checkBreakpoints();

    // Debounced resize listener
    const onResize = () => {
      if (this.resizeDebounceTimeout) {
        clearTimeout(this.resizeDebounceTimeout);
      }

      this.resizeDebounceTimeout = setTimeout(() => {
        this.ngZone.run(() => {
          checkBreakpoints();
        });
      }, this.DEBOUNCE_DELAY);
    };

    window.addEventListener('resize', onResize);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  /**
   * Load expanded sections from global storage
   */
  private loadExpandedSections(): void {
    const saved = this.storage.getGlobalSetting<string[]>(this.STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
      this._expandedSections.set(saved);
    }
  }

  /**
   * Save expanded sections to global storage
   */
  private saveExpandedSections(sections: string[]): void {
    this.storage.setGlobalSetting(this.STORAGE_KEY, sections);
  }
}
