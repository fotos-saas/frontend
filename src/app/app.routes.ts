import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { FinalizationGuard } from './core/guards/finalization.guard';
import { SamplesGuard } from './core/guards/samples.guard';
import { GuestNameGuard } from './core/guards/guest-name.guard';
import { SessionChooserGuard } from './core/guards/session-chooser.guard';
import { marketerGuard } from './core/guards/marketer.guard';
import { partnerGuard } from './core/guards/partner.guard';
import { clientGuard } from './core/guards/client.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  // Overlay route (Electron always-on-top command palette — kulon BrowserWindow)
  {
    path: 'overlay',
    loadChildren: () => import('./features/overlay/overlay.routes').then(m => m.OVERLAY_ROUTES),
  },

  // Public routes (nincs layout, nincs navbar/footer) - lazy-loaded
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'share/:token',
    loadComponent: () => import('./pages/share-login/share-login.component').then(m => m.ShareLoginComponent)
  },
  {
    path: 'tablo/share/:token',
    loadComponent: () => import('./pages/share-login/share-login.component').then(m => m.ShareLoginComponent)
  },
  {
    path: 'preview/:token',
    loadComponent: () => import('./pages/preview-login/preview-login.component').then(m => m.PreviewLoginComponent)
  },
  {
    path: 'tablo/preview/:token',
    loadComponent: () => import('./pages/preview-login/preview-login.component').then(m => m.PreviewLoginComponent)
  },
  {
    path: 'dev-login/:token',
    loadComponent: () => import('./pages/dev-login/dev-login.component').then(m => m.DevLoginComponent)
  },

  // New auth routes
  {
    path: 'register',
    redirectTo: 'register-app',
    pathMatch: 'full'
  },
  {
    path: 'register-app',
    loadComponent: () => import('./pages/auth/register-app/register-app.component').then(m => m.RegisterAppComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register-success',
    loadComponent: () => import('./pages/auth/register-success/register-success.component').then(m => m.RegisterSuccessComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'verify-email/:id/:hash',
    loadComponent: () => import('./pages/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'tablo/register',
    loadComponent: () => import('./pages/auth/qr-register/qr-register.component').then(m => m.QrRegisterComponent)
  },
  // Invite registration - meghívó kóddal (bejelentkezett user is megnyithatja)
  {
    path: 'auth/invite',
    loadComponent: () => import('./pages/auth/invite-register/invite-register.component').then(m => m.InviteRegisterComponent),
  },

  // Session Chooser - ha több tárolt session van
  {
    path: 'choose-session',
    loadComponent: () => import('./pages/session-chooser/session-chooser.component').then(m => m.SessionChooserComponent)
  },

  // Partner Select - multi-partner csapattagoknak
  {
    path: 'partner-select',
    loadComponent: () => import('./pages/partner-select/partner-select.component').then(m => m.PartnerSelectComponent)
  },

  // Super Admin routes - rendszer adminisztrációs felület
  {
    path: 'super-admin',
    loadComponent: () => import('./features/super-admin/super-admin-shell.component').then(m => m.SuperAdminShellComponent),
    canActivate: [superAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/super-admin/pages/dashboard/dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'subscribers',
        loadComponent: () => import('./features/super-admin/pages/subscribers-list/subscribers-list.component').then(m => m.SubscribersListComponent)
      },
      {
        path: 'subscribers/:id',
        loadComponent: () => import('./features/super-admin/pages/subscriber-detail/subscriber-detail.component').then(m => m.SubscriberDetailComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/super-admin/pages/settings/settings.component').then(m => m.SettingsComponent)
      },
      // Hibajelentések kezelése
      {
        path: 'bugs',
        loadComponent: () => import('./features/super-admin/pages/bug-report-list/bug-report-list.component').then(m => m.AdminBugReportListComponent)
      },
      {
        path: 'bugs/:id',
        loadComponent: () => import('./features/super-admin/pages/bug-report-detail/bug-report-detail.component').then(m => m.AdminBugReportDetailComponent)
      },
    ]
  },

  // Marketer routes - marketinges/ügyintéző felület
  {
    path: 'marketer',
    loadComponent: () => import('./features/marketer/marketer-shell.component').then(m => m.MarketerShellComponent),
    canActivate: [marketerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/marketer/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/marketer/pages/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/marketer/pages/project-create/project-create.component').then(m => m.ProjectCreateComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/marketer/pages/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'schools',
        loadComponent: () => import('./features/marketer/pages/school-list/school-list.component').then(m => m.SchoolListComponent)
      },
      // Hibajelentések
      {
        path: 'bugs',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-list/bug-report-list.component').then(m => m.BugReportListComponent)
      },
      {
        path: 'bugs/:id',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-detail/bug-report-detail.component').then(m => m.BugReportDetailComponent)
      }
    ]
  },

  // Partner routes - fotós/partner felület
  {
    path: 'partner',
    loadComponent: () => import('./features/partner/partner-shell.component').then(m => m.PartnerShellComponent),
    canActivate: [partnerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./features/partner/pages/partner-profile/partner-profile.component').then(m => m.PartnerProfileComponent),
        title: 'Fiókom'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/partner/pages/dashboard/dashboard.component').then(m => m.PartnerDashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/partner/pages/project-list/project-list.component').then(m => m.PartnerProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/partner/pages/project-create/project-create.component').then(m => m.PartnerProjectCreateComponent)
      },
      {
        path: 'projects/settings',
        loadComponent: () => import('./features/partner/pages/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
        title: 'Beállítások'
      },
      {
        path: 'projects/finalizations',
        loadComponent: () => import('./features/partner/pages/finalization-list/finalization-list.component').then(m => m.FinalizationListComponent),
        title: 'Véglegesítések'
      },
      {
        path: 'projects/schools',
        loadComponent: () => import('./features/partner/pages/school-list/school-list.component').then(m => m.PartnerSchoolListComponent)
      },
      {
        path: 'projects/schools/:id',
        loadComponent: () => import('./features/partner/pages/school-detail/school-detail.component').then(m => m.PartnerSchoolDetailComponent)
      },
      {
        path: 'projects/teachers',
        loadComponent: () => import('./features/partner/pages/teacher-list/teacher-list.component').then(m => m.PartnerTeacherListComponent)
      },
      {
        path: 'projects/teachers/:id',
        loadComponent: () => import('./features/partner/pages/teacher-detail/teacher-detail.component').then(m => m.PartnerTeacherDetailComponent)
      },
      {
        path: 'projects/students',
        loadComponent: () => import('./features/partner/pages/student-list/student-list.component').then(m => m.PartnerStudentListComponent)
      },
      {
        path: 'projects/students/:id',
        loadComponent: () => import('./features/partner/pages/student-detail/student-detail.component').then(m => m.PartnerStudentDetailComponent)
      },
      {
        path: 'projects/tasks',
        loadComponent: () => import('./features/partner/pages/tasks-overview/tasks-overview.component').then(m => m.TasksOverviewComponent),
        title: 'Feladatok'
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/partner/pages/project-detail/project-detail.component').then(m => m.PartnerProjectDetailComponent)
      },
      {
        path: 'projects/:id/tablo-editor',
        loadComponent: () => import('./features/partner/pages/project-tablo-editor/project-tablo-editor.component').then(m => m.ProjectTabloEditorComponent),
        title: 'Tablószerkesztő'
      },
      {
        path: 'projects/:id/gallery',
        loadComponent: () => import('./features/partner/pages/gallery-detail/gallery-detail.component').then(m => m.GalleryDetailComponent)
      },
      // Tablókészítő (Electron only - menüben visible callback szűri)
      {
        path: 'tablo-designer',
        loadComponent: () => import('./features/partner/pages/tablo-designer/tablo-designer.component').then(m => m.TabloDesignerComponent),
        title: 'Tablókészítő'
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/partner/pages/contact-list/contact-list.component').then(m => m.PartnerContactListComponent)
      },
      // Árajánlatok
      {
        path: 'quotes',
        loadComponent: () => import('./features/partner/pages/quotes/quote-list/quote-list.component').then(m => m.QuoteListComponent),
        title: 'Árajánlatok'
      },
      {
        path: 'quotes/new',
        loadComponent: () => import('./features/partner/pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
        title: 'Új árajánlat'
      },
      {
        path: 'quotes/:id',
        loadComponent: () => import('./features/partner/pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
        title: 'Árajánlat szerkesztése'
      },
      // Team - Csapatkezelés
      {
        path: 'team',
        loadComponent: () => import('./features/partner/pages/team/team-list/team-list.component').then(m => m.PartnerTeamListComponent)
      },
      // Orders - Fotós megrendelések (ügyfelek + albumok)
      {
        path: 'orders/clients',
        loadComponent: () => import('./features/partner/pages/orders/client-list/client-list.component').then(m => m.PartnerClientListComponent)
      },
      {
        path: 'orders/clients/:id',
        loadComponent: () => import('./features/partner/pages/orders/client-detail/client-detail.component').then(m => m.PartnerClientDetailComponent)
      },
      {
        path: 'orders/albums/:id',
        loadComponent: () => import('./features/partner/pages/orders/album-detail/album-detail.component').then(m => m.PartnerAlbumDetailComponent)
      },
      // Testreszabás - customization
      {
        path: 'customization/branding',
        loadComponent: () => import('./features/partner/pages/customization/branding/branding.component').then(m => m.BrandingComponent),
        title: 'Márkajelzés'
      },
      {
        path: 'customization/email-templates',
        loadComponent: () => import('./features/partner/pages/customization/email-templates/email-template-list.component').then(m => m.EmailTemplateListComponent),
        title: 'Email sablonok'
      },
      {
        path: 'customization/email-templates/:name',
        loadComponent: () => import('./features/partner/pages/customization/email-templates/email-template-edit/email-template-edit.component').then(m => m.EmailTemplateEditComponent),
        title: 'Email sablon szerkesztése'
      },
      // Tevékenységnapló (csak partner)
      {
        path: 'activity-log',
        loadComponent: () => import('./features/partner/pages/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
        title: 'Tevékenységnapló'
      },
      // Portré háttércsere beállítások (partner szintű)
      {
        path: 'settings/portrait',
        loadComponent: () => import('./features/partner/pages/portrait-settings/portrait-settings-page.component').then(m => m.PortraitSettingsPageComponent),
        title: 'Portré beállítások'
      },
      // Előfizetésem - subscription management
      {
        path: 'subscription',
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          {
            path: 'overview',
            loadComponent: () => import('./features/partner/pages/subscription/subscription-overview/subscription-overview.component').then(m => m.SubscriptionOverviewComponent),
            title: 'Előfizetés'
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/partner/pages/subscription/invoices/invoices.component').then(m => m.InvoicesComponent),
            title: 'Számlák'
          },
          {
            path: 'addons',
            loadComponent: () => import('./features/partner/pages/subscription/addons/addons.component').then(m => m.AddonsComponent),
            title: 'Kiegészítők'
          },
          {
            path: 'marketplace',
            loadComponent: () => import('./features/partner/pages/subscription/marketplace/marketplace-page.component').then(m => m.MarketplacePageComponent),
            title: 'Marketplace'
          },
          {
            path: 'marketplace/usage',
            loadComponent: () => import('./features/partner/pages/subscription/marketplace-usage/marketplace-usage-page.component').then(m => m.MarketplaceUsagePageComponent),
            title: 'Használat'
          },
          {
            path: 'marketplace/:moduleKey',
            loadComponent: () => import('./features/partner/pages/subscription/module-detail/module-detail-page.component').then(m => m.ModuleDetailPageComponent),
            title: 'Modul részletek'
          },
          {
            path: 'pause',
            loadComponent: () => import('./features/partner/pages/subscription/account-pause/account-pause.component').then(m => m.AccountPauseComponent),
            title: 'Szüneteltetés'
          },
          {
            path: 'account',
            loadComponent: () => import('./features/partner/pages/subscription/account-delete/account-delete.component').then(m => m.AccountDeleteComponent),
            title: 'Fiók törlése'
          }
        ]
      },
      // Beállítások
      {
        path: 'settings',
        children: [
          {
            path: 'billing',
            loadComponent: () => import('./features/partner/pages/partner-settings/billing/billing.component').then(m => m.BillingComponent),
            title: 'Számlázás és fizetés'
          },
          {
            path: 'services',
            loadComponent: () => import('./features/partner/pages/partner-settings/services/service-catalog.component').then(m => m.ServiceCatalogComponent),
            title: 'Szolgáltatások'
          },
          {
            path: 'email-account',
            loadComponent: () => import('./features/partner/pages/partner-settings/email-account/email-account-settings.component').then(m => m.EmailAccountSettingsComponent),
            title: 'E-mail fiók'
          }
        ]
      },
      // AdvancePay (Előrefizetés)
      {
        path: 'prepayment',
        children: [
          {
            path: 'settings',
            loadComponent: () => import('./features/partner/pages/prepayment/config/prepayment-config.component').then(m => m.PrepaymentConfigComponent),
            title: 'Előlegfizetés beállítások'
          },
          {
            path: 'stats',
            loadComponent: () => import('./features/partner/pages/prepayment/stats/prepayment-stats.component').then(m => m.PrepaymentStatsComponent),
            title: 'Előleg statisztikák'
          },
          {
            path: '',
            loadComponent: () => import('./features/partner/pages/prepayment/list/prepayment-list.component').then(m => m.PrepaymentListComponent),
            title: 'Előlegek'
          }
        ]
      },
      // Webshop
      {
        path: 'webshop',
        children: [
          {
            path: 'settings',
            loadComponent: () => import('./features/partner/pages/webshop/settings/webshop-settings.component').then(m => m.WebshopSettingsComponent),
            title: 'Webshop beállítások'
          },
          {
            path: 'products',
            loadComponent: () => import('./features/partner/pages/webshop/products/webshop-products.component').then(m => m.WebshopProductsComponent),
            title: 'Termékek és árak'
          },
          {
            path: 'orders',
            loadComponent: () => import('./features/partner/pages/webshop/orders/webshop-orders.component').then(m => m.WebshopOrdersComponent),
            title: 'Webshop rendelések'
          },
          {
            path: 'orders/:id',
            loadComponent: () => import('./features/partner/pages/webshop/orders/webshop-order-detail.component').then(m => m.WebshopOrderDetailComponent),
            title: 'Rendelés részletek'
          }
        ]
      },
      // Terhelés kezelés
      {
        path: 'billing-charges',
        loadComponent: () => import('./features/partner/pages/billing-charges/billing-charges.component').then(m => m.BillingChargesComponent),
        title: 'Terhelések'
      },
      // Hibajelentések
      {
        path: 'bugs',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-list/bug-report-list.component').then(m => m.BugReportListComponent)
      },
      {
        path: 'bugs/:id',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-detail/bug-report-detail.component').then(m => m.BugReportDetailComponent)
      },
      // Foglalasi Naptar
      {
        path: 'booking',
        children: [
          { path: '', redirectTo: 'calendar', pathMatch: 'full' },
          {
            path: 'calendar',
            loadComponent: () => import('./features/partner/pages/booking/calendar/booking-calendar.component').then(m => m.BookingCalendarComponent),
            title: 'Naptar'
          },
          {
            path: 'bookings',
            loadComponent: () => import('./features/partner/pages/booking/bookings/booking-list.component').then(m => m.BookingListComponent),
            title: 'Foglalasok'
          },
          {
            path: 'session-types',
            loadComponent: () => import('./features/partner/pages/booking/session-types/session-types.component').then(m => m.SessionTypesComponent),
            title: 'Fotozasi tipusok'
          },
          {
            path: 'availability',
            loadComponent: () => import('./features/partner/pages/booking/availability/availability.component').then(m => m.AvailabilityComponent),
            title: 'Elerhetoseg'
          },
          {
            path: 'batch-import',
            loadComponent: () => import('./features/partner/pages/booking/batch-import/batch-import.component').then(m => m.BatchImportComponent),
            title: 'CSV Import'
          },
          {
            path: 'page-settings',
            loadComponent: () => import('./features/partner/pages/booking/page-settings/booking-page-settings.component').then(m => m.BookingPageSettingsComponent),
            title: 'Foglalasi oldal'
          },
          {
            path: 'stats',
            loadComponent: () => import('./features/partner/pages/booking/stats/booking-stats.component').then(m => m.BookingStatsComponent),
            title: 'Statisztikak'
          },
        ]
      },
      // Workflow (Előkészítő)
      {
        path: 'workflows',
        loadComponent: () => import('./features/partner/pages/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
        title: 'Előkészítő'
      },
      {
        path: 'workflows/settings',
        loadComponent: () => import('./features/partner/pages/workflow-schedule-settings/workflow-schedule-settings.component').then(m => m.WorkflowScheduleSettingsComponent),
        title: 'Ütemezés beállítások'
      },
      {
        path: 'workflows/:id',
        loadComponent: () => import('./features/partner/pages/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent),
        title: 'Workflow részletek'
      },
    ]
  },

  // Designer routes - alias a partner route-okra csapattagoknak
  // Ugyanazokat a komponenseket használja, csak /designer/* URL alatt
  {
    path: 'designer',
    loadComponent: () => import('./features/partner/partner-shell.component').then(m => m.PartnerShellComponent),
    canActivate: [partnerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./features/partner/pages/partner-profile/partner-profile.component').then(m => m.PartnerProfileComponent),
        title: 'Fiókom'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/partner/pages/dashboard/dashboard.component').then(m => m.PartnerDashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/partner/pages/project-list/project-list.component').then(m => m.PartnerProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/partner/pages/project-create/project-create.component').then(m => m.PartnerProjectCreateComponent)
      },
      {
        path: 'projects/settings',
        loadComponent: () => import('./features/partner/pages/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
        title: 'Beállítások'
      },
      {
        path: 'projects/finalizations',
        loadComponent: () => import('./features/partner/pages/finalization-list/finalization-list.component').then(m => m.FinalizationListComponent),
        title: 'Véglegesítések'
      },
      {
        path: 'projects/schools',
        loadComponent: () => import('./features/partner/pages/school-list/school-list.component').then(m => m.PartnerSchoolListComponent)
      },
      {
        path: 'projects/schools/:id',
        loadComponent: () => import('./features/partner/pages/school-detail/school-detail.component').then(m => m.PartnerSchoolDetailComponent)
      },
      {
        path: 'projects/teachers',
        loadComponent: () => import('./features/partner/pages/teacher-list/teacher-list.component').then(m => m.PartnerTeacherListComponent)
      },
      {
        path: 'projects/teachers/:id',
        loadComponent: () => import('./features/partner/pages/teacher-detail/teacher-detail.component').then(m => m.PartnerTeacherDetailComponent)
      },
      {
        path: 'projects/students',
        loadComponent: () => import('./features/partner/pages/student-list/student-list.component').then(m => m.PartnerStudentListComponent)
      },
      {
        path: 'projects/students/:id',
        loadComponent: () => import('./features/partner/pages/student-detail/student-detail.component').then(m => m.PartnerStudentDetailComponent)
      },
      {
        path: 'projects/tasks',
        loadComponent: () => import('./features/partner/pages/tasks-overview/tasks-overview.component').then(m => m.TasksOverviewComponent),
        title: 'Feladatok'
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/partner/pages/project-detail/project-detail.component').then(m => m.PartnerProjectDetailComponent)
      },
      {
        path: 'projects/:id/tablo-editor',
        loadComponent: () => import('./features/partner/pages/project-tablo-editor/project-tablo-editor.component').then(m => m.ProjectTabloEditorComponent),
        title: 'Tablószerkesztő'
      },
      {
        path: 'projects/:id/gallery',
        loadComponent: () => import('./features/partner/pages/gallery-detail/gallery-detail.component').then(m => m.GalleryDetailComponent)
      },
      // Tablókészítő (Electron only)
      {
        path: 'tablo-designer',
        loadComponent: () => import('./features/partner/pages/tablo-designer/tablo-designer.component').then(m => m.TabloDesignerComponent),
        title: 'Tablókészítő'
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/partner/pages/contact-list/contact-list.component').then(m => m.PartnerContactListComponent)
      },
      // Árajánlatok (designer)
      {
        path: 'quotes',
        loadComponent: () => import('./features/partner/pages/quotes/quote-list/quote-list.component').then(m => m.QuoteListComponent),
        title: 'Árajánlatok'
      },
      {
        path: 'quotes/new',
        loadComponent: () => import('./features/partner/pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
        title: 'Új árajánlat'
      },
      {
        path: 'quotes/:id',
        loadComponent: () => import('./features/partner/pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
        title: 'Árajánlat szerkesztése'
      },
      {
        path: 'orders/clients',
        loadComponent: () => import('./features/partner/pages/orders/client-list/client-list.component').then(m => m.PartnerClientListComponent)
      },
      {
        path: 'orders/clients/:id',
        loadComponent: () => import('./features/partner/pages/orders/client-detail/client-detail.component').then(m => m.PartnerClientDetailComponent)
      },
      {
        path: 'orders/albums/:id',
        loadComponent: () => import('./features/partner/pages/orders/album-detail/album-detail.component').then(m => m.PartnerAlbumDetailComponent)
      },
      // Tevékenységnapló (grafikusnak is elérhető)
      {
        path: 'activity-log',
        loadComponent: () => import('./features/partner/pages/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
        title: 'Tevékenységnapló'
      },
      // Portré háttércsere (grafikusnak is elérhető)
      {
        path: 'settings/portrait',
        loadComponent: () => import('./features/partner/pages/portrait-settings/portrait-settings-page.component').then(m => m.PortraitSettingsPageComponent),
        title: 'Portré beállítások'
      },
      // Fiók törlése (csapattagoknak csak ez érhető el)
      {
        path: 'account',
        loadComponent: () => import('./features/partner/pages/subscription/account-delete/account-delete.component').then(m => m.AccountDeleteComponent),
        title: 'Fiók törlése'
      },
      // Hibajelentések
      {
        path: 'bugs',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-list/bug-report-list.component').then(m => m.BugReportListComponent)
      },
      {
        path: 'bugs/:id',
        loadComponent: () => import('./features/bug-reports/pages/bug-report-detail/bug-report-detail.component').then(m => m.BugReportDetailComponent)
      },
      // Foglalasi Naptar
      {
        path: 'booking',
        children: [
          { path: '', redirectTo: 'calendar', pathMatch: 'full' },
          {
            path: 'calendar',
            loadComponent: () => import('./features/partner/pages/booking/calendar/booking-calendar.component').then(m => m.BookingCalendarComponent),
            title: 'Naptar'
          },
          {
            path: 'bookings',
            loadComponent: () => import('./features/partner/pages/booking/bookings/booking-list.component').then(m => m.BookingListComponent),
            title: 'Foglalasok'
          },
          {
            path: 'session-types',
            loadComponent: () => import('./features/partner/pages/booking/session-types/session-types.component').then(m => m.SessionTypesComponent),
            title: 'Fotozasi tipusok'
          },
          {
            path: 'availability',
            loadComponent: () => import('./features/partner/pages/booking/availability/availability.component').then(m => m.AvailabilityComponent),
            title: 'Elerhetoseg'
          },
          {
            path: 'batch-import',
            loadComponent: () => import('./features/partner/pages/booking/batch-import/batch-import.component').then(m => m.BatchImportComponent),
            title: 'CSV Import'
          },
          {
            path: 'page-settings',
            loadComponent: () => import('./features/partner/pages/booking/page-settings/booking-page-settings.component').then(m => m.BookingPageSettingsComponent),
            title: 'Foglalasi oldal'
          },
          {
            path: 'stats',
            loadComponent: () => import('./features/partner/pages/booking/stats/booking-stats.component').then(m => m.BookingStatsComponent),
            title: 'Statisztikak'
          },
        ]
      },
      // Workflow (Előkészítő) — designer is elérheti
      {
        path: 'workflows',
        loadComponent: () => import('./features/partner/pages/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
        title: 'Előkészítő'
      },
      {
        path: 'workflows/settings',
        loadComponent: () => import('./features/partner/pages/workflow-schedule-settings/workflow-schedule-settings.component').then(m => m.WorkflowScheduleSettingsComponent),
        title: 'Ütemezés beállítások'
      },
      {
        path: 'workflows/:id',
        loadComponent: () => import('./features/partner/pages/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent),
        title: 'Workflow részletek'
      },
    ]
  },

  // Client routes - partner ügyfél felület (album választás)
  {
    path: 'client',
    loadComponent: () => import('./features/client/client-shell.component').then(m => m.ClientShellComponent),
    canActivate: [clientGuard],
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      {
        path: 'welcome',
        loadComponent: () => import('./features/client/pages/welcome/welcome.component').then(m => m.ClientWelcomeComponent)
      },
      {
        path: 'albums',
        loadComponent: () => import('./features/client/pages/album-list/album-list.component').then(m => m.ClientAlbumListComponent)
      },
      {
        path: 'albums/:id',
        loadComponent: () => import('./features/client/pages/album-detail/album-detail.component').then(m => m.ClientAlbumDetailComponent)
      }
    ]
  },

  // Protected routes (AppShell-lel, sidebar/topbar/footer-rel) - lazy-loaded
  {
    path: '',
    loadComponent: () => import('./core/layout/components/app-shell/app-shell.component').then(m => m.AppShellComponent),
    canActivate: [SessionChooserGuard, AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component')
          .then(m => m.HomeComponent),
        data: { page: 'home' }
      },
      {
        path: 'samples',
        loadComponent: () => import('./features/samples/samples.component')
          .then(m => m.SamplesComponent),
        canActivate: [SamplesGuard],
        data: { page: 'samples' }
      },
      {
        path: 'order-data',
        loadComponent: () => import('./features/order-data/order-data.component')
          .then(m => m.OrderDataComponent),
        data: { page: 'order-data' }
      },
      {
        path: 'persons',
        loadComponent: () => import('./features/persons/persons.component')
          .then(m => m.PersonsComponent),
        data: { page: 'persons' }
      },
      // Backward compatibility redirect
      {
        path: 'missing-persons',
        redirectTo: 'persons',
        pathMatch: 'full'
      },
      {
        path: 'template-chooser',
        loadComponent: () => import('./features/template-chooser/template-chooser.component')
          .then(m => m.TemplateChooserComponent),
        data: { page: 'template-chooser' }
      },
      {
        path: 'order-finalization',
        loadComponent: () => import('./features/order-finalization/order-finalization.component')
          .then(m => m.OrderFinalizationComponent),
        canActivate: [FinalizationGuard],
        data: { page: 'order-finalization' }
      },
      {
        path: 'voting',
        loadChildren: () => import('./features/voting/voting.routes')
          .then(m => m.VOTING_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'voting' }
      },
      {
        path: 'forum',
        loadChildren: () => import('./features/forum/forum.routes')
          .then(m => m.FORUM_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'forum' }
      },
      {
        path: 'newsfeed',
        loadChildren: () => import('./features/newsfeed/newsfeed.routes')
          .then(m => m.NEWSFEED_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'newsfeed' }
      },
      {
        path: 'poke',
        loadChildren: () => import('./features/poke/poke.routes')
          .then(m => m.POKE_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'poke' }
      },
      {
        path: 'billing',
        loadChildren: () => import('./features/billing/billing.routes')
          .then(m => m.BILLING_ROUTES),
        canActivate: [AuthGuard],
        data: { page: 'billing' }
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes')
          .then(m => m.NOTIFICATIONS_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'notifications' }
      },
      {
        path: 'photo-selection',
        loadChildren: () => import('./features/photo-selection/photo-selection.routes')
          .then(m => m.PHOTO_SELECTION_ROUTES),
        canActivate: [AuthGuard, GuestNameGuard],
        data: { page: 'photo-selection' }
      }
    ]
  },

  // Publikus Előlegfizetés (nincs auth)
  {
    path: 'pay/:token',
    loadComponent: () => import('./features/client-prepayment/client-prepayment.component').then(m => m.ClientPrepaymentComponent),
    title: 'Előleg befizetés'
  },
  {
    path: 'pay/:token/success',
    loadComponent: () => import('./features/client-prepayment/pages/prepayment-success/prepayment-success.component').then(m => m.PrepaymentSuccessComponent),
    title: 'Sikeres befizetés'
  },

  // Publikus Webshop (kliens felület, nincs auth)
  {
    path: 'shop/:token',
    loadComponent: () => import('./features/client-webshop/client-webshop.component').then(m => m.ClientWebshopComponent),
    title: 'Webshop'
  },
  {
    path: 'shop/:token/success',
    loadComponent: () => import('./features/client-webshop/pages/order-success/order-success.component').then(m => m.OrderSuccessComponent),
    title: 'Sikeres rendelés'
  },

  // Publikus foglalás
  {
    path: 'booking/:slug',
    loadComponent: () => import('./features/public-booking/public-booking.component').then(m => m.PublicBookingComponent),
    title: 'Idopont foglalas'
  },
  {
    path: 'booking/:slug/reschedule/:bookingUuid',
    loadComponent: () => import('./features/public-booking/public-booking-reschedule.component').then(m => m.PublicBookingRescheduleComponent),
    title: 'Foglalas atutemezese'
  },
  {
    path: 'booking/:slug/cancel/:bookingUuid',
    loadComponent: () => import('./features/public-booking/public-booking-cancel.component').then(m => m.PublicBookingCancelComponent),
    title: 'Foglalas lemondasa'
  },

  // Dev - Form showcase (no auth)
  {
    path: 'dev/form-showcase',
    loadComponent: () => import('./pages/form-showcase/form-showcase.component').then(m => m.FormShowcaseComponent),
    title: 'Form Showcase'
  },

  // 404 - ismeretlen route-ok
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
