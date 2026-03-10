import { Component, inject, signal, ChangeDetectionStrategy, computed, OnInit, DestroyRef, ElementRef, effect } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { NgClass } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';
import { MobileNavOverlayComponent } from '../../core/layout/components/mobile-nav-overlay/mobile-nav-overlay.component';
import { TopBarComponent } from '../../core/layout/components/top-bar/top-bar.component';
import { MenuItem } from '../../core/layout/models/menu-item.model';
import { SubscriptionService, SubscriptionInfo } from './services/subscription.service';
import { PartnerFinalizationService } from './services/partner-finalization.service';
import { PartnerTaskService } from './services/partner-task.service';
import { PartnerWorkflowService } from './services/partner-workflow.service';
import { BrandingService } from './services/branding.service';
import { ICONS, TEAM_MEMBER_ROLES, getSubscriptionStatusLabel } from '../../shared/constants';
import { ElectronService } from '../../core/services/electron.service';
import { HelpFabComponent } from '../help/components/help-fab/help-fab.component';
import { ChatbotPanelComponent } from '../help/components/chatbot-panel/chatbot-panel.component';
import { InviteBannerComponent } from '../../shared/components/invite-banner/invite-banner.component';
import { PartnerSwitcherDropdownComponent } from '../../shared/components/partner-switcher-dropdown/partner-switcher-dropdown.component';
import { BatchWorkspacePanelComponent } from './components/batch-workspace-panel/batch-workspace-panel.component';
import { UploadQueueToastComponent } from '../../shared/components/upload-queue-toast/upload-queue-toast.component';
import { PartnerNotificationBellComponent } from './components/partner-notification-bell/partner-notification-bell.component';
import { FeatureToggleService } from '../../core/services/feature-toggle.service';
import { ROLE_BADGES, buildPartnerMenu, buildTeamMemberMenu, filterMenuItems } from './partner-shell-menu.config';
import { BUILD_VERSION } from '../../core/constants/build-version';

/**
 * Partner Shell - Layout komponens a fotós/partner felülethez.
 * Saját TopBar és Sidebar menüvel.
 * - Desktop (1024px+): 240px sidebar, teljes menü
 * - Tablet (768-1023px): 60px sidebar, csak ikonok + tooltip
 * - Mobile (< 768px): közös MobileNavOverlayComponent
 */
@Component({
  selector: 'app-partner-shell',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    RouterLinkActive,
    NgClass,
    LucideAngularModule,
    MatTooltipModule,
    MobileNavOverlayComponent,
    TopBarComponent,
    HelpFabComponent,
    ChatbotPanelComponent,
    InviteBannerComponent,
    PartnerSwitcherDropdownComponent,
    BatchWorkspacePanelComponent,
    UploadQueueToastComponent,
    PartnerNotificationBellComponent,
  ],
  templateUrl: './partner-shell.component.html',
  styleUrl: './partner-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeFlyout()',
  },
})
export class PartnerShellComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly electronService = inject(ElectronService);
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  protected featureToggleService = inject(FeatureToggleService);
  private finalizationService = inject(PartnerFinalizationService);
  private taskService = inject(PartnerTaskService);
  private workflowService = inject(PartnerWorkflowService);
  protected readonly brandingService = inject(BrandingService);
  private router = inject(Router);
  protected sidebarState = inject(SidebarStateService);
  protected readonly ICONS = ICONS;
  protected readonly buildHash = BUILD_VERSION;
  protected chatOpen = signal(false);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Flyout almenü — melyik szekció van nyitva collapsed módban */
  protected activeFlyout = signal<string | null>(null);
  /** Flyout panel pozíció */
  protected flyoutPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  /** Base URL a route-okhoz - role alapján */
  protected baseUrl = computed(() => {
    const roles = this.userRoles();
    if (roles.includes('designer')) return '/designer';
    if (roles.includes('printer')) return '/printer';
    if (roles.includes('assistant')) return '/assistant';
    return '/partner';
  });

  // Subscription info
  subscriptionInfo = signal<SubscriptionInfo | null>(null);
  isPaused = computed(() => this.subscriptionInfo()?.status === 'paused');
  readonly inPrintCount = toSignal(
    this.finalizationService.getInPrintCount(new Date().getFullYear()).pipe(
      map(res => res.count),
      catchError(() => of(0)),
    ),
    { initialValue: 0 },
  );
  readonly pendingTaskCount = toSignal(
    this.taskService.getPendingCount().pipe(
      map(res => res.data.count),
      catchError(() => of(0)),
    ),
    { initialValue: 0 },
  );
  readonly pendingApprovalCount = toSignal(
    this.workflowService.getPendingCount().pipe(
      map(res => res.count),
      catchError(() => of(0)),
    ),
    { initialValue: 0 },
  );

  // User role info
  private userRoles = signal<string[]>(this.authService.getCurrentUser()?.roles ?? []);
  partnerName = signal<string>('');

  hasMultiplePartners = computed(() => (this.authService.getCurrentUser()?.partners_count ?? 0) > 1);
  currentPartnerId = computed(() => this.authService.getCurrentUser()?.partner_id ?? null);

  roleBadge = computed(() => {
    const roles = this.userRoles();
    for (const role of TEAM_MEMBER_ROLES) {
      if (roles.includes(role)) return ROLE_BADGES[role] || role;
    }
    return ROLE_BADGES['partner'];
  });

  isOwner = computed(() => {
    const roles = this.userRoles();
    return roles.includes('partner') && !TEAM_MEMBER_ROLES.some(r => roles.includes(r));
  });

  isTeamMember = computed(() => TEAM_MEMBER_ROLES.some(r => this.userRoles().includes(r)));

  /** Szűrt menü a role és baseUrl alapján */
  navItems = computed<MenuItem[]>(() => {
    const base = this.baseUrl();
    const allItems = buildPartnerMenu({
      baseUrl: base,
      isElectron: this.electronService.isElectron,
      inPrintCount: this.inPrintCount(),
      pendingTaskCount: this.pendingTaskCount(),
      pendingApprovalCount: this.pendingApprovalCount(),
    });

    const items = this.isOwner()
      ? allItems
      : buildTeamMemberMenu(allItems, base, this.electronService.isElectron);

    return filterMenuItems(items, this.featureToggleService);
  });

  /** Route szegmens -> szekció ID mapping az auto-expand-hez */
  private readonly routeToSectionMap: Record<string, string> = {
    '/projects': 'projects',
    '/subscription': 'subscription',
    '/customization': 'customization',
    '/settings': 'partner-settings',
    '/profile': 'partner-settings',
    '/webshop': 'webshop',
    '/prepayment': 'prepayment',
    '/booking': 'booking',
    '/workflows': 'workflows',
  };

  bugReportLink = computed(() => `${this.baseUrl()}/bugs`);

  mobileMenuItems = computed<MenuItem[]>(() => [
    ...this.navItems(),
    { id: 'bugs', route: this.bugReportLink(), label: 'Hibajelentés', icon: 'bug' },
  ]);

  userName = signal<string>('');
  userEmail = signal<string>('');

  userInfo = computed(() => {
    const baseInfo = { name: this.userName(), email: this.userEmail() || undefined };
    if (this.isTeamMember() && this.partnerName()) {
      return { ...baseInfo, subtitle: `@ ${this.partnerName()}` };
    }
    return baseInfo;
  });

  constructor() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email ?? '');
    }

    effect(() => {
      const currentUser = this.authService.currentUserSignal();
      if (currentUser) {
        this.userName.set(currentUser.name);
        this.userEmail.set(currentUser.email ?? '');
      }
    });
  }

  ngOnInit(): void {
    this.sidebarState.setScope('partner', []);
    this.sidebarState.expandSectionForRoute(this.router.url, this.routeToSectionMap);

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.sidebarState.expandSectionForRoute(e.urlAfterRedirects, this.routeToSectionMap);
    });

    this.loadSubscriptionInfo();
    this.loadBranding();
  }

  private loadSubscriptionInfo(): void {
    this.subscriptionService.getSubscription().subscribe({
      next: (info) => {
        this.subscriptionInfo.set(info);
        this.featureToggleService.setDisabledFeatures(info.disabled_features ?? []);
        if (info.partner_name) this.partnerName.set(info.partner_name);
      },
      error: (err) => this.logger.error('Failed to load subscription info', err)
    });
  }


  private loadBranding(): void {
    this.brandingService.getBranding().subscribe({
      next: (response) => {
        const isEffective = response.feature_active && response.branding?.is_active;
        this.brandingService.updateState(isEffective ? response.branding : null);
      },
      error: () => {}
    });
  }

  getStatusLabel = getSubscriptionStatusLabel;

  getSubscriptionTooltip(): string {
    const info = this.subscriptionInfo();
    if (!info) return 'Előfizetés kezelése';

    const parts: string[] = [`${info.plan_name} csomag`];
    if (info.has_extra_storage) parts.push(`+${info.extra_storage_gb} GB extra tárhely`);
    if (info.has_addons && info.active_addons?.length) {
      const addonNames: Record<string, string> = { 'community_pack': 'Közösségi csomag' };
      parts.push(`Addonok: ${info.active_addons.map(key => addonNames[key] || key).join(', ')}`);
    }
    parts.push('Kattints a kezeléshez');
    return parts.join(' • ');
  }

  isSectionActive(item: MenuItem): boolean {
    if (!item.children?.length) return false;
    return item.children.some(child => child.route && this.router.url.startsWith(child.route));
  }

  toggleSectionOrFlyout(sectionId: string, event: MouseEvent): void {
    if (this.sidebarState.isTablet()) {
      if (this.activeFlyout() === sectionId) {
        this.activeFlyout.set(null);
      } else {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.flyoutPosition.set({ top: rect.top, left: rect.right + 4 });
        this.activeFlyout.set(sectionId);
      }
    } else {
      this.sidebarState.toggleSection(sectionId);
    }
  }

  closeFlyout(): void { this.activeFlyout.set(null); }

  onFlyoutNavigate(): void { this.activeFlyout.set(null); }

  onDocumentClick(event: MouseEvent): void {
    if (!this.activeFlyout()) return;
    const sidebar = this.elementRef.nativeElement.querySelector('.sidebar');
    if (sidebar && !sidebar.contains(event.target as Node)) this.activeFlyout.set(null);
  }

  logout(): void {
    this.sidebarState.close();
    this.authService.logoutPartner();
  }
}
