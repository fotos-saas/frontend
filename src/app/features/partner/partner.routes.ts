import { Routes } from '@angular/router';

export const PARTNER_CHILDREN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'profile',
    loadComponent: () => import('./pages/partner-profile/partner-profile.component').then(m => m.PartnerProfileComponent),
    title: 'Fiókom'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.PartnerDashboardComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/project-list/project-list.component').then(m => m.PartnerProjectListComponent)
  },
  {
    path: 'projects/new',
    loadComponent: () => import('./pages/project-create/project-create.component').then(m => m.PartnerProjectCreateComponent)
  },
  {
    path: 'projects/settings',
    loadComponent: () => import('./pages/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
    title: 'Beállítások'
  },
  {
    path: 'projects/finalizations',
    loadComponent: () => import('./pages/finalization-list/finalization-list.component').then(m => m.FinalizationListComponent),
    title: 'Véglegesítések'
  },
  {
    path: 'projects/schools',
    loadComponent: () => import('./pages/school-list/school-list.component').then(m => m.PartnerSchoolListComponent)
  },
  {
    path: 'projects/schools/:id',
    loadComponent: () => import('./pages/school-detail/school-detail.component').then(m => m.PartnerSchoolDetailComponent)
  },
  {
    path: 'projects/teachers',
    loadComponent: () => import('./pages/teacher-list/teacher-list.component').then(m => m.PartnerTeacherListComponent)
  },
  {
    path: 'projects/teachers/:id',
    loadComponent: () => import('./pages/teacher-detail/teacher-detail.component').then(m => m.PartnerTeacherDetailComponent)
  },
  {
    path: 'projects/students',
    loadComponent: () => import('./pages/student-list/student-list.component').then(m => m.PartnerStudentListComponent)
  },
  {
    path: 'projects/students/:id',
    loadComponent: () => import('./pages/student-detail/student-detail.component').then(m => m.PartnerStudentDetailComponent)
  },
  {
    path: 'projects/tasks',
    loadComponent: () => import('./pages/tasks-overview/tasks-overview.component').then(m => m.TasksOverviewComponent),
    title: 'Tennivalók'
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./pages/project-detail/project-detail.component').then(m => m.PartnerProjectDetailComponent)
  },
  {
    path: 'projects/:id/tablo-editor',
    loadComponent: () => import('./pages/project-tablo-editor/project-tablo-editor.component').then(m => m.ProjectTabloEditorComponent),
    title: 'Tablószerkesztő'
  },
  {
    path: 'projects/:id/gallery',
    loadComponent: () => import('./pages/gallery-detail/gallery-detail.component').then(m => m.GalleryDetailComponent)
  },
  {
    path: 'tablo-designer',
    loadComponent: () => import('./pages/tablo-designer/tablo-designer.component').then(m => m.TabloDesignerComponent),
    title: 'Tablókészítő'
  },
  {
    path: 'contacts',
    loadComponent: () => import('./pages/contact-list/contact-list.component').then(m => m.PartnerContactListComponent)
  },
  {
    path: 'quotes',
    loadComponent: () => import('./pages/quotes/quote-list/quote-list.component').then(m => m.QuoteListComponent),
    title: 'Árajánlatok'
  },
  {
    path: 'quotes/new',
    loadComponent: () => import('./pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
    title: 'Új árajánlat'
  },
  {
    path: 'quotes/:id',
    loadComponent: () => import('./pages/quotes/quote-editor/quote-editor.component').then(m => m.QuoteEditorComponent),
    title: 'Árajánlat szerkesztése'
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team/team-list/team-list.component').then(m => m.PartnerTeamListComponent)
  },
  {
    path: 'orders/clients',
    loadComponent: () => import('./pages/orders/client-list/client-list.component').then(m => m.PartnerClientListComponent)
  },
  {
    path: 'orders/clients/:id',
    loadComponent: () => import('./pages/orders/client-detail/client-detail.component').then(m => m.PartnerClientDetailComponent)
  },
  {
    path: 'orders/albums/:id',
    loadComponent: () => import('./pages/orders/album-detail/album-detail.component').then(m => m.PartnerAlbumDetailComponent)
  },
  {
    path: 'customization/branding',
    loadComponent: () => import('./pages/customization/branding/branding.component').then(m => m.BrandingComponent),
    title: 'Márkajelzés'
  },
  {
    path: 'customization/email-templates',
    loadComponent: () => import('./pages/customization/email-templates/email-template-list.component').then(m => m.EmailTemplateListComponent),
    title: 'Email sablonok'
  },
  {
    path: 'customization/email-templates/:name',
    loadComponent: () => import('./pages/customization/email-templates/email-template-edit/email-template-edit.component').then(m => m.EmailTemplateEditComponent),
    title: 'Email sablon szerkesztése'
  },
  {
    path: 'email-hub',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/email-hub-dashboard/email-hub-dashboard.component').then(m => m.EmailHubDashboardComponent),
        title: 'Email Hub'
      },
      {
        path: 'drafts',
        loadComponent: () => import('./pages/email-hub-drafts/email-hub-drafts.component').then(m => m.EmailHubDraftsComponent),
        title: 'Draft válaszok'
      },
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notification-list/notification-list.component').then(m => m.NotificationListComponent),
    title: 'Értesítések'
  },
  {
    path: 'activity-log',
    loadComponent: () => import('./pages/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
    title: 'Tevékenységnapló'
  },
  {
    path: 'settings/portrait',
    loadComponent: () => import('./pages/portrait-settings/portrait-settings-page.component').then(m => m.PortraitSettingsPageComponent),
    title: 'Portré beállítások'
  },
  {
    path: 'subscription',
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./pages/subscription/subscription-overview/subscription-overview.component').then(m => m.SubscriptionOverviewComponent),
        title: 'Előfizetés'
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/subscription/invoices/invoices.component').then(m => m.InvoicesComponent),
        title: 'Számlák'
      },
      {
        path: 'addons',
        loadComponent: () => import('./pages/subscription/addons/addons.component').then(m => m.AddonsComponent),
        title: 'Kiegészítők'
      },
      {
        path: 'marketplace',
        loadComponent: () => import('./pages/subscription/marketplace/marketplace-page.component').then(m => m.MarketplacePageComponent),
        title: 'Marketplace'
      },
      {
        path: 'marketplace/usage',
        loadComponent: () => import('./pages/subscription/marketplace-usage/marketplace-usage-page.component').then(m => m.MarketplaceUsagePageComponent),
        title: 'Használat'
      },
      {
        path: 'marketplace/:moduleKey',
        loadComponent: () => import('./pages/subscription/module-detail/module-detail-page.component').then(m => m.ModuleDetailPageComponent),
        title: 'Modul részletek'
      },
      {
        path: 'pause',
        loadComponent: () => import('./pages/subscription/account-pause/account-pause.component').then(m => m.AccountPauseComponent),
        title: 'Szüneteltetés'
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/subscription/account-delete/account-delete.component').then(m => m.AccountDeleteComponent),
        title: 'Fiók törlése'
      }
    ]
  },
  {
    path: 'settings',
    children: [
      {
        path: 'billing',
        loadComponent: () => import('./pages/partner-settings/billing/billing.component').then(m => m.BillingComponent),
        title: 'Számlázás és fizetés'
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/partner-settings/services/service-catalog.component').then(m => m.ServiceCatalogComponent),
        title: 'Szolgáltatások'
      },
      {
        path: 'email-account',
        loadComponent: () => import('./pages/partner-settings/email-account/email-account-settings.component').then(m => m.EmailAccountSettingsComponent),
        title: 'E-mail fiók'
      }
    ]
  },
  {
    path: 'prepayment',
    children: [
      {
        path: 'settings',
        loadComponent: () => import('./pages/prepayment/config/prepayment-config.component').then(m => m.PrepaymentConfigComponent),
        title: 'Előlegfizetés beállítások'
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/prepayment/stats/prepayment-stats.component').then(m => m.PrepaymentStatsComponent),
        title: 'Előleg statisztikák'
      },
      {
        path: '',
        loadComponent: () => import('./pages/prepayment/list/prepayment-list.component').then(m => m.PrepaymentListComponent),
        title: 'Előlegek'
      }
    ]
  },
  {
    path: 'webshop',
    children: [
      {
        path: 'settings',
        loadComponent: () => import('./pages/webshop/settings/webshop-settings.component').then(m => m.WebshopSettingsComponent),
        title: 'Webshop beállítások'
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/webshop/products/webshop-products.component').then(m => m.WebshopProductsComponent),
        title: 'Termékek és árak'
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/webshop/orders/webshop-orders.component').then(m => m.WebshopOrdersComponent),
        title: 'Webshop rendelések'
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/webshop/orders/webshop-order-detail.component').then(m => m.WebshopOrderDetailComponent),
        title: 'Rendelés részletek'
      }
    ]
  },
  {
    path: 'billing-charges',
    loadComponent: () => import('./pages/billing-charges/billing-charges.component').then(m => m.BillingChargesComponent),
    title: 'Terhelések'
  },
  {
    path: 'bugs',
    loadComponent: () => import('../bug-reports/pages/bug-report-list/bug-report-list.component').then(m => m.BugReportListComponent)
  },
  {
    path: 'bugs/:id',
    loadComponent: () => import('../bug-reports/pages/bug-report-detail/bug-report-detail.component').then(m => m.BugReportDetailComponent)
  },
  {
    path: 'booking',
    children: [
      { path: '', redirectTo: 'calendar', pathMatch: 'full' },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/booking/calendar/booking-calendar.component').then(m => m.BookingCalendarComponent),
        title: 'Naptar'
      },
      {
        path: 'bookings',
        loadComponent: () => import('./pages/booking/bookings/booking-list.component').then(m => m.BookingListComponent),
        title: 'Foglalasok'
      },
      {
        path: 'session-types',
        loadComponent: () => import('./pages/booking/session-types/session-types.component').then(m => m.SessionTypesComponent),
        title: 'Fotozasi tipusok'
      },
      {
        path: 'availability',
        loadComponent: () => import('./pages/booking/availability/availability.component').then(m => m.AvailabilityComponent),
        title: 'Elerhetoseg'
      },
      {
        path: 'batch-import',
        loadComponent: () => import('./pages/booking/batch-import/batch-import.component').then(m => m.BatchImportComponent),
        title: 'CSV Import'
      },
      {
        path: 'page-settings',
        loadComponent: () => import('./pages/booking/page-settings/booking-page-settings.component').then(m => m.BookingPageSettingsComponent),
        title: 'Foglalasi oldal'
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/booking/stats/booking-stats.component').then(m => m.BookingStatsComponent),
        title: 'Statisztikak'
      },
    ]
  },
  {
    path: 'workflows',
    loadComponent: () => import('./pages/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
    title: 'Előkészítő'
  },
  {
    path: 'workflows/settings',
    loadComponent: () => import('./pages/workflow-schedule-settings/workflow-schedule-settings.component').then(m => m.WorkflowScheduleSettingsComponent),
    title: 'Ütemezés beállítások'
  },
  {
    path: 'workflows/:id',
    loadComponent: () => import('./pages/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent),
    title: 'Workflow részletek'
  },
];
