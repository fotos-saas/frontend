import {
  Component, input, signal, effect,
  ChangeDetectionStrategy, ElementRef, viewChild,
  AfterViewInit, OnInit, inject, DestroyRef
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreakpointService } from '../../../core/services/breakpoint.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import { GuestNameResult, GuestNameDialogComponent } from '../../components/guest-name-dialog/guest-name-dialog.component';
import { ContactEditResult, ContactEditDialogComponent } from '../../components/contact-edit-dialog/contact-edit-dialog.component';

import { NgClass } from '@angular/common';
// Child komponensek (refaktoralt badge-ek es mobile menu reszek)
import { UserBadgeComponent } from './components/user-badge/user-badge.component';
import { ContactBadgeComponent } from './components/contact-badge/contact-badge.component';
import { GuestBadgeComponent } from './components/guest-badge/guest-badge.component';
import { MobileMenuUserComponent } from './components/mobile-menu-user/mobile-menu-user.component';

// Ertesitesi komponens
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

// Navbar state service
import { NavbarStateService } from './navbar-state.service';

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
  /** Kivalasztott mintak szama (0 = meg nincs kivalasztva) */
  selectedTemplatesCount?: number;
  /** Mintak szama (ha > 0, nem kell veglegesites/minta valaszto) */
  samplesCount?: number;
  /** Aktiv szavazasok szama (ha > 0, megjelenik a Szavazasok menupont) */
  activePollsCount?: number;
  tabloStatus?: TabloStatus | null;
  userStatus?: string | null;
  userStatusColor?: string | null;
}

/**
 * Shared Navbar Component
 *
 * Egységes navbar a frontend-tablo alkalmazáshoz.
 * Megjeleníti a TablóStúdió logót, opcionális projekt infót és navigációs linkeket.
 * Mobile-on hamburger menüvel slide-in drawer.
 */
@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        UserBadgeComponent,
        ContactBadgeComponent,
        GuestBadgeComponent,
        MobileMenuUserComponent,
        GuestNameDialogComponent,
        ContactEditDialogComponent,
        NotificationBellComponent,
        NgClass,
    ],
    providers: [NavbarStateService],
    host: {
      '(document:keydown.escape)': 'onEscapeKey()',
      '(document:keydown.tab)': 'onTabKey($any($event))',
    }
})
export class NavbarComponent implements OnInit, AfterViewInit {
  private readonly state = inject(NavbarStateService);
  private readonly breakpointService = inject(BreakpointService);
  private readonly scrollLockService = inject(ScrollLockService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal-based inputs */
  readonly projectInfo = input<NavbarProjectInfo | null>(null);
  readonly activePage = input<'home' | 'samples' | 'order-data' | 'missing' | 'template-chooser' | 'order-finalization' | 'voting' | 'newsfeed' | 'forum'>('samples');

  /** Partner branding (ha aktív) */
  readonly brandLogoUrl = input<string | null>(null);
  readonly brandName = input<string | null>(null);
  readonly hideBrandName = input<boolean>(false);

  /** Mobile menu nyitott allapot (signal) */
  mobileMenuOpen = signal<boolean>(false);

  /** Dinamikus mobile mod (true = hamburger menu, false = desktop) */
  isMobileMode = signal<boolean>(false);

  // --- Signal delegaciok a template szamara ---
  readonly canFinalize = this.state.canFinalize;
  readonly isGuest = this.state.isGuest;
  readonly isPreview = this.state.isPreview;
  readonly isCode = this.state.isCode;
  readonly primaryContact = this.state.primaryContact;
  readonly hasGuestSession = this.state.hasGuestSession;
  readonly guestName = this.state.guestName;
  readonly guestEmail = this.state.guestEmail;
  readonly displayName = this.state.displayName;
  readonly contactDisplayName = this.state.contactDisplayName;
  readonly pokeUnreadCount = this.state.pokeUnreadCount;

  // --- Dialog signal delegaciok ---
  readonly showEditDialog = this.state.showEditDialog;
  readonly isUpdating = this.state.isUpdating;
  readonly updateError = this.state.updateError;
  readonly showContactEditDialog = this.state.showContactEditDialog;
  readonly isContactUpdating = this.state.isContactUpdating;
  readonly contactUpdateError = this.state.contactUpdateError;
  readonly contactEditData = this.state.contactEditData;

  /** Kijelentkezes folyamatban (template binding) */
  get loggingOut(): boolean {
    return this.state.loggingOut;
  }

  /** Mobile menu element reference */
  readonly mobileMenuRef = viewChild.required<ElementRef<HTMLElement>>('mobileMenu');

  /** Desktop content container reference */
  readonly desktopContentRef = viewChild.required<ElementRef<HTMLElement>>('desktopContent');

  /** Navbar container reference */
  readonly navbarContainerRef = viewChild.required<ElementRef<HTMLElement>>('navbarContainer');

  constructor() {
    // Body scroll lock effect - reagal a menu allapotara
    effect(() => {
      if (this.mobileMenuOpen()) {
        this.scrollLockService.lock();
      } else {
        this.scrollLockService.unlock();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.scrollLockService.unlock();
      this.breakpointService.unobserve(this.navbarContainerRef().nativeElement);
    });
  }

  ngOnInit(): void {
    this.state.initSubscriptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.breakpointService.observeElement(
        this.navbarContainerRef().nativeElement,
        this.desktopContentRef().nativeElement,
        this.isMobileMode
      );
    }, 100);
  }

  /** Escape billentyű bezárja a menüt */
  onEscapeKey(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  /** Focus trap - Tab billentyű kezelése nyitott menüben */
  onTabKey(event: KeyboardEvent): void {
    if (!this.mobileMenuOpen() || !this.mobileMenuRef()) return;

    const focusableElements = this.mobileMenuRef().nativeElement.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  // --- Mobile menu ---

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // --- Status badge (delegalt) ---

  getStatusBadgeClasses(): string {
    return this.state.getStatusBadgeClasses(this.projectInfo());
  }

  getStatusName(): string | null {
    return this.state.getStatusName(this.projectInfo());
  }

  // --- Navigacios menupont lathatasag (delegalt) ---

  showSamples(): boolean {
    return this.state.showSamples(this.projectInfo());
  }

  showOrderData(): boolean {
    return this.state.showOrderData(this.projectInfo());
  }

  showTemplateChooser(): boolean {
    return this.state.showTemplateChooser(this.projectInfo());
  }

  showPersons(): boolean {
    return this.state.showPersons(this.projectInfo());
  }

  showFinalization(): boolean {
    return this.state.showFinalization(this.projectInfo());
  }

  showVoting(): boolean {
    return this.state.showVoting(this.projectInfo());
  }

  // --- Dialog muveletek (delegalt) ---

  openEditDialog(): void {
    this.state.openEditDialog();
  }

  closeEditDialog(): void {
    this.state.closeEditDialog();
  }

  openContactEditDialog(): void {
    this.state.openContactEditDialog();
  }

  closeContactEditDialog(): void {
    this.state.closeContactEditDialog();
  }

  onEditDialogResult(result: GuestNameResult): void {
    this.state.onEditDialogResult(result);
  }

  onContactEditResult(result: ContactEditResult): void {
    this.state.onContactEditResult(result);
  }

  // --- Kijelentkezes (delegalt) ---

  logout(): void {
    this.state.logout(() => this.closeMobileMenu());
  }
}
