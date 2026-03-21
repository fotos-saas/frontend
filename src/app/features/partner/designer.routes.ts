import { Routes } from '@angular/router';

export const DESIGNER_CHILDREN_ROUTES: Routes = [
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
    path: 'projects/teacher-debug',
    loadComponent: () => import('./pages/teacher-debug/teacher-debug.component').then(m => m.TeacherDebugComponent)
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
    path: 'account',
    loadComponent: () => import('./pages/subscription/account-delete/account-delete.component').then(m => m.AccountDeleteComponent),
    title: 'Fiók törlése'
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
    path: 'email-hub',
    children: [
      { path: '', redirectTo: 'inbox', pathMatch: 'full' },
      {
        path: 'inbox',
        loadComponent: () => import('./pages/email-client/email-client-page.component').then(m => m.EmailClientPageComponent),
        title: 'Postaláda'
      },
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
      {
        path: 'ai-costs',
        loadComponent: () => import('./pages/email-hub-ai-costs/email-hub-ai-costs.component').then(m => m.EmailHubAiCostsComponent),
        title: 'AI Költségek'
      },
      {
        path: 'voice-profile',
        loadComponent: () => import('./pages/email-hub-voice-profile/email-hub-voice-profile.component').then(m => m.EmailHubVoiceProfileComponent),
        title: 'Hangprofil'
      },
      {
        path: 'modifications',
        loadComponent: () => import('./pages/email-hub-modifications/email-hub-modifications.component').then(m => m.EmailHubModificationsComponent),
        title: 'Módosítási körök'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/email-hub-analytics/email-hub-analytics.component').then(m => m.EmailHubAnalyticsComponent),
        title: 'Szezon Analitika'
      },
    ]
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
