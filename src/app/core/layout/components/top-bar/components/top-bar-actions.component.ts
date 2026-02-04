import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationBellComponent } from '../../../../../shared/components/notification-bell/notification-bell.component';

/**
 * Top Bar Actions - Jobb oldali gombok és akciók.
 */
@Component({
  selector: 'app-top-bar-actions',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
      <!-- Inline user info -->
      @if (userInfoMode() === 'inline' && externalUserInfo()) {
        <div class="hidden md:flex flex-col items-end mr-2">
          <span class="font-semibold text-sm text-gray-700">{{ externalUserInfo()!.name }}</span>
          @if (externalUserInfo()!.email) {
            <span class="text-xs text-gray-500">{{ externalUserInfo()!.email }}</span>
          }
        </div>
      }

      <!-- Poke Badge -->
      @if (showPokeBadge() && hasGuestSession()) {
        <button
          type="button"
          class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          (click)="pokeClick.emit()"
          title="Kapott bökések"
        >
          <span class="text-lg">👉</span>
          @if (pokeUnreadCount() > 0) {
            <span
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                     text-xs font-bold text-white bg-red-500 rounded-full px-1 animate-pulse"
            >
              {{ pokeUnreadCount() }}
            </span>
          }
        </button>
      }

      <!-- Notification Bell -->
      @if (showNotifications() && (hasGuestSession() || isCode())) {
        <app-notification-bell />
      }

      <!-- Switch Account button -->
      @if (showAccountSwitch() && isDev() && hasMultipleSessions()) {
        <button
          class="p-2 hover:bg-amber-100 rounded-lg transition-colors duration-150
                 flex items-center gap-1 bg-amber-50 border border-amber-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          (click)="switchAccountClick.emit()"
          aria-label="Fiókváltás"
          title="Fiókváltás (dev)"
          type="button"
        >
          <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="hidden lg:inline text-sm text-amber-700">Váltás</span>
        </button>
      }

      <!-- Logout button -->
      <button
        class="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150
               flex items-center gap-1
               focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        (click)="logoutClick.emit()"
        [disabled]="loggingOut()"
        aria-label="Kijelentkezés"
        title="Kijelentkezés"
        type="button"
      >
        <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 17L21 12L16 7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="hidden lg:inline text-sm text-gray-600">Kilépés</span>
      </button>
    </div>
  `
})
export class TopBarActionsComponent {
  // Inputs
  readonly userInfoMode = input<'badges' | 'inline'>('badges');
  readonly externalUserInfo = input<{ name: string; email?: string } | null>(null);
  readonly showPokeBadge = input<boolean>(true);
  readonly showNotifications = input<boolean>(true);
  readonly showAccountSwitch = input<boolean>(true);
  readonly hasGuestSession = input<boolean>(false);
  readonly isCode = input<boolean>(false);
  readonly isDev = input<boolean>(false);
  readonly hasMultipleSessions = input<boolean>(false);
  readonly pokeUnreadCount = input<number>(0);
  readonly loggingOut = input<boolean>(false);

  // Outputs
  readonly pokeClick = output<void>();
  readonly switchAccountClick = output<void>();
  readonly logoutClick = output<void>();
}
