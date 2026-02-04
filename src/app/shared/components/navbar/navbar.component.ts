import { Component, input, signal, effect, HostListener, ChangeDetectionStrategy, ElementRef, ViewChild, OnDestroy, AfterViewInit, OnInit, DestroyRef, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, ContactPerson } from '../../../core/services/auth.service';
import { BreakpointService } from '../../../core/services/breakpoint.service';
import { ProjectModeService } from '../../../core/services/project-mode.service';
import { GuestService } from '../../../core/services/guest.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import { PokeService } from '../../../core/services/poke.service';
import { GuestNameResult, GuestNameDialogComponent } from '../../components/guest-name-dialog/guest-name-dialog.component';
import { ContactEditResult, ContactData, ContactEditDialogComponent } from '../../components/contact-edit-dialog/contact-edit-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Child komponensek (refaktorált badge-ek és mobile menu részek)
import { UserBadgeComponent } from './components/user-badge/user-badge.component';
import { ContactBadgeComponent } from './components/contact-badge/contact-badge.component';
import { GuestBadgeComponent } from './components/guest-badge/guest-badge.component';
import { MobileMenuUserComponent } from './components/mobile-menu-user/mobile-menu-user.component';

// Értesítési komponens
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

/**
 * Tablo Status interface
 */
export interface TabloStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}

/**
 * Projekt info interface (shared)
 */
export interface NavbarProjectInfo {
  schoolName: string | null;
  className: string | null;
  classYear: string | null;
  hasOrderData?: boolean;
  hasOrderAnalysis?: boolean;
  hasMissingPersons?: boolean;
  hasTemplateChooser?: boolean;
  /** Kiválasztott minták száma (0 = még nincs kiválasztva) */
  selectedTemplatesCount?: number;
  /** Minták száma (ha > 0, nem kell véglegesítés/minta választó) */
  samplesCount?: number;
  /** Aktív szavazások száma (ha > 0, megjelenik a Szavazások menüpont) */
  activePollsCount?: number;
  tabloStatus?: TabloStatus | null;
  userStatus?: string | null;
  userStatusColor?: string | null;
}

/**
 * Shared Navbar Component
 *
 * Egységes navbar a frontend-tablo alkalmazáshoz.
 * Megjeleníti a Tablókirály logót, opcionális projekt infót és navigációs linkeket.
 * Mobile-on hamburger menüvel slide-in drawer.
 */
@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        UserBadgeComponent,
        ContactBadgeComponent,
        GuestBadgeComponent,
        MobileMenuUserComponent,
        GuestNameDialogComponent,
        ContactEditDialogComponent,
        NotificationBellComponent
    ]
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  /** Signal-based inputs */
  readonly projectInfo = input<NavbarProjectInfo | null>(null);
  readonly activePage = input<'home' | 'samples' | 'order-data' | 'missing' | 'template-chooser' | 'order-finalization' | 'voting' | 'newsfeed' | 'forum'>('samples');

  /** Kijelentkezés folyamatban */
  loggingOut = false;

  /** Mobile menü nyitott állapot (signal) */
  mobileMenuOpen = signal<boolean>(false);

  /** Dinamikus mobile mód (true = hamburger menü, false = desktop) */
  isMobileMode = signal<boolean>(false);

  /** Véglegesíthet-e (csak kódos belépés esetén true) */
  canFinalize = signal<boolean>(false);

  /** Vendég felhasználó-e (share token) */
  isGuest = signal<boolean>(false);

  /** Admin előnézet-e (preview token) */
  isPreview = signal<boolean>(false);

  /** Kódos belépés-e (code token) */
  isCode = signal<boolean>(false);

  /** Elsődleges kapcsolattartó (code token esetén) */
  primaryContact = signal<ContactPerson | null>(null);

  /** Van-e regisztrált guest session */
  hasGuestSession = signal<boolean>(false);

  /** Guest neve (ha van session) */
  guestName = signal<string | null>(null);

  /** Guest email (ha van session) */
  guestEmail = signal<string | null>(null);

  /** Edit dialog megjelenítése */
  showEditDialog = signal<boolean>(false);

  /** Update folyamatban */
  isUpdating = signal<boolean>(false);

  /** Update hiba */
  updateError = signal<string | null>(null);

  /** ContactEditDialog megjelenítése (code token esetén) */
  showContactEditDialog = signal<boolean>(false);

  /** Contact update folyamatban */
  isContactUpdating = signal<boolean>(false);

  /** Contact update hiba */
  contactUpdateError = signal<string | null>(null);

  /** ContactEditDialog kezdeti adatai */
  contactEditData = signal<ContactData>({ name: '', email: '', phone: '' });

  /** Megjelenített név (guest session neve) */
  displayName = computed(() => this.guestName());

  /** Megjelenített név a code token esetén (kapcsolattartó neve) */
  contactDisplayName = computed(() => this.primaryContact()?.name ?? null);

  /** DestroyRef az automatikus unsubscribe-hoz (Angular 19+, modern pattern) */
  private destroyRef = inject(DestroyRef);

  /** Mobile menu element reference */
  @ViewChild('mobileMenu') mobileMenuRef!: ElementRef<HTMLElement>;

  /** Desktop content container reference */
  @ViewChild('desktopContent') desktopContentRef!: ElementRef<HTMLElement>;

  /** Navbar container reference */
  @ViewChild('navbarContainer') navbarContainerRef!: ElementRef<HTMLElement>;

  /** Tailwind color mapping for status badges */
  private readonly colorMap: Record<string, { bg: string; text: string }> = {
    gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  /** Poke service (bökés értesítések) */
  private readonly pokeService = inject(PokeService);

  /** Olvasatlan bökések száma */
  readonly pokeUnreadCount = this.pokeService.unreadCount;

  constructor(
    private authService: AuthService,
    private breakpointService: BreakpointService,
    private projectModeService: ProjectModeService,
    private guestService: GuestService,
    private scrollLockService: ScrollLockService
  ) {
    // Body scroll lock effect - reagál a menü állapotára
    effect(() => {
      if (this.mobileMenuOpen()) {
        this.scrollLockService.lock();
      } else {
        this.scrollLockService.unlock();
      }
    });
  }

  ngOnInit(): void {
    // Feliratkozás a canFinalize állapotra (takeUntilDestroyed: automatikus cleanup komponens destroy-kor)
    this.authService.canFinalize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.canFinalize.set(value);
      });

    // Feliratkozás a tokenType-ra a vendég/preview/code státusz követéséhez
    this.authService.tokenType$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tokenType => {
        this.isGuest.set(tokenType === 'share');
        this.isPreview.set(tokenType === 'preview');
        this.isCode.set(tokenType === 'code');
      });

    // Feliratkozás a project$-ra a kapcsolattartó követéséhez (code token esetén)
    this.authService.project$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(project => {
        const contact = project?.contacts?.[0] ?? null;
        this.primaryContact.set(contact);
      });

    // Feliratkozás a guest session-re
    this.guestService.guestSession$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(session => {
        this.hasGuestSession.set(!!session);
        this.guestName.set(session?.guestName ?? null);
        this.guestEmail.set(session?.guestEmail ?? null);

        // Ha van guest session, töltsük be a bökés unread count-ot
        if (session) {
          this.pokeService.refreshUnreadCount()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  ngAfterViewInit(): void {
    // Késleltetett inicializálás, hogy a DOM stabil legyen
    setTimeout(() => {
      this.breakpointService.observeElement(
        this.navbarContainerRef.nativeElement,
        this.desktopContentRef.nativeElement,
        this.isMobileMode
      );
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup: unlock scroll ha komponens destroy-olódik
    this.scrollLockService.unlock();

    // BreakpointService cleanup
    this.breakpointService.unobserve(this.navbarContainerRef.nativeElement);

    // MEGJEGYZÉS: A takeUntilDestroyed() automatikusan leiratkozik a subscriptionokról,
    // így nincs szükség manuális destroy$.next() és complete() hívásra
  }

  /**
   * Escape billentyű bezárja a menüt
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  /**
   * Focus trap - Tab billentyű kezelése nyitott menüben
   */
  @HostListener('document:keydown.tab', ['$event'])
  onTabKey(event: KeyboardEvent): void {
    if (!this.mobileMenuOpen() || !this.mobileMenuRef) return;

    const focusableElements = this.mobileMenuRef.nativeElement.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Shift+Tab az első elemen -> utolsóra ugrás
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
    // Tab az utolsó elemen -> elsőre ugrás
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Mobil menü ki/be kapcsolása
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  /**
   * Mobil menü bezárása
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Get status badge classes
   */
  getStatusBadgeClasses(): string {
    const info = this.projectInfo();
    const color = info?.tabloStatus?.color || info?.userStatusColor || 'gray';
    const colorClasses = this.colorMap[color] || this.colorMap['gray'];
    return `${colorClasses.bg} ${colorClasses.text}`;
  }

  /**
   * Get status name
   */
  getStatusName(): string | null {
    const info = this.projectInfo();
    return info?.tabloStatus?.name || info?.userStatus || null;
  }

  /**
   * Minták menüpont látható-e?
   * Delegálva: ProjectModeService
   */
  showSamples(): boolean {
    return this.projectModeService.showSamples(this.projectInfo());
  }

  /**
   * Megrendelési adatok menüpont látható-e?
   * Delegálva: ProjectModeService
   */
  showOrderData(): boolean {
    return this.projectModeService.showOrderData(this.projectInfo());
  }

  /**
   * Minta Választó menüpont látható-e?
   * Delegálva: ProjectModeService
   */
  showTemplateChooser(): boolean {
    return this.projectModeService.showTemplateChooser(this.projectInfo());
  }

  /**
   * Személyek menüpont látható-e?
   * Delegálva: ProjectModeService
   */
  showPersons(): boolean {
    return this.projectModeService.showMissingPersons(this.projectInfo());
  }

  /**
   * Véglegesítés menüpont látható-e?
   * Delegálva: ProjectModeService + canFinalize ellenőrzés
   */
  showFinalization(): boolean {
    if (!this.projectModeService.canShowFinalization(this.projectInfo())) return false;
    return this.canFinalize();
  }

  /**
   * Szavazások menüpont látható-e?
   * Delegálva: ProjectModeService
   */
  showVoting(): boolean {
    return this.projectModeService.showVoting(this.projectInfo());
  }

  /**
   * Edit dialog megnyitása
   */
  openEditDialog(): void {
    this.updateError.set(null);
    this.showEditDialog.set(true);
  }

  /**
   * Edit dialog bezárása (GuestNameDialog)
   */
  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.updateError.set(null);
  }

  /**
   * ContactEditDialog megnyitása (code token esetén)
   */
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

  /**
   * ContactEditDialog bezárása
   */
  closeContactEditDialog(): void {
    this.showContactEditDialog.set(false);
    this.contactUpdateError.set(null);
  }

  /**
   * ContactEditDialog eredmény kezelése
   */
  onContactEditResult(result: ContactEditResult): void {
    if (result.action === 'close') {
      this.closeContactEditDialog();
      return;
    }

    // Save action
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
          this.contactUpdateError.set(err.message || 'Hiba történt a mentés során');
        }
      });
  }

  /**
   * Guest adatok frissítése (dialog eredménye alapján)
   */
  onEditDialogResult(result: GuestNameResult): void {
    if (result.action === 'close') {
      this.closeEditDialog();
      return;
    }

    // Submit action
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
   * Kijelentkezés
   */
  logout(): void {
    if (this.loggingOut) return;

    this.loggingOut = true;
    this.closeMobileMenu();

    // Kijelentkezés (takeUntilDestroyed: automatikus cleanup komponens destroy-kor)
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // AuthService.clearAuth() már átirányít /login-ra
        },
        error: () => {
          // Hiba esetén is megtörtént a kijelentkezés (clearAuth)
          this.loggingOut = false;
        }
      });
  }
}
