import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
  DestroyRef,
  input,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { PartnerGalleryService } from '../../../../features/partner/services/partner-gallery.service';
import { PartnerAlbumService } from '../../../../features/partner/services/partner-album.service';
import { ProjectDetailHeaderComponent } from '../project-detail-header/project-detail-header.component';
import { ProjectDetailViewComponent } from '../project-detail-view/project-detail-view.component';
import { ProjectDetailTabsComponent, ProjectDetailTab } from '../project-detail-tabs/project-detail-tabs.component';
import { ProjectSettingsTabComponent } from '../project-settings-tab/project-settings-tab.component';
import { ProjectUsersTabComponent } from '../project-users-tab/project-users-tab.component';
import { ProjectPrintTabComponent, PrintFileUploadEvent, PrintFileDownloadEvent, PrintFileDeleteEvent } from '../project-print-tab/project-print-tab.component';
import { ProjectEmailsTabComponent } from '../project-emails-tab/project-emails-tab.component';
import { ProjectActivityTabComponent } from '../project-activity-tab/project-activity-tab.component';
import { ProjectTasksTabComponent } from '../project-tasks-tab/project-tasks-tab.component';
import { ProjectTaskDialogComponent } from '../project-task-dialog/project-task-dialog.component';
import { ProjectTaskAnswerDialogComponent } from '../project-task-answer-dialog/project-task-answer-dialog.component';
import {
  ProjectSamplesTabComponent,
  PackageDialogRequest,
  VersionDialogRequest,
  DeleteVersionRequest,
} from '../project-samples-tab/project-samples-tab.component';
import { SamplePackageDialogComponent } from '../sample-package-dialog/sample-package-dialog.component';
import { SampleVersionDialogComponent } from '../sample-version-dialog/sample-version-dialog.component';
import { ProjectDetailData, ProjectContact } from '../project-detail.types';
import {
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_CONTACT_MODAL_COMPONENT,
  PROJECT_EDIT_MODAL_COMPONENT,
  PROJECT_WIZARD_EDIT_MODAL_COMPONENT,
  PROJECT_ORDER_DATA_DIALOG_COMPONENT,
  ProjectDataMapper,
} from '../project-detail.tokens';
import { ICONS } from '../../../constants/icons.constants';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import { ProjectTagManagerComponent } from '../../../../features/partner/components/project-tag-manager/project-tag-manager.component';
import { GuestSession, SamplePackage } from '../../../../features/partner/services/partner.service';
import { PartnerFinalizationService } from '../../../../features/partner/services/partner-finalization.service';
import { ProjectDetailWrapperFacadeService } from './project-detail-wrapper-facade.service';
import { ProjectDetailDynamicDialogsService } from './project-detail-dynamic-dialogs.service';
import { ProjectDetailPrintActionsService } from './project-detail-print-actions.service';
import { initTabFromFragment, setTabFragment } from '../../../utils/tab-persistence.util';
import { ExpandedTeacherViewComponent } from '../../../../features/partner/components/expanded-teacher-view/expanded-teacher-view.component';

/**
 * Generikus Project Detail Wrapper - kozos smart wrapper komponens.
 * Az uzleti logika 3 service-be van kiemelve:
 * - ProjectDetailWrapperFacadeService: alap CRUD, modal, QR, contact, project, gallery
 * - ProjectDetailDynamicDialogsService: lazy-loaded dialogusok (persons, upload, order, selection)
 * - ProjectDetailPrintActionsService: print fajl muveletek, pending ZIP, task muveletek
 */
@Component({
  selector: 'app-project-detail-wrapper',
  standalone: true,
  imports: [
    LucideAngularModule,
    ProjectDetailHeaderComponent,
    ProjectDetailViewComponent,
    ProjectDetailTabsComponent,
    ProjectUsersTabComponent,
    ProjectSamplesTabComponent,
    ProjectSettingsTabComponent,
    ProjectPrintTabComponent,
    ProjectEmailsTabComponent,
    ProjectActivityTabComponent,
    ProjectTasksTabComponent,
    ProjectTaskDialogComponent,
    ProjectTaskAnswerDialogComponent,
    ConfirmDialogComponent,
    SamplePackageDialogComponent,
    SampleVersionDialogComponent,
    ProjectTagManagerComponent,
    ExpandedTeacherViewComponent,
  ],
  templateUrl: './project-detail-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ProjectDetailWrapperFacadeService,
    ProjectDetailDynamicDialogsService,
    ProjectDetailPrintActionsService,
  ],
})
export class ProjectDetailWrapperComponent<T> implements OnInit {
  mapToDetailData = input.required<ProjectDataMapper<T>>();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(PROJECT_DETAIL_SERVICE);
  private readonly backRoute = inject(PROJECT_BACK_ROUTE);
  private readonly contactModalComponent = inject(PROJECT_CONTACT_MODAL_COMPONENT);
  private readonly projectEditModalComponent = inject(PROJECT_EDIT_MODAL_COMPONENT, { optional: true });
  private readonly wizardEditModalComponent = inject(PROJECT_WIZARD_EDIT_MODAL_COMPONENT, { optional: true });
  private readonly orderDataDialogComponent = inject(PROJECT_ORDER_DATA_DIALOG_COMPONENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService, { optional: true });
  private readonly galleryService = inject(PartnerGalleryService, { optional: true });
  private readonly albumService = inject(PartnerAlbumService, { optional: true });
  private readonly finalizationService = inject(PartnerFinalizationService, { optional: true });
  private readonly toast = inject(ToastService);
  private readonly electronService = inject(ElectronService);

  readonly facade = inject(ProjectDetailWrapperFacadeService<T>);
  readonly dialogs = inject(ProjectDetailDynamicDialogsService<T>);
  readonly printActions = inject(ProjectDetailPrintActionsService);

  // ViewChild references for dynamic component creation
  private readonly qrModalContainer = viewChild('qrModalContainer', { read: ViewContainerRef });
  private readonly contactModalContainer = viewChild('contactModalContainer', { read: ViewContainerRef });
  private readonly projectEditModalContainer = viewChild('projectEditModalContainer', { read: ViewContainerRef });
  private readonly orderDataDialogContainer = viewChild('orderDataDialogContainer', { read: ViewContainerRef });
  private readonly personsModalContainer = viewChild('personsModalContainer', { read: ViewContainerRef });
  private readonly addPersonsDialogContainer = viewChild('addPersonsDialogContainer', { read: ViewContainerRef });
  private readonly uploadWizardContainer = viewChild('uploadWizardContainer', { read: ViewContainerRef });
  private readonly selectionDownloadContainer = viewChild('selectionDownloadContainer', { read: ViewContainerRef });
  private readonly orderWizardContainer = viewChild('orderWizardContainer', { read: ViewContainerRef });

  readonly ICONS = ICONS;
  readonly isMarketer = this.authService.isMarketer;
  readonly showTabloEditorBtn = computed(() => this.electronService.isElectron && !this.isMarketer());

  /** Tab badge-ek (pl. Feladatok tab-on a pending count, Nyomda tab-on üzenetek száma) */
  readonly tabBadges = computed<Partial<Record<ProjectDetailTab, number>>>(() => {
    const data = this.facade.projectData();
    const badges: Partial<Record<ProjectDetailTab, number>> = {};
    if (data?.pendingTaskCount) badges['tasks'] = data.pendingTaskCount;
    if (data?.printMessagesCount) badges['print'] = data.printMessagesCount;
    return badges;
  });

  /** Kiemelt badge-ek (olvasatlan üzenet → piros badge) */
  readonly highlightedBadges = computed<ProjectDetailTab[]>(() => {
    const data = this.facade.projectData();
    if (data?.unreadPrintMessagesCount) return ['print'];
    return [];
  });

  activeTab = signal<ProjectDetailTab>('overview');
  hiddenTabs = computed<ProjectDetailTab[]>(() => {
    const hidden: ProjectDetailTab[] = [];
    if (this.isMarketer()) hidden.push('settings');
    const status = this.facade.projectData()?.status;
    if (status !== 'in_print' && status !== 'done') hidden.push('print');
    return hidden;
  });

  /** Ha a projekt nyomdában van, a Nyomda tab legyen pinned (ne a Továbbiak-ban) */
  extraPinnedTabs = computed<ProjectDetailTab[]>(() => {
    const status = this.facade.projectData()?.status;
    if (status === 'in_print' || status === 'done') return ['print'];
    return [];
  });

  // Tab references
  private readonly usersTab = viewChild(ProjectUsersTabComponent);
  private readonly samplesTab = viewChild(ProjectSamplesTabComponent);
  private readonly printTab = viewChild(ProjectPrintTabComponent);
  readonly tasksTab = viewChild(ProjectTasksTabComponent);

  reloadProject(): void {
    const id = this.facade.projectData()?.id;
    if (id) this.facade.loadProject(id, this.mapToDetailData());
  }

  ngOnInit(): void {
    const reloadProject = () => this.facade.loadProject(
      this.facade.projectData()!.id,
      this.mapToDetailData(),
    );

    this.facade.init({
      projectService: this.projectService,
      backRoute: this.backRoute,
      contactModalComponent: this.contactModalComponent,
      projectEditModalComponent: this.projectEditModalComponent,
      wizardEditModalComponent: this.wizardEditModalComponent,
      orderDataDialogComponent: this.orderDataDialogComponent,
      partnerService: this.partnerService,
      destroyRef: this.destroyRef,
      router: this.router,
      toast: this.toast,
    });
    this.facade.setMapFn(this.mapToDetailData());

    this.dialogs.init({
      destroyRef: this.destroyRef,
      toast: this.toast,
      galleryService: this.galleryService,
      getProjectData: () => this.facade.projectData(),
      reloadProject,
    });

    this.printActions.init({
      destroyRef: this.destroyRef,
      toast: this.toast,
      finalizationService: this.finalizationService,
      albumService: this.albumService,
      getProjectData: () => this.facade.projectData(),
      reloadProject,
    });

    const validTabs = ['overview', 'emails', 'users', 'samples', 'tasks', 'settings', 'print', 'activity'] as const;
    initTabFromFragment(this.activeTab, this.location, validTabs, 'overview');

    // Fragment változás figyelése (pl. notification kattintás #print)
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(fragment => {
      if (fragment && (validTabs as readonly string[]).includes(fragment)) {
        this.activeTab.set(fragment as ProjectDetailTab);
      }
    });

    // Same-URL hashchange figyelése (notification kattintás ugyanazon az oldalon)
    const onHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && (validTabs as readonly string[]).includes(hash)) {
        this.activeTab.set(hash as ProjectDetailTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    this.destroyRef.onDestroy(() => window.removeEventListener('hashchange', onHashChange));

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) {
      this.facade.loading.set(false);
      return;
    }
    this.facade.loadProject(id, this.mapToDetailData());
  }

  goBack(): void { this.facade.goBack(); }

  navigateToTabloEditor(): void {
    const id = this.facade.projectData()?.id;
    if (!id) return;
    this.router.navigate(['tablo-editor'], { relativeTo: this.route });
  }

  onStatusChange(event: { value: string; label: string; color: string }): void {
    this.facade.updateProjectStatus(event);
  }

  onTagsChanged(tags: Array<{ id: number; name: string; color: string }>): void {
    const current = this.facade.projectData();
    if (current) {
      this.facade.projectData.set({ ...current, tags });
    }
  }

  changeTab(tab: ProjectDetailTab): void {
    setTabFragment(this.activeTab, this.location, tab, 'overview');
    if (tab === 'print') {
      const current = this.facade.projectData();
      if (current?.unreadPrintMessagesCount) {
        this.facade.projectData.set({ ...current, unreadPrintMessagesCount: 0 });
      }
    }
  }

  // === MODAL DELEGATIONS (facade) ===

  openQrModal(): void {
    const container = this.qrModalContainer();
    if (!container || !this.facade.project()) return;
    this.facade.openQrModal(container);
  }

  openContactModal(contact: ProjectContact | null): void {
    const container = this.contactModalContainer();
    if (!container || !this.facade.project()) return;
    this.facade.openContactModal(container, contact);
  }

  openEditProjectModal(): void {
    const container = this.projectEditModalContainer();
    if (!container) return;
    this.facade.openEditProjectModal(container);
  }

  openOrderDataDialog(): void {
    const container = this.orderDataDialogContainer();
    if (!container) return;
    this.facade.openOrderDataDialog(container);
  }

  // === SAMPLES DELEGATIONS (facade) ===

  onPackageSaved(): void { this.facade.closePackageDialog(); this.samplesTab()?.onDialogSaved(); }
  onVersionSaved(): void { this.facade.closeVersionDialog(); this.samplesTab()?.onDialogSaved(); }

  onDeletePackageResult(result: ConfirmDialogResult): void {
    this.facade.onDeletePackageResult(result, (p) => this.samplesTab()?.executeDeletePackage(p));
  }

  onDeleteVersionResult(result: ConfirmDialogResult): void {
    this.facade.onDeleteVersionResult(result, (pkgId, vId) => this.samplesTab()?.executeDeleteVersion(pkgId, vId));
  }

  // === USER DELEGATIONS (facade) ===

  onDeleteUserResult(result: ConfirmDialogResult): void {
    this.facade.onDeleteUserResult(result, (s) => this.usersTab()?.executeDelete(s));
  }

  // === DYNAMIC DIALOG DELEGATIONS ===

  // Bővített tanári nézet
  showExpandedTeacherView = signal(false);
  expandedTeacherViewProjectId = signal<number | null>(null);

  closeExpandedTeacherView(): void {
    this.showExpandedTeacherView.set(false);
    this.facade.loadProject(this.facade.projectData()!.id, this.mapToDetailData());
  }

  openPersonsModalDialog(typeFilter?: 'student' | 'teacher'): void {
    const container = this.personsModalContainer();
    if (!container) return;
    this.dialogs.openPersonsModal(
      container,
      typeFilter,
      (album) => this.openUploadWizardDialog(album),
      (type) => this.openAddPersonsDialog(type),
      (data) => {
        this.expandedTeacherViewProjectId.set(data.projectId);
        this.showExpandedTeacherView.set(true);
      },
    );
  }

  openAddPersonsDialog(type: 'student' | 'teacher'): void {
    const container = this.addPersonsDialogContainer();
    if (!container) return;
    this.dialogs.openAddPersonsDialog(container, type);
  }

  openUploadWizardDialog(initialAlbum?: 'students' | 'teachers'): void {
    const container = this.uploadWizardContainer();
    if (!container) return;
    this.dialogs.openUploadWizard(container, initialAlbum);
  }

  openOrderWizardDialog(): void {
    if (this.facade.useWizardEdit()) {
      this.openEditProjectModal();
    } else {
      const container = this.orderWizardContainer();
      if (!container) return;
      this.dialogs.openOrderWizard(container);
    }
  }

  openSelectionDownloadDialog(): void {
    const container = this.selectionDownloadContainer();
    if (!container) return;
    this.dialogs.openSelectionDownloadDialog(container);
  }

  // === PRINT DELEGATIONS ===

  downloadPrintFile(event: PrintFileDownloadEvent): void { this.printActions.downloadPrintFile(event); }

  uploadPrintFile(event: PrintFileUploadEvent): void {
    this.printActions.uploadPrintFile(event, this.printTab()?.state);
  }

  confirmDeletePrintFile(event: PrintFileDeleteEvent): void { this.printActions.confirmDeletePrintFile(event); }
  onDeletePrintFileResult(result: ConfirmDialogResult): void { this.printActions.onDeletePrintFileResult(result); }

  downloadPendingPhotosZip(): void { this.printActions.downloadPendingPhotosZip(); }

  // === TASK DELEGATIONS ===

  openTaskDialog(task: ProjectTask | null): void { this.printActions.openTaskDialog(task); }
  closeTaskDialog(): void { this.printActions.closeTaskDialog(); }

  onTaskSaved(task: ProjectTask): void {
    this.printActions.onTaskSaved(task, (t, wasEdit) => this.tasksTab()?.onTaskSaved(t, wasEdit));
  }

  confirmDeleteTask(task: ProjectTask): void { this.printActions.confirmDeleteTask(task); }

  onTaskDeleteResult(result: ConfirmDialogResult): void {
    this.printActions.onTaskDeleteResult(result, (t) => this.tasksTab()?.executeDelete(t));
  }

  // === ANSWER DELEGATIONS ===

  openAnswerDialog(task: ProjectTask): void { this.printActions.openAnswerDialog(task); }
  closeAnswerDialog(): void { this.printActions.closeAnswerDialog(); }

  onAnswerSaved(task: ProjectTask): void {
    this.printActions.onAnswerSaved(task, (t, wasEdit) => this.tasksTab()?.onTaskSaved(t, wasEdit));
  }
}
