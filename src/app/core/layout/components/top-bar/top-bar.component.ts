import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { AuthService, ContactPerson, TokenType } from '../../../services/auth.service';
import { GuestService, GuestSession } from '../../../services/guest.service';
import { ClipboardService } from '../../../services/clipboard.service';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';
import { PokeService } from '../../../services/poke.service';

// Navbar child komponensek újrafelhasználása
import { UserBadgeComponent } from '../../../../shared/components/navbar/components/user-badge/user-badge.component';
import { ContactBadgeComponent } from '../../../../shared/components/navbar/components/contact-badge/contact-badge.component';
import { GuestBadgeComponent } from '../../../../shared/components/navbar/components/guest-badge/guest-badge.component';
import { GuestNameDialogComponent, GuestNameResult } from '../../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ContactEditDialogComponent, ContactEditResult, ContactData } from '../../../../shared/components/contact-edit-dialog/contact-edit-dialog.component';
import { PokeReceivedDialogComponent } from '../../../../shared/components/poke-received-dialog/poke-received-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TabloStorageService } from '../../../services/tablo-storage.service';

/**
 * Top Bar Component
 *
 * Felső sáv a következőkkel:
 * - Bal: Hamburger gomb (mobile) + Logo
 * - Közép: Partner info (KÖTELEZŐ, mindig látható)
 * - Jobb: Értesítések + User badge/avatar + Logout
 */
@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationBellComponent,
    UserBadgeComponent,
    ContactBadgeComponent,
    GuestBadgeComponent,
    GuestNameDialogComponent,
    ContactEditDialogComponent,
    PokeReceivedDialogComponent,
    ConfirmDialogComponent
  ],
  template: `
    <header
      class="h-14 md:h-16 backdrop-blur-md border-b border-slate-200/50 shadow-sm left-0 right-0 z-40"
      [class.fixed]="position() === 'fixed'"
      [class.sticky]="position() === 'sticky'"
      [class.top-0]="true"
      [style.background]="'var(--shell-topbar-bg, rgba(255, 255, 255, 0.8))'"
    >
      <div class="h-full flex items-center justify-between px-3 md:px-4 lg:px-6">
        <!-- Left: Hamburger + Logo -->
        <div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <!-- Hamburger (mobile only) -->
          <button
            class="p-2 hover:bg-slate-100 rounded-lg md:hidden
                   transition-colors duration-150
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            (click)="sidebarState.toggle()"
            [attr.aria-expanded]="sidebarState.isOpen()"
            aria-label="Menü megnyitása"
            type="button"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Logo -->
          <a [routerLink]="homeRoute()" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            @if (logoIcon()) {
              <span class="text-xl md:text-2xl">{{ logoIcon() }}</span>
            }
            <span class="text-base md:text-lg font-bold text-gray-900">
              Tablókirály
            </span>
            @if (roleBadge()) {
              <span class="hidden sm:inline-block px-2 py-1 text-[0.6875rem] md:text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 rounded-xl">
                {{ roleBadge() }}
              </span>
            }
          </a>

          <!-- User badges (badge mód esetén) -->
          @if (showUserBadges() && userInfoMode() === 'badges') {
            <div class="hidden sm:flex items-center gap-2 ml-2">
              <!-- Kapcsolattartó neve (code token esetén) -->
              @if (isCode() && contactDisplayName()) {
                <app-contact-badge
                  [contactName]="contactDisplayName()"
                  (edit)="openContactEditDialog()"
                />
              }

              <!-- Regisztrált vendég neve (share token esetén) -->
              @if (isGuest() && hasGuestSession()) {
                <app-user-badge
                  [displayName]="displayName()"
                  (edit)="openEditDialog()"
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
        </div>

        <!-- Spacer a jobb oldali elemekhez -->
        <div class="flex-1"></div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <!-- Inline user info (marketinges módhoz) -->
          @if (userInfoMode() === 'inline' && externalUserInfo()) {
            <div class="hidden md:flex flex-col items-end mr-2">
              <span class="font-semibold text-sm text-gray-700">{{ externalUserInfo()!.name }}</span>
              @if (externalUserInfo()!.email) {
                <span class="text-xs text-gray-500">{{ externalUserInfo()!.email }}</span>
              }
            </div>
          }

          <!-- Poke Badge (kapott bökések) -->
          @if (showPokeBadge() && hasGuestSession()) {
            <button
              type="button"
              class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              (click)="showPokeDialog.set(true)"
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

          <!-- Switch Account button (dev only) -->
          @if (showAccountSwitch() && isDev && hasMultipleSessions()) {
            <button
              class="p-2 hover:bg-amber-100 rounded-lg transition-colors duration-150
                     flex items-center gap-1 bg-amber-50 border border-amber-200
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              (click)="switchAccount()"
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
            (click)="handleLogout()"
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
      </div>
    </header>

    <!-- Guest Name Edit Dialog (share token esetén) -->
    @if (showEditDialog()) {
      <app-guest-name-dialog
        [mode]="'edit'"
        [initialName]="guestName() || ''"
        [initialEmail]="guestEmail() || ''"
        [canClose]="true"
        [isSubmitting]="isUpdating()"
        [errorMessage]="updateError()"
        (resultEvent)="onEditDialogResult($event)"
      />
    }

    <!-- Contact Edit Dialog (code token esetén) -->
    @if (showContactEditDialog()) {
      <app-contact-edit-dialog
        [initialData]="contactEditData()"
        [isSaving]="isContactUpdating()"
        (resultEvent)="onContactEditResult($event)"
      />
    }

    <!-- Poke Received Dialog -->
    @if (showPokeDialog()) {
      <app-poke-received-dialog (closedEvent)="showPokeDialog.set(false)" />
    }

    <!-- Logout Confirm Dialog -->
    @if (showLogoutConfirm()) {
      <app-confirm-dialog
        title="Kijelentkezés"
        message="Biztosan ki szeretnél jelentkezni?"
        confirmText="Kijelentkezés"
        cancelText="Mégse"
        confirmType="warning"
        [isSubmitting]="loggingOut()"
        (resultEvent)="onLogoutConfirmResult($event)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly pokeService = inject(PokeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(TabloStorageService);
  private readonly router = inject(Router);

  // ============ Konfigurálható Input-ok (backward compatible defaults) ============

  /** Pozíció: fixed (kapcsolattartó/vendég) vagy sticky (marketinges) */
  readonly position = input<'fixed' | 'sticky'>('fixed');

  /** Logo ikon (pl. '📊' marketingesnél) - opcionális */
  readonly logoIcon = input<string>('');

  /** Szerep badge (pl. 'Marketinges') - opcionális */
  readonly roleBadge = input<string>('');

  /** Értesítések megjelenítése */
  readonly showNotifications = input<boolean>(true);

  /** Bökés badge megjelenítése */
  readonly showPokeBadge = input<boolean>(true);

  /** User badge-ek megjelenítése (ContactBadge, UserBadge, GuestBadge) */
  readonly showUserBadges = input<boolean>(true);

  /** Account váltás gomb megjelenítése (dev only) */
  readonly showAccountSwitch = input<boolean>(true);

  /** User info megjelenítési mód: 'badges' = badge komponensek, 'inline' = név + email szöveges */
  readonly userInfoMode = input<'badges' | 'inline'>('badges');

  /** Külső user info (inline módhoz) */
  readonly externalUserInfo = input<{ name: string; email?: string } | null>(null);

  /** Home route (logo link) */
  readonly homeRoute = input<string>('/home');

  // ============ Output-ok ============

  /** Logout event (emit-elődik mindig, de csak external használat esetén kell rá figyelni) */
  readonly logoutEvent = output<void>();

  /**
   * External logout kezelés (true = a szülő komponens kezeli a logout-ot a logoutEvent output-on keresztül)
   * Ha true, az authService.logout() NEM hívódik, csak az event emit-elődik.
   */
  readonly useExternalLogout = input<boolean>(false);

  // ============ Flags ============

  /** Dev környezet flag */
  readonly isDev = !environment.production;

  /** Van-e több tárolt session */
  readonly hasMultipleSessions = computed(() => this.storage.getStoredSessions().length > 1);

  // ============ Signals from Observables (toSignal) ============

  /** Projekt adatok (from Observable) */
  private readonly projectSignal = toSignal(this.authService.project$, { initialValue: null });

  /** Token típus (from Observable) - 'unknown' az initialValue mert az a default TokenService-ben */
  private readonly tokenTypeSignal = toSignal(this.authService.tokenType$, { initialValue: 'unknown' as TokenType });

  /** Guest session (from Observable) */
  private readonly guestSessionSignal = toSignal(this.guestService.guestSession$, { initialValue: null as GuestSession | null });

  // ============ Computed Signals ============

  /** Projekt adatok */
  readonly project = computed(() => this.projectSignal());

  /** Token típusok */
  readonly isGuest = computed(() => this.tokenTypeSignal() === 'share');
  readonly isPreview = computed(() => this.tokenTypeSignal() === 'preview');
  readonly isCode = computed(() => this.tokenTypeSignal() === 'code');

  /** Guest session */
  readonly hasGuestSession = computed(() => !!this.guestSessionSignal());
  readonly guestName = computed(() => this.guestSessionSignal()?.guestName ?? null);
  readonly guestEmail = computed(() => this.guestSessionSignal()?.guestEmail ?? null);

  /** Contact (code token) */
  readonly primaryContact = computed(() => this.projectSignal()?.contacts?.[0] ?? null);

  /** Display names */
  readonly displayName = computed(() => this.guestName());
  readonly contactDisplayName = computed(() => this.primaryContact()?.name ?? null);

  /** Poke unread count */
  readonly pokeUnreadCount = this.pokeService.unreadCount;

  // ============ Local State Signals ============

  /** Kijelentkezés folyamatban */
  readonly loggingOut = signal(false);

  /** Edit dialog (guest) */
  readonly showEditDialog = signal(false);
  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);

  /** Contact edit dialog (code) */
  readonly showContactEditDialog = signal(false);
  readonly isContactUpdating = signal(false);
  readonly contactEditData = signal<ContactData>({ name: '', email: '', phone: '' });

  /** Poke received dialog */
  readonly showPokeDialog = signal(false);

  /** Logout confirm dialog */
  readonly showLogoutConfirm = signal(false);

  // ============ Actions ============

  /**
   * Email másolása vágólapra
   */
  copyEmail(email: string): void {
    this.clipboardService.copyEmail(email);
  }

  /**
   * Logout gomb kattintás - confirm dialog megnyitása
   */
  handleLogout(): void {
    if (this.loggingOut()) return;
    this.showLogoutConfirm.set(true);
  }

  /**
   * Logout confirm dialog eredmény kezelése
   */
  onLogoutConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.showLogoutConfirm.set(false);
      return;
    }

    // Megerősítve - kijelentkezés
    this.sidebarState.close();

    // Ha useExternalLogout = true, csak emit és a szülő kezeli
    if (this.useExternalLogout()) {
      this.showLogoutConfirm.set(false);
      this.logoutEvent.emit();
      return;
    }

    // Default viselkedés: authService.logout()
    this.loggingOut.set(true);

    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showLogoutConfirm.set(false);
          // AuthService.clearAuth() már átirányít /login-ra
        },
        error: () => {
          this.loggingOut.set(false);
          this.showLogoutConfirm.set(false);
        }
      });
  }

  /**
   * Kijelentkezés (backwards compatibility)
   * @deprecated Use handleLogout() instead
   */
  logout(): void {
    this.handleLogout();
  }

  /**
   * Guest edit dialog megnyitása
   */
  openEditDialog(): void {
    this.updateError.set(null);
    this.showEditDialog.set(true);
  }

  /**
   * Guest edit dialog bezárása
   */
  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.updateError.set(null);
  }

  /**
   * Guest edit dialog eredmény kezelése
   */
  onEditDialogResult(result: GuestNameResult): void {
    if (result.action === 'close') {
      this.closeEditDialog();
      return;
    }

    this.isUpdating.set(true);
    this.updateError.set(null);

    this.guestService.updateGuestInfo(result.name, result.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUpdating.set(false);
          this.closeEditDialog();
        },
        error: (err: Error) => {
          this.isUpdating.set(false);
          this.updateError.set(err.message || 'Hiba történt a mentés során');
        }
      });
  }

  /**
   * Contact edit dialog megnyitása (code token)
   */
  openContactEditDialog(): void {
    const contact = this.primaryContact();
    this.contactEditData.set({
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? ''
    });
    this.showContactEditDialog.set(true);
  }

  /**
   * Contact edit dialog bezárása
   */
  closeContactEditDialog(): void {
    this.showContactEditDialog.set(false);
  }

  /**
   * Contact edit dialog eredmény kezelése
   */
  onContactEditResult(result: ContactEditResult): void {
    if (result.action === 'close') {
      this.closeContactEditDialog();
      return;
    }

    this.isContactUpdating.set(true);

    const contactData = {
      name: result.data.name,
      email: result.data.email || null,
      phone: result.data.phone || null
    };

    this.authService.updateContact(contactData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isContactUpdating.set(false);
          this.closeContactEditDialog();
        },
        error: () => {
          this.isContactUpdating.set(false);
        }
      });
  }

  /**
   * Fiókváltás - session chooser megnyitása (dev only)
   */
  switchAccount(): void {
    // Aktív session törlése, hogy a chooser megjelenjen
    this.storage.clearActiveSession();
    this.router.navigate(['/choose-session']);
  }
}
