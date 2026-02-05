import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserBadgeComponent } from '../../../../../../shared/components/navbar/components/user-badge/user-badge.component';
import { ContactBadgeComponent } from '../../../../../../shared/components/navbar/components/contact-badge/contact-badge.component';
import { GuestBadgeComponent } from '../../../../../../shared/components/navbar/components/guest-badge/guest-badge.component';

/**
 * Top Bar User Badges - Badge komponensek a felhasználó információkhoz.
 */
@Component({
  selector: 'app-top-bar-user-badges',
  standalone: true,
  imports: [
    CommonModule,
    UserBadgeComponent,
    ContactBadgeComponent,
    GuestBadgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showUserBadges() && userInfoMode() === 'badges') {
      <div class="hidden sm:flex items-center gap-2 ml-2">
        <!-- Kapcsolattartó neve (code token esetén) -->
        @if (isCode() && contactDisplayName()) {
          <app-contact-badge
            [contactName]="contactDisplayName()"
            (edit)="contactEditClick.emit()"
          />
        }

        <!-- Regisztrált vendég neve (share token esetén) -->
        @if (isGuest() && hasGuestSession()) {
          <app-user-badge
            [displayName]="displayName()"
            (edit)="guestEditClick.emit()"
          />
        }

        <!-- Vendég badge (ha share token ÉS nincs regisztrált session) -->
        @if (isGuest() && !hasGuestSession()) {
          <app-guest-badge />
        }

        <!-- Admin előnézet badge -->
        @if (isPreview()) {
          <span
            class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
            role="status"
          >
            Admin előnézet
          </span>
        }
      </div>
    }
  `
})
export class TopBarUserBadgesComponent {
  // Inputs
  readonly showUserBadges = input<boolean>(true);
  readonly userInfoMode = input<'badges' | 'inline'>('badges');
  readonly isCode = input<boolean>(false);
  readonly isGuest = input<boolean>(false);
  readonly isPreview = input<boolean>(false);
  readonly hasGuestSession = input<boolean>(false);
  readonly displayName = input<string | null>(null);
  readonly contactDisplayName = input<string | null>(null);

  // Outputs
  readonly guestEditClick = output<void>();
  readonly contactEditClick = output<void>();
}
