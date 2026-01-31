import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { SidebarMenuItemComponent } from '../sidebar-menu-item/sidebar-menu-item.component';

/**
 * Sidebar Component
 *
 * Desktop/tablet sidebar navigáció.
 * - Desktop (1024px+): 240px széles, teljes label-ek
 * - Tablet (768-1023px): 60px széles, csak ikonok + tooltip
 * - Mobile (< 768px): hidden (MobileNavOverlay helyett)
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarMenuItemComponent],
  template: `
    <aside
      class="fixed top-14 md:top-16 left-0 bottom-0
             hidden md:flex flex-col
             bg-slate-900 border-r border-slate-800
             transition-all duration-200 z-30
             overflow-hidden"
      [class.w-[60px]]="sidebarState.isTablet()"
      [class.w-[240px]]="!sidebarState.isTablet()"
    >
      <!-- Menu Items (scrollable) -->
      <nav class="flex-1 overflow-y-auto py-4 sidebar-scrollbar" aria-label="Fő navigáció">
        @for (item of menuConfig.menuItems(); track item.id) {
          <app-sidebar-menu-item
            [item]="item"
            [collapsed]="sidebarState.isTablet()"
          />
        }
      </nav>

      <!-- Bottom Items (sticky footer) -->
      @if (menuConfig.bottomMenuItems().length > 0) {
        <div class="border-t border-slate-800 py-2 flex-shrink-0">
          @for (item of menuConfig.bottomMenuItems(); track item.id) {
            <app-sidebar-menu-item
              [item]="item"
              [collapsed]="sidebarState.isTablet()"
            />
          }
        </div>
      }
    </aside>
  `,
  styles: [`
    /* Custom scrollbar for dark sidebar */
    .sidebar-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
    }

    .sidebar-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(100, 116, 139, 0.5);
      border-radius: 3px;
    }

    .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(100, 116, 139, 0.7);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly menuConfig = inject(MenuConfigService);
}
