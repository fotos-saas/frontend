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
import { printShopGuard } from './core/guards/print-shop.guard';

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

  // Print Shop routes - nyomdai felület
  {
    path: 'print-shop',
    loadComponent: () => import('./features/print-shop/print-shop-shell.component').then(m => m.PrintShopShellComponent),
    canActivate: [printShopGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/print-shop/pages/dashboard/print-shop-dashboard.component').then(m => m.PrintShopDashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/print-shop/pages/projects/print-shop-projects.component').then(m => m.PrintShopProjectsComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/print-shop/pages/project-detail/print-shop-project-detail.component').then(m => m.PrintShopProjectDetailComponent)
      },
      {
        path: 'connections',
        loadComponent: () => import('./features/print-shop/pages/connections/print-shop-connections.component').then(m => m.PrintShopConnectionsComponent),
        title: 'Kapcsolatok'
      }
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
    loadChildren: () => import('./features/partner/partner.routes').then(m => m.PARTNER_CHILDREN_ROUTES),
  },

  // Designer routes - alias a partner route-okra csapattagoknak
  {
    path: 'designer',
    loadComponent: () => import('./features/partner/partner-shell.component').then(m => m.PartnerShellComponent),
    canActivate: [partnerGuard],
    loadChildren: () => import('./features/partner/designer.routes').then(m => m.DESIGNER_CHILDREN_ROUTES),
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
