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
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ProjectDetailHeaderComponent } from '../project-detail-header/project-detail-header.component';
import { ProjectDetailViewComponent } from '../project-detail-view/project-detail-view.component';
import { ProjectDetailTabsComponent, ProjectDetailTab } from '../project-detail-tabs/project-detail-tabs.component';
import { ProjectSettingsTabComponent } from '../project-settings-tab/project-settings-tab.component';
import { ProjectUsersTabComponent } from '../project-users-tab/project-users-tab.component';
import {
  ProjectSamplesTabComponent,
  PackageDialogRequest,
  VersionDialogRequest,
  DeleteVersionRequest,
} from '../project-samples-tab/project-samples-tab.component';
import { SamplePackageDialogComponent } from '../sample-package-dialog/sample-package-dialog.component';
import { SampleVersionDialogComponent } from '../sample-version-dialog/sample-version-dialog.component';
import { TeacherSyncDialogComponent } from '../../../../features/partner/components/teacher-sync-dialog/teacher-sync-dialog.component';
import { ProjectDetailData, ProjectContact, QrCode } from '../project-detail.types';
import {
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_QR_MODAL_COMPONENT,
  PROJECT_CONTACT_MODAL_COMPONENT,
  PROJECT_EDIT_MODAL_COMPONENT,
  PROJECT_ORDER_DATA_DIALOG_COMPONENT,
  ProjectDataMapper,
} from '../project-detail.tokens';
import { ICONS } from '../../../constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import { GuestSession, SamplePackage } from '../../../../features/partner/services/partner.service';
import { ProjectDetailWrapperFacadeService } from './project-detail-wrapper-facade.service';
import { initTabFromFragment, setTabFragment } from '../../../utils/tab-persistence.util';

/**
 * Generikus Project Detail Wrapper - kozos smart wrapper komponens.
 * Az uzleti logika a ProjectDetailWrapperFacadeService-ben van.
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
    ConfirmDialogComponent,
    SamplePackageDialogComponent,
    SampleVersionDialogComponent,
    TeacherSyncDialogComponent,
  ],
  templateUrl: './project-detail-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectDetailWrapperFacadeService],
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
  private readonly orderDataDialogComponent = inject(PROJECT_ORDER_DATA_DIALOG_COMPONENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService, { optional: true });
  private readonly toast = inject(ToastService);

  readonly facade = inject(ProjectDetailWrapperFacadeService<T>);

  // ViewChild references for dynamic component creation
  private readonly qrModalContainer = viewChild('qrModalContainer', { read: ViewContainerRef });
  private readonly contactModalContainer = viewChild('contactModalContainer', { read: ViewContainerRef });
  private readonly projectEditModalContainer = viewChild('projectEditModalContainer', { read: ViewContainerRef });
  private readonly orderDataDialogContainer = viewChild('orderDataDialogContainer', { read: ViewContainerRef });

  readonly ICONS = ICONS;
  readonly isMarketer = this.authService.isMarketer;

  activeTab = signal<ProjectDetailTab>('overview');
  showTeacherSyncDialog = signal(false);
  hiddenTabs = computed<ProjectDetailTab[]>(() =>
    this.isMarketer() ? ['settings'] : []
  );

  // Delegate state signals from facade
  get loading() { return this.facade.loading; }
  get project() { return this.facade.project; }
  get projectData() { return this.facade.projectData; }
  get showQrModal() { return this.facade.showQrModal; }
  get showContactModal() { return this.facade.showContactModal; }
  get editingContact() { return this.facade.editingContact; }
  get showDeleteConfirm() { return this.facade.showDeleteConfirm; }
  get deletingContact() { return this.facade.deletingContact; }
  get deleting() { return this.facade.deleting; }
  get showDeleteUserConfirm() { return this.facade.showDeleteUserConfirm; }
  get deletingUser() { return this.facade.deletingUser; }
  get showPackageDialog() { return this.facade.showPackageDialog; }
  get packageDialogData() { return this.facade.packageDialogData; }
  get showVersionDialog() { return this.facade.showVersionDialog; }
  get versionDialogData() { return this.facade.versionDialogData; }
  get showDeletePackageConfirm() { return this.facade.showDeletePackageConfirm; }
  get deletingPackageData() { return this.facade.deletingPackageData; }
  get showDeleteVersionConfirm() { return this.facade.showDeleteVersionConfirm; }
  get deletingVersionData() { return this.facade.deletingVersionData; }
  get showDeleteProjectConfirm() { return this.facade.showDeleteProjectConfirm; }
  get deletingProject() { return this.facade.deletingProject; }

  // Tab references
  private readonly usersTab = viewChild(ProjectUsersTabComponent);
  private readonly samplesTab = viewChild(ProjectSamplesTabComponent);

  ngOnInit(): void {
    this.facade.init({
      projectService: this.projectService,
      backRoute: this.backRoute,
      contactModalComponent: this.contactModalComponent,
      projectEditModalComponent: this.projectEditModalComponent,
      orderDataDialogComponent: this.orderDataDialogComponent,
      partnerService: this.partnerService,
      destroyRef: this.destroyRef,
      router: this.router,
      toast: this.toast,
    });

    this.facade.setMapFn(this.mapToDetailData());

    initTabFromFragment(this.activeTab, this.location, ['overview', 'users', 'samples', 'settings'] as const, 'overview');

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) {
      this.facade.loading.set(false);
      return;
    }
    this.facade.loadProject(id, this.mapToDetailData());
  }

  goBack(): void { this.facade.goBack(); }

  changeTab(tab: ProjectDetailTab): void {
    setTabFragment(this.activeTab, this.location, tab, 'overview');
  }

  // === MODAL DELEGATIONS ===

  openQrModal(): void {
    const container = this.qrModalContainer();
    if (!container || !this.project()) return;
    this.facade.openQrModal(container);
  }

  closeQrModal(): void { this.facade.closeQrModal(); }

  openContactModal(contact: ProjectContact | null): void {
    const container = this.contactModalContainer();
    if (!container || !this.project()) return;
    this.facade.openContactModal(container, contact);
  }

  closeContactModal(): void { this.facade.closeContactModal(); }

  confirmDeleteContact(contact: ProjectContact): void { this.facade.confirmDeleteContact(contact); }
  onDeleteContactResult(result: ConfirmDialogResult): void { this.facade.onDeleteContactResult(result); }

  openEditProjectModal(): void {
    const container = this.projectEditModalContainer();
    if (!container) return;
    this.facade.openEditProjectModal(container);
  }

  closeEditProjectModal(): void { this.facade.closeEditProjectModal(); }

  confirmDeleteProject(): void { this.facade.confirmDeleteProject(); }
  onDeleteProjectResult(result: ConfirmDialogResult): void { this.facade.onDeleteProjectResult(result); }

  openOrderDataDialog(): void {
    const container = this.orderDataDialogContainer();
    if (!container) return;
    this.facade.openOrderDataDialog(container);
  }

  closeOrderDataDialog(): void { this.facade.closeOrderDataDialog(); }

  // === SAMPLES DELEGATIONS ===

  openPackageDialog(request: PackageDialogRequest): void { this.facade.openPackageDialog(request); }
  closePackageDialog(): void { this.facade.closePackageDialog(); }
  onPackageSaved(): void { this.facade.closePackageDialog(); this.samplesTab()?.onDialogSaved(); }

  openVersionDialog(request: VersionDialogRequest): void { this.facade.openVersionDialog(request); }
  closeVersionDialog(): void { this.facade.closeVersionDialog(); }
  onVersionSaved(): void { this.facade.closeVersionDialog(); this.samplesTab()?.onDialogSaved(); }

  confirmDeletePackage(pkg: SamplePackage): void { this.facade.confirmDeletePackage(pkg); }
  onDeletePackageResult(result: ConfirmDialogResult): void {
    this.facade.onDeletePackageResult(result, (p) => this.samplesTab()?.executeDeletePackage(p));
  }

  confirmDeleteVersion(request: DeleteVersionRequest): void { this.facade.confirmDeleteVersion(request); }
  onDeleteVersionResult(result: ConfirmDialogResult): void {
    this.facade.onDeleteVersionResult(result, (pkgId, vId) => this.samplesTab()?.executeDeleteVersion(pkgId, vId));
  }

  // === USER DELEGATIONS ===

  confirmDeleteUser(session: GuestSession): void { this.facade.confirmDeleteUser(session); }
  onDeleteUserResult(result: ConfirmDialogResult): void {
    this.facade.onDeleteUserResult(result, (s) => this.usersTab()?.executeDelete(s));
  }

  // === GALLERY ===

  extendGalleryDeadline(days: number): void { this.facade.extendGalleryDeadline(days); }
  createGallery(): void { this.facade.createGallery(); }

  // === TEACHER SYNC ===

  openTeacherSyncDialog(): void { this.showTeacherSyncDialog.set(true); }
  closeTeacherSyncDialog(): void { this.showTeacherSyncDialog.set(false); }
  onTeacherSynced(): void {
    this.showTeacherSyncDialog.set(false);
    this.toast.success('Sikeres', 'Tanár fotók szinkronizálva!');
    // Reload project to reflect new photos
    const id = this.projectData()?.id;
    if (id) this.facade.loadProject(id, this.mapToDetailData());
  }
}
