import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// Minden komponens standalone és lazy-loaded
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

const routes: Routes = [
  // Public routes (nincs layout, nincs navbar/footer) - lazy-loaded
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'share/:token',
    loadComponent: () => import('./pages/share-login.component').then(m => m.ShareLoginComponent)
  },
  {
    path: 'tablo/share/:token',
    loadComponent: () => import('./pages/share-login.component').then(m => m.ShareLoginComponent)
  },
  {
    path: 'preview/:token',
    loadComponent: () => import('./pages/preview-login.component').then(m => m.PreviewLoginComponent)
  },
  {
    path: 'tablo/preview/:token',
    loadComponent: () => import('./pages/preview-login.component').then(m => m.PreviewLoginComponent)
  },

  // New auth routes
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent),
    canActivate: [NoAuthGuard]
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
    loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'verify-email/:id/:hash',
    loadComponent: () => import('./pages/auth/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'tablo/register',
    loadComponent: () => import('./pages/auth/qr-register.component').then(m => m.QrRegisterComponent)
  },
  // Invite registration - meghívó kóddal
  {
    path: 'auth/invite',
    loadComponent: () => import('./pages/auth/invite-register.component').then(m => m.InviteRegisterComponent),
    canActivate: [NoAuthGuard]
  },

  // Session Chooser - ha több tárolt session van
  {
    path: 'choose-session',
    loadComponent: () => import('./pages/session-chooser.component').then(m => m.SessionChooserComponent)
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
        loadComponent: () => import('./features/super-admin/pages/dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'subscribers',
        loadComponent: () => import('./features/super-admin/pages/subscribers-list.component').then(m => m.SubscribersListComponent)
      },
      {
        path: 'subscribers/:id',
        loadComponent: () => import('./features/super-admin/pages/subscriber-detail.component').then(m => m.SubscriberDetailComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/super-admin/pages/settings.component').then(m => m.SettingsComponent)
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
        loadComponent: () => import('./features/marketer/pages/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/marketer/pages/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/marketer/pages/project-create.component').then(m => m.ProjectCreateComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/marketer/pages/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'schools',
        loadComponent: () => import('./features/marketer/pages/school-list.component').then(m => m.SchoolListComponent)
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
        path: 'dashboard',
        loadComponent: () => import('./features/partner/pages/dashboard.component').then(m => m.PartnerDashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/partner/pages/project-list.component').then(m => m.PartnerProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/partner/pages/project-create.component').then(m => m.PartnerProjectCreateComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/partner/pages/project-detail.component').then(m => m.PartnerProjectDetailComponent)
      },
      {
        path: 'schools',
        loadComponent: () => import('./features/partner/pages/school-list.component').then(m => m.PartnerSchoolListComponent)
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/partner/pages/contact-list.component').then(m => m.PartnerContactListComponent)
      },
      // Team - Csapatkezelés
      {
        path: 'team',
        loadComponent: () => import('./features/partner/pages/team/team-list.component').then(m => m.PartnerTeamListComponent)
      },
      // Orders - Fotós megrendelések (ügyfelek + albumok)
      {
        path: 'orders/clients',
        loadComponent: () => import('./features/partner/pages/orders/client-list.component').then(m => m.PartnerClientListComponent)
      },
      {
        path: 'orders/clients/:id',
        loadComponent: () => import('./features/partner/pages/orders/client-detail/client-detail.component').then(m => m.PartnerClientDetailComponent)
      },
      {
        path: 'orders/albums/:id',
        loadComponent: () => import('./features/partner/pages/orders/album-detail/album-detail.component').then(m => m.PartnerAlbumDetailComponent)
      },
      // Előfizetésem - subscription management
      {
        path: 'subscription',
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          {
            path: 'overview',
            loadComponent: () => import('./features/partner/pages/subscription/subscription-overview.component').then(m => m.SubscriptionOverviewComponent),
            title: 'Előfizetés'
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/partner/pages/subscription/invoices.component').then(m => m.InvoicesComponent),
            title: 'Számlák'
          },
          {
            path: 'addons',
            loadComponent: () => import('./features/partner/pages/subscription/addons.component').then(m => m.AddonsComponent),
            title: 'Kiegészítők'
          },
          {
            path: 'account',
            loadComponent: () => import('./features/partner/pages/subscription/account-delete.component').then(m => m.AccountDeleteComponent),
            title: 'Fiók törlése'
          }
        ]
      },
      // Régi settings redirect (backwards compatibility)
      {
        path: 'settings',
        redirectTo: 'subscription/overview',
        pathMatch: 'full'
      }
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
        path: 'dashboard',
        loadComponent: () => import('./features/partner/pages/dashboard.component').then(m => m.PartnerDashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/partner/pages/project-list.component').then(m => m.PartnerProjectListComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./features/partner/pages/project-create.component').then(m => m.PartnerProjectCreateComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/partner/pages/project-detail.component').then(m => m.PartnerProjectDetailComponent)
      },
      {
        path: 'schools',
        loadComponent: () => import('./features/partner/pages/school-list.component').then(m => m.PartnerSchoolListComponent)
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/partner/pages/contact-list.component').then(m => m.PartnerContactListComponent)
      },
      {
        path: 'orders/clients',
        loadComponent: () => import('./features/partner/pages/orders/client-list.component').then(m => m.PartnerClientListComponent)
      },
      {
        path: 'orders/clients/:id',
        loadComponent: () => import('./features/partner/pages/orders/client-detail/client-detail.component').then(m => m.PartnerClientDetailComponent)
      },
      {
        path: 'orders/albums/:id',
        loadComponent: () => import('./features/partner/pages/orders/album-detail/album-detail.component').then(m => m.PartnerAlbumDetailComponent)
      },
      // Fiók törlése (csapattagoknak csak ez érhető el)
      {
        path: 'account',
        loadComponent: () => import('./features/partner/pages/subscription/account-delete.component').then(m => m.AccountDeleteComponent),
        title: 'Fiók törlése'
      }
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
        loadComponent: () => import('./features/client/pages/welcome.component').then(m => m.ClientWelcomeComponent)
      },
      {
        path: 'albums',
        loadComponent: () => import('./features/client/pages/album-list.component').then(m => m.ClientAlbumListComponent)
      },
      {
        path: 'albums/:id',
        loadComponent: () => import('./features/client/pages/album-detail.component').then(m => m.ClientAlbumDetailComponent)
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
        path: 'missing-persons',
        loadComponent: () => import('./features/missing-persons/missing-persons.component')
          .then(m => m.MissingPersonsComponent),
        data: { page: 'missing' }
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

  // 404 - ismeretlen route-ok
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
