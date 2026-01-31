import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MenuItem } from '../../models/menu-item.model';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { NavigationLoadingService } from '../../../services/navigation-loading.service';

/**
 * Sidebar Menu Item Component
 *
 * Egyetlen menüelem megjelenítése a sidebar-ban.
 * Támogatja:
 * - Egyszerű elemeket (route + icon + label)
 * - Szekciók (children + expand/collapse)
 * - Collapsed mód (csak ikon, tooltip)
 * - Badge megjelenítés
 * - Disabled állapot
 * - Dark theme + gradient active state
 * - Lucide ikonok
 * - A11y: focus-visible, aria-expanded
 */
@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  template: `
    @if (item().children && item().children!.length > 0) {
      <!-- Section with children -->
      <div class="mx-2 mb-1">
        <!-- Parent button -->
        <button
          class="menu-item flex items-center w-full px-3 py-2.5
                 text-slate-300 hover:bg-slate-800/60 hover:text-slate-200
                 rounded-lg transition-all duration-200 ease-out
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          [ngClass]="{
            'justify-center': collapsed(),
            'justify-between': !collapsed()
          }"
          (click)="toggleSection()"
          [attr.title]="collapsed() ? item().label : null"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'section-' + item().id"
          type="button"
        >
          <div class="flex items-center gap-3">
            @if (item().icon) {
              <lucide-icon
                [name]="item().icon!"
                [size]="20"
                class="flex-shrink-0"
              ></lucide-icon>
            }
            @if (!collapsed()) {
              <span class="text-sm font-medium truncate">{{ item().label }}</span>
            }
          </div>
          @if (!collapsed()) {
            <svg
              class="w-4 h-4 text-slate-500 transition-transform duration-200"
              [ngClass]="{'rotate-180': isExpanded()}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          }
        </button>

        <!-- Children (animated) -->
        @if (!collapsed() && isExpanded()) {
          <div
            [id]="'section-' + item().id"
            class="ml-4 mt-1 space-y-0.5 border-l border-slate-700/50 pl-3"
          >
            @for (child of item().children; track child.id; let i = $index) {
              <a
                [routerLink]="child.route"
                routerLinkActive="child-active"
                #rla="routerLinkActive"
                class="child-item block px-3 py-2 text-sm rounded-lg
                       transition-all duration-200
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                [ngClass]="{
                  'text-slate-300 hover:bg-slate-800/60 hover:text-slate-200': !rla.isActive,
                  'bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-white border-l-2 -ml-[2px] border-purple-500': rla.isActive,
                  'opacity-50 pointer-events-none': child.disabled
                }"
                [style.animation-delay]="(i * 0.05) + 's'"
              >
                {{ child.label }}
                @if (child.badge) {
                  <span
                    class="child-badge ml-2 w-5 h-5 text-xs font-bold
                           bg-amber-500 text-slate-900 rounded-full
                           inline-flex items-center justify-center"
                  >
                    {{ child.badge }}
                  </span>
                }
              </a>
            }
          </div>
        }
      </div>
    } @else {
      <!-- Simple item (no children) -->
      <div class="mx-2 mb-1">
        <a
          [routerLink]="item().route"
          routerLinkActive="item-active"
          #rla="routerLinkActive"
          class="menu-item flex items-center gap-3 px-3 py-2.5
                 rounded-lg transition-all duration-200 ease-out
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          [ngClass]="{
            'justify-center': collapsed(),
            'text-slate-300 hover:bg-slate-800/60 hover:text-slate-200': !rla.isActive && !isPending(),
            'bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-white border-l-2 border-purple-500': rla.isActive && !isPending(),
            'opacity-50 pointer-events-none': item().disabled,
            'menu-item--pending': isPending()
          }"
          [attr.title]="collapsed() ? item().label : null"
          (click)="onMenuClick($event, rla.isActive)"
        >
          @if (item().icon) {
            <lucide-icon
              [name]="item().icon!"
              [size]="20"
              class="flex-shrink-0"
            ></lucide-icon>
          }
          @if (!collapsed()) {
            <span class="text-sm truncate">{{ item().label }}</span>
          }
          @if (item().badge && !collapsed()) {
            <span
              class="ml-auto px-2 py-0.5 text-xs font-medium
                     bg-red-500/20 text-red-400 rounded-full flex-shrink-0"
            >
              {{ item().badge }}
            </span>
          }
        </a>
      </div>
    }
  `,
  styles: [`
    /* Child item staggered animation */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .child-item {
      opacity: 0;
      animation: slideIn 0.2s ease-out forwards;
    }

    /* Badge pulse animation - figyelemfelkeltő */
    .child-badge {
      animation: badgePulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
    }

    @keyframes badgePulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
      }
      50% {
        opacity: 1;
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);
      }
    }

    /* Menu item click feedback - feltűnőbb effekt */
    .menu-item:active:not(.menu-item--pending) {
      transform: scale(0.95);
      opacity: 0.8;
      background: rgba(139, 92, 246, 0.25) !important;
      transition: transform 0.05s ease, opacity 0.05s ease, background 0.05s ease;
    }

    /* Pending state - navigáció közben */
    .menu-item--pending {
      pointer-events: none;
      position: relative;
      overflow: hidden;
      /* Szöveg szín megőrzése */
      color: #e2e8f0 !important; /* slate-200 */
      background: linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%) !important;
      border-left: 2px solid #a855f7;
    }

    .menu-item--pending::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: pendingShimmer 0.8s ease-in-out infinite;
    }

    @keyframes pendingShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Safari support: prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .child-item {
        animation: none;
        opacity: 1;
        transform: none;
      }

      .menu-item:active:not(.menu-item--pending) {
        transform: none;
      }

      .menu-item--pending::after {
        animation: none;
        background: rgba(255, 255, 255, 0.1);
      }

      .child-badge {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuItemComponent {
  /** Menüelem adat */
  readonly item = input.required<MenuItem>();

  /** Collapsed mód (csak ikonok látszanak) */
  readonly collapsed = input<boolean>(false);

  private readonly router = inject(Router);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly navigationLoading = inject(NavigationLoadingService);

  /** Szekció kibontott-e */
  readonly isExpanded = computed(() =>
    this.sidebarState.isSectionExpanded(this.item().id)
  );

  /** Pending state - erre a route-ra navigálunk */
  readonly isPending = computed(() => {
    const route = this.item().route;
    if (!route) return false;
    return this.navigationLoading.isPendingRoute(route);
  });

  /**
   * Szekció toggle
   */
  toggleSection(): void {
    this.sidebarState.toggleSection(this.item().id);
  }

  /**
   * Menüpont kattintás - ha aktív, újratöltjük az oldalt
   */
  onMenuClick(event: MouseEvent, isActive: boolean): void {
    if (isActive && this.item().route) {
      event.preventDefault();
      // Újranavigálás ugyanarra a route-ra (onSameUrlNavigation: 'reload' kell a routerben)
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([this.item().route]);
      });
    }
  }
}
