import {
  Component,
  inject,
  HostListener,
  ChangeDetectionStrategy,
  effect,
  input,
  output,
  computed
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { ScrollLockService } from '../../../services/scroll-lock.service';
import { MenuItem } from '../../models/menu-item.model';

/**
 * User info interface a mobil menü alsó részéhez
 */
export interface MobileNavUserInfo {
  name: string;
  email?: string;
}

/**
 * Mobile Nav Overlay Component
 *
 * Mobil nézetben a hamburger menüből kinyíló overlay.
 * - Dark theme backdrop + slide-in sidebar
 * - Navigáció után automatikus bezárás
 * - Escape billentyű bezárás
 * - Lucide ikonok
 * - A11y: Focus trap, aria-expanded
 * - Opcionális user section (marketinges stílusban)
 * - Opcionális egyedi menüelemek (customMenuItems)
 */
@Component({
  selector: 'app-mobile-nav-overlay',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  template: `
    @if (sidebarState.isMobile()) {
      <!-- Backdrop (dark) -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]
               transition-opacity duration-200"
        [ngClass]="{
          'opacity-0 pointer-events-none': !sidebarState.isOpen(),
          'opacity-100': sidebarState.isOpen()
        }"
        (click)="sidebarState.close()"
        aria-hidden="true"
      ></div>

      <!-- Sidebar Overlay (dark theme) -->
      <aside
        class="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px]
               bg-slate-900 z-[250] shadow-2xl
               transition-transform duration-200 ease-out
               flex flex-col"
        [ngClass]="{
          '-translate-x-full': !sidebarState.isOpen(),
          'translate-x-0': sidebarState.isOpen()
        }"
        [attr.aria-hidden]="!sidebarState.isOpen()"
        role="dialog"
        aria-modal="true"
        aria-label="Mobil navigáció"
      >
        <!-- Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
          <span class="text-lg font-medium text-slate-200">Menü</span>
          <button
            class="p-2 hover:bg-slate-800 rounded-full transition-colors
                   text-slate-300 hover:text-slate-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            (click)="sidebarState.close()"
            aria-label="Menü bezárása"
            type="button"
          >
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Menu Items -->
        <nav class="flex-1 overflow-y-auto py-4" aria-label="Fő navigáció">
          @for (item of menuItems(); track item.id) {
            <div class="px-2 mb-1">
              @if (item.children && item.children.length > 0) {
                <!-- Section with children -->
                <button
                  class="flex items-center justify-between w-full px-4 py-3
                         text-slate-300 hover:bg-slate-800/60 hover:text-slate-200
                         rounded-lg transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  (click)="toggleSection(item.id)"
                  [attr.aria-expanded]="isExpanded(item.id)"
                  type="button"
                >
                  <div class="flex items-center gap-3">
                    @if (item.icon) {
                      <lucide-icon [name]="item.icon" [size]="20"></lucide-icon>
                    }
                    <span class="text-sm font-medium">{{ item.label }}</span>
                  </div>
                  <svg
                    class="w-4 h-4 text-slate-500 transition-transform duration-200"
                    [ngClass]="{'rotate-180': isExpanded(item.id)}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                @if (isExpanded(item.id)) {
                  <div class="ml-4 mt-1 space-y-0.5 border-l border-slate-700/50 pl-3
                              mobile-expand-animation">
                    @for (child of item.children; track child.id; let i = $index) {
                      <a
                        [routerLink]="child.route"
                        routerLinkActive="child-active"
                        #rla="routerLinkActive"
                        class="block px-4 py-2.5 text-sm rounded-lg
                               transition-all duration-200
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                               focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        [ngClass]="{
                          'text-slate-300 hover:bg-slate-800/60 hover:text-slate-200': !rla.isActive,
                          'bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-white': rla.isActive,
                          'opacity-50 pointer-events-none': child.disabled
                        }"
                        (click)="onNavigate()"
                        [style.animation-delay]="(i * 0.05) + 's'"
                      >
                        {{ child.label }}
                        @if (child.badge) {
                          <span
                            class="ml-2 px-1.5 py-0.5 text-xs font-medium
                                   bg-red-500/20 text-red-400 rounded-full"
                          >
                            {{ child.badge }}
                          </span>
                        }
                      </a>
                    }
                  </div>
                }
              } @else {
                <!-- Simple item -->
                <a
                  [routerLink]="item.route"
                  routerLinkActive="item-active"
                  #rla="routerLinkActive"
                  class="flex items-center gap-3 px-4 py-3
                         rounded-lg transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  [ngClass]="{
                    'text-slate-300 hover:bg-slate-800/60 hover:text-slate-200': !rla.isActive,
                    'bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-white': rla.isActive,
                    'opacity-50 pointer-events-none': item.disabled
                  }"
                  (click)="onNavigate()"
                >
                  @if (item.icon) {
                    <lucide-icon [name]="item.icon" [size]="20"></lucide-icon>
                  }
                  <span class="text-sm">{{ item.label }}</span>
                  @if (item.badge) {
                    <span
                      class="ml-auto px-2 py-0.5 text-xs font-medium
                             bg-red-500/20 text-red-400 rounded-full"
                    >
                      {{ item.badge }}
                    </span>
                  }
                </a>
              }
            </div>
          }

          <!-- Divider -->
          @if (bottomMenuItems().length > 0) {
            <div class="my-4 mx-4 border-t border-slate-800"></div>

            <!-- Bottom Items -->
            @for (item of bottomMenuItems(); track item.id) {
              <div class="px-2 mb-1">
                <a
                  [routerLink]="item.route"
                  routerLinkActive="item-active"
                  #rla="routerLinkActive"
                  class="flex items-center gap-3 px-4 py-3
                         rounded-lg transition-all duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  [ngClass]="{
                    'text-slate-300 hover:bg-slate-800/60 hover:text-slate-200': !rla.isActive,
                    'bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-white': rla.isActive
                  }"
                  (click)="onNavigate()"
                >
                  @if (item.icon) {
                    <lucide-icon [name]="item.icon" [size]="20"></lucide-icon>
                  }
                  <span class="text-sm">{{ item.label }}</span>
                </a>
              </div>
            }
          }
        </nav>

        <!-- User Section (opcionális - ha userInfo megadva) -->
        @if (userInfo()) {
          <div class="border-t border-slate-700/50 p-4 flex-shrink-0">
            <div class="flex flex-col mb-3">
              <span class="font-semibold text-[0.9375rem] text-slate-200">
                {{ userInfo()?.name }}
              </span>
              @if (userInfo()?.email) {
                <span class="text-[0.8125rem] text-slate-400">
                  {{ userInfo()?.email }}
                </span>
              }
            </div>
            <button
              class="flex items-center gap-2 w-full px-4 py-3
                     bg-red-500/10 border border-red-500/20
                     rounded-lg text-red-400 text-sm font-medium
                     transition-all duration-150
                     hover:bg-red-500/20 hover:text-red-300
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              (click)="onLogout()"
              type="button"
            >
              <lucide-icon name="log-out" [size]="18"></lucide-icon>
              Kijelentkezés
            </button>
          </div>
        }
      </aside>
    }
  `,
  styles: [`
    @keyframes mobile-expand-down {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-expand-animation {
      animation: mobile-expand-down 200ms ease forwards;
    }

    /* Safari support: prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .mobile-expand-animation {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavOverlayComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly menuConfig = inject(MenuConfigService);
  private readonly scrollLockService = inject(ScrollLockService);

  // Opcionális egyedi menüelemek (ha nincs megadva, MenuConfigService-ből jön)
  customMenuItems = input<MenuItem[]>();

  // User section adatok (opcionális - ha megadva, megjelenik az alsó rész)
  userInfo = input<MobileNavUserInfo>();

  // Logout callback (opcionális - ha megadva, megjelenik a kijelentkezés gomb)
  logoutEvent = output<void>();

  // Computed: aktuális menüelemek (custom vagy MenuConfig)
  protected menuItems = computed(() => {
    const custom = this.customMenuItems();
    return custom && custom.length > 0 ? custom : this.menuConfig.menuItems();
  });

  // Computed: bottom menüelemek (csak ha nincs custom)
  protected bottomMenuItems = computed(() => {
    const custom = this.customMenuItems();
    // Ha custom menu van, nem használunk bottom items-et
    return custom && custom.length > 0 ? [] : this.menuConfig.bottomMenuItems();
  });

  constructor() {
    // Body scroll lock effect
    effect(() => {
      if (this.sidebarState.isOpen() && this.sidebarState.isMobile()) {
        this.scrollLockService.lock();
      } else {
        this.scrollLockService.unlock();
      }
    });
  }

  /**
   * Escape billentyű bezárja az overlay-t
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.sidebarState.isOpen()) {
      this.sidebarState.close();
    }
  }

  /**
   * Szekció toggle
   */
  toggleSection(id: string): void {
    this.sidebarState.toggleSection(id);
  }

  /**
   * Szekció kibontott-e
   */
  isExpanded(id: string): boolean {
    return this.sidebarState.isSectionExpanded(id);
  }

  /**
   * Navigáció után bezárás
   */
  onNavigate(): void {
    this.sidebarState.close();
  }

  /**
   * Kijelentkezés kezelése
   */
  onLogout(): void {
    this.sidebarState.close();
    this.logoutEvent.emit();
  }
}
