import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, ContactPerson } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { ProjectModeService } from '../../../core/services/project-mode.service';
import { PokeService } from '../../../core/services/poke.service';
import { GuestNameResult } from '../../components/guest-name-dialog/guest-name-dialog.component';
import { ContactEditResult, ContactData } from '../../components/contact-edit-dialog/contact-edit-dialog.component';
import { NavbarProjectInfo } from './navbar.component';

/**
 * Navbar State Service
 *
 * A navbar komponens teljes belso allapotkezeleseert felelos:
 * - Auth allapot (tokenType, canFinalize, primaryContact)
 * - Guest session kovetes
 * - Dialog allapotok es eredmenyek kezelese
 * - Kijelentkezes logika
 * - Status badge szamitas
 * - Navigacios menupont lathatasag
 */
@Injectable()
export class NavbarStateService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly projectModeService = inject(ProjectModeService);
  private readonly pokeService = inject(PokeService);

  // --- Auth allapot ---
  readonly canFinalize = signal<boolean>(false);
  readonly isGuest = signal<boolean>(false);
  readonly isPreview = signal<boolean>(false);
  readonly isCode = signal<boolean>(false);
  readonly primaryContact = signal<ContactPerson | null>(null);

  // --- Guest session ---
  readonly hasGuestSession = signal<boolean>(false);
  readonly guestName = signal<string | null>(null);
  readonly guestEmail = signal<string | null>(null);

  // --- Szarmaztatott ertekek ---
  readonly displayName = computed(() => this.guestName());
  readonly contactDisplayName = computed(() => this.primaryContact()?.name ?? null);

  // --- Poke ---
  readonly pokeUnreadCount = this.pokeService.unreadCount;

  // --- Guest edit dialog ---
  readonly showEditDialog = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly updateError = signal<string | null>(null);

  // --- Contact edit dialog ---
  readonly showContactEditDialog = signal<boolean>(false);
  readonly isContactUpdating = signal<boolean>(false);
  readonly contactUpdateError = signal<string | null>(null);
  readonly contactEditData = signal<ContactData>({ name: '', email: '', phone: '' });

  // --- Kijelentkezes ---
  loggingOut = false;

  /** Tailwind szin mapping status badge-ekhez */
  private readonly colorMap: Record<string, { bg: string; text: string }> = {
    gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  /**
   * Feliratkozasok inicializalasa (ngOnInit-bol hivando)
   */
  initSubscriptions(): void {
    this.authService.canFinalize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.canFinalize.set(value));

    this.authService.tokenType$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tokenType => {
        this.isGuest.set(tokenType === 'share');
        this.isPreview.set(tokenType === 'preview');
        this.isCode.set(tokenType === 'code');
      });

    this.authService.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(project => {
        const contact = project?.contacts?.[0] ?? null;
        this.primaryContact.set(contact);
      });

    this.guestService.guestSession$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(session => {
        this.hasGuestSession.set(!!session);
        this.guestName.set(session?.guestName ?? null);
        this.guestEmail.set(session?.guestEmail ?? null);

        if (session) {
          this.pokeService.refreshUnreadCount()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  // --- Status badge ---

  getStatusBadgeClasses(projectInfo: NavbarProjectInfo | null): string {
    const color = projectInfo?.tabloStatus?.color || projectInfo?.userStatusColor || 'gray';
    const colorClasses = this.colorMap[color] || this.colorMap['gray'];
    return `${colorClasses.bg} ${colorClasses.text}`;
  }

  getStatusName(projectInfo: NavbarProjectInfo | null): string | null {
    return projectInfo?.tabloStatus?.name || projectInfo?.userStatus || null;
  }

  // --- Navigacios menupont lathatasag ---

  showSamples(projectInfo: NavbarProjectInfo | null): boolean {
    return this.projectModeService.showSamples(projectInfo);
  }

  showOrderData(projectInfo: NavbarProjectInfo | null): boolean {
    return this.projectModeService.showOrderData(projectInfo);
  }

  showTemplateChooser(projectInfo: NavbarProjectInfo | null): boolean {
    return this.projectModeService.showTemplateChooser(projectInfo);
  }

  showPersons(projectInfo: NavbarProjectInfo | null): boolean {
    return this.projectModeService.showMissingPersons(projectInfo);
  }

  showFinalization(projectInfo: NavbarProjectInfo | null): boolean {
    if (!this.projectModeService.canShowFinalization(projectInfo)) return false;
    return this.canFinalize();
  }

  showVoting(projectInfo: NavbarProjectInfo | null): boolean {
    return this.projectModeService.showVoting(projectInfo);
  }

  // --- Guest edit dialog ---

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
          this.updateError.set(err.message || 'Hiba tortent a mentes soran');
        }
      });
  }

  // --- Contact edit dialog ---

  openContactEditDialog(): void {
    const contact = this.primaryContact();
    this.contactEditData.set({
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? ''
    });
    this.contactUpdateError.set(null);
    this.showContactEditDialog.set(true);
  }

  closeContactEditDialog(): void {
    this.showContactEditDialog.set(false);
    this.contactUpdateError.set(null);
  }

  onContactEditResult(result: ContactEditResult): void {
    if (result.action === 'close') {
      this.closeContactEditDialog();
      return;
    }

    this.isContactUpdating.set(true);
    this.contactUpdateError.set(null);

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
        error: (err: Error) => {
          this.isContactUpdating.set(false);
          this.contactUpdateError.set(err.message || 'Hiba tortent a mentes soran');
        }
      });
  }

  // --- Kijelentkezes ---

  logout(onMenuClose: () => void): void {
    if (this.loggingOut) return;

    this.loggingOut = true;
    onMenuClose();

    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // AuthService.clearAuth() mar atiranyit /login-ra
        },
        error: () => {
          this.loggingOut = false;
        }
      });
  }
}
