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
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { AuthService, TokenType } from '../../../services/auth.service';
import { GuestService, GuestSession } from '../../../services/guest.service';
import { PokeService } from '../../../services/poke.service';
import { ElectronService } from '../../../services/electron.service';
import { TabloStorageService } from '../../../services/tablo-storage.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ContactEditDialogComponent, ContactEditResult, ContactData } from '../../../../shared/components/contact-edit-dialog/contact-edit-dialog.component';
import { PokeReceivedDialogComponent } from '../../../../shared/components/poke-received-dialog/poke-received-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TopBarActionsComponent } from './components/top-bar-actions/top-bar-actions.component';
import { TopBarUserBadgesComponent } from './components/top-bar-user-badges/top-bar-user-badges.component';
import { PartnerSwitcherDropdownComponent } from '../../../../shared/components/partner-switcher-dropdown/partner-switcher-dropdown.component';

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
    RouterLink,
    GuestNameDialogComponent,
    ContactEditDialogComponent,
    PokeReceivedDialogComponent,
    ConfirmDialogComponent,
    TopBarActionsComponent,
    TopBarUserBadgesComponent,
    PartnerSwitcherDropdownComponent,
  ],
  templateUrl: './top-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly pokeService = inject(PokeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(TabloStorageService);
  private readonly router = inject(Router);
  private readonly electronService = inject(ElectronService);

  /** Electron */
  readonly isElectronMac = computed(() => this.electronService.isElectron && this.electronService.isMac);
  readonly isElectron = this.electronService.isElectron;

  // ============ Konfigurálható Input-ok ============

  readonly position = input<'fixed' | 'sticky'>('fixed');
  readonly logoIcon = input<string>('');
  readonly roleBadge = input<string>('');
  readonly brandName = input<string | null>(null);
  readonly brandLogoUrl = input<string | null>(null);
  readonly hideBrandName = input<boolean>(false);
  readonly showNotifications = input<boolean>(true);
  readonly showPokeBadge = input<boolean>(true);
  readonly showUserBadges = input<boolean>(true);
  readonly showAccountSwitch = input<boolean>(true);
  readonly userInfoMode = input<'badges' | 'inline'>('badges');
  readonly externalUserInfo = input<{ name: string; email?: string } | null>(null);
  readonly homeRoute = input<string>('/home');
  readonly useExternalLogout = input<boolean>(false);
  readonly showPartnerSwitcher = input<boolean>(false);
  readonly currentPartnerId = input<number | null>(null);

  // ============ Output-ok ============

  readonly logoutEvent = output<void>();

  // ============ Flags ============

  readonly isDev = !environment.production;
  readonly hasMultipleSessions = computed(() => this.storage.getStoredSessions().length > 1);

  // ============ Signals from Observables ============

  private readonly projectSignal = toSignal(this.authService.project$, { initialValue: null });
  private readonly tokenTypeSignal = toSignal(this.authService.tokenType$, { initialValue: 'unknown' as TokenType });
  private readonly guestSessionSignal = toSignal(this.guestService.guestSession$, { initialValue: null as GuestSession | null });

  // ============ Computed Signals ============

  readonly isGuest = computed(() => this.tokenTypeSignal() === 'share');
  readonly isPreview = computed(() => this.tokenTypeSignal() === 'preview');
  readonly isCode = computed(() => this.tokenTypeSignal() === 'code');
  readonly hasGuestSession = computed(() => !!this.guestSessionSignal());
  readonly guestName = computed(() => this.guestSessionSignal()?.guestName ?? null);
  readonly guestEmail = computed(() => this.guestSessionSignal()?.guestEmail ?? null);
  readonly primaryContact = computed(() => this.projectSignal()?.contacts?.[0] ?? null);
  readonly displayName = computed(() => this.guestName());
  readonly contactDisplayName = computed(() => this.primaryContact()?.name ?? null);
  readonly pokeUnreadCount = this.pokeService.unreadCount;

  // ============ Local State Signals ============

  readonly loggingOut = signal(false);
  readonly showEditDialog = signal(false);
  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);
  readonly showContactEditDialog = signal(false);
  readonly isContactUpdating = signal(false);
  readonly contactEditData = signal<ContactData>({ name: '', email: '', phone: '' });
  readonly showPokeDialog = signal(false);
  readonly showLogoutConfirm = signal(false);

  // ============ Actions ============

  handleLogout(): void {
    if (this.loggingOut()) return;
    this.showLogoutConfirm.set(true);
  }

  onLogoutConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.showLogoutConfirm.set(false);
      return;
    }

    this.sidebarState.close();

    if (this.useExternalLogout()) {
      this.showLogoutConfirm.set(false);
      this.logoutEvent.emit();
      return;
    }

    this.loggingOut.set(true);

    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showLogoutConfirm.set(false);
        },
        error: () => {
          this.loggingOut.set(false);
          this.showLogoutConfirm.set(false);
        }
      });
  }

  openEditDialog(): void {
    this.updateError.set(null);
    this.showEditDialog.set(true);
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.updateError.set(null);
  }

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

  openContactEditDialog(): void {
    const contact = this.primaryContact();
    this.contactEditData.set({
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? ''
    });
    this.showContactEditDialog.set(true);
  }

  closeContactEditDialog(): void {
    this.showContactEditDialog.set(false);
  }

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

  switchAccount(): void {
    this.storage.clearActiveSession();
    this.router.navigate(['/choose-session']);
  }
}
