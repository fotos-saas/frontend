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
  ComponentRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ProjectDetailData, ProjectContact, QrCode } from '../project-detail.types';
import {
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_QR_MODAL_COMPONENT,
  PROJECT_CONTACT_MODAL_COMPONENT,
  PROJECT_EDIT_MODAL_COMPONENT,
  PROJECT_ORDER_DATA_DIALOG_COMPONENT,
  IProjectDetailService,
  ProjectDataMapper,
} from '../project-detail.tokens';
import { ICONS } from '../../../constants/icons.constants';
import { SharedQrCodeModalComponent } from '../../qr-code-modal/qr-code-modal.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import { IQrCodeService } from '../../../interfaces/qr-code.interface';
import { GuestSession, SamplePackage, SampleVersion } from '../../../../features/partner/services/partner.service';

/**
 * Generikus Project Detail Wrapper - közös smart wrapper komponens.
 *
 * Használat (feature komponensben):
 * ```typescript
 * @Component({
 *   providers: [
 *     { provide: PROJECT_DETAIL_SERVICE, useExisting: MarketerService },
 *     { provide: PROJECT_BACK_ROUTE, useValue: '/marketer/projects' },
 *     { provide: PROJECT_QR_MODAL_COMPONENT, useValue: QrCodeModalComponent },
 *     { provide: PROJECT_CONTACT_MODAL_COMPONENT, useValue: ContactEditorModalComponent },
 *   ],
 *   template: `<app-project-detail-wrapper [mapToDetailData]="mapProject" />`
 * })
 * export class ProjectDetailComponent {
 *   mapProject = (p: ProjectDetails): ProjectDetailData => ({ ... });
 * }
 * ```
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
  ],
  templateUrl: './project-detail-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailWrapperComponent<T> implements OnInit {
  /** Mapping függvény a feature-specifikus típusból ProjectDetailData-ra */
  mapToDetailData = input.required<ProjectDataMapper<T>>();

  // Injected dependencies
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private projectService = inject(PROJECT_DETAIL_SERVICE);
  private backRoute = inject(PROJECT_BACK_ROUTE);
  private qrModalComponent = inject(PROJECT_QR_MODAL_COMPONENT, { optional: true });
  private contactModalComponent = inject(PROJECT_CONTACT_MODAL_COMPONENT);
  private projectEditModalComponent = inject(PROJECT_EDIT_MODAL_COMPONENT, { optional: true });
  private orderDataDialogComponent = inject(PROJECT_ORDER_DATA_DIALOG_COMPONENT, { optional: true });
  private destroyRef = inject(DestroyRef);
  private partnerService = inject(PartnerService, { optional: true });
  private toast = inject(ToastService);

  // ViewChild references for dynamic component creation
  private qrModalContainer = viewChild('qrModalContainer', { read: ViewContainerRef });
  private contactModalContainer = viewChild('contactModalContainer', { read: ViewContainerRef });
  private projectEditModalContainer = viewChild('projectEditModalContainer', { read: ViewContainerRef });
  private orderDataDialogContainer = viewChild('orderDataDialogContainer', { read: ViewContainerRef });

  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;
  readonly isMarketer = this.authService.isMarketer;

  // Tab state
  activeTab = signal<ProjectDetailTab>('overview');

  /** Marketer nem látja a settings tab-ot */
  hiddenTabs = computed<ProjectDetailTab[]>(() =>
    this.isMarketer() ? ['settings'] : []
  );

  // State signals
  loading = signal(true);
  project = signal<T | null>(null);
  projectData = signal<ProjectDetailData | null>(null);

  // Modal states
  showQrModal = signal(false);
  showContactModal = signal(false);
  editingContact = signal<ProjectContact | null>(null);

  // Delete contact confirmation states
  showDeleteConfirm = signal(false);
  deletingContact = signal<ProjectContact | null>(null);
  deleting = signal(false);

  // Delete user confirmation states
  showDeleteUserConfirm = signal(false);
  deletingUser = signal<GuestSession | null>(null);

  // Samples dialogs state (page-card-on kívül kezelve)
  showPackageDialog = signal(false);
  packageDialogData = signal<PackageDialogRequest | null>(null);
  showVersionDialog = signal(false);
  versionDialogData = signal<VersionDialogRequest | null>(null);
  showDeletePackageConfirm = signal(false);
  deletingPackageData = signal<SamplePackage | null>(null);
  showDeleteVersionConfirm = signal(false);
  deletingVersionData = signal<DeleteVersionRequest | null>(null);


  // Delete project confirmation states
  showDeleteProjectConfirm = signal(false);
  deletingProject = signal(false);

  // Tab references
  private usersTab = viewChild(ProjectUsersTabComponent);
  private samplesTab = viewChild(ProjectSamplesTabComponent);

  // Dynamic component references
  private qrModalRef: ComponentRef<any> | null = null;
  private contactModalRef: ComponentRef<any> | null = null;
  private projectEditModalRef: ComponentRef<any> | null = null;
  private orderDataDialogRef: ComponentRef<any> | null = null;

  ngOnInit(): void {
    // Tab query param figyelés
    const validTabs = ['overview', 'users', 'samples', 'settings'];
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      this.activeTab.set(tabParam as ProjectDetailTab);
    }

    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const tab = params.get('tab');
      if (tab && validTabs.includes(tab)) {
        this.activeTab.set(tab as ProjectDetailTab);
      }
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) {
      this.loading.set(false);
      return;
    }
    this.loadProject(id);
  }

  private loadProject(id: number): void {
    this.projectService.getProjectDetails(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (project: T) => {
        this.project.set(project);
        this.projectData.set(this.mapToDetailData()(project));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate([this.backRoute]);
  }

  changeTab(tab: ProjectDetailTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab === 'overview' ? {} : { tab },
      queryParamsHandling: tab === 'overview' ? '' : 'merge',
    });
  }

  // QR Modal methods
  openQrModal(): void {
    const container = this.qrModalContainer();
    if (!container) return;

    const project = this.project();
    if (!project) return;

    container.clear();

    // Shared QR modal komponens használata - a projectService implementálja az IQrCodeService-t
    this.qrModalRef = container.createComponent(SharedQrCodeModalComponent);

    // Set inputs - Angular 17+ signal inputs
    const projectData = this.projectData();
    this.qrModalRef.setInput('projectId', projectData?.id);
    this.qrModalRef.setInput('projectName', projectData?.name ?? '');
    this.qrModalRef.setInput('qrService', this.projectService as unknown as IQrCodeService);

    // Subscribe to outputs
    this.qrModalRef.instance.close.subscribe(() => this.closeQrModal());
    this.qrModalRef.instance.qrCodeChanged.subscribe((qr: QrCode | null) => this.onQrCodeChanged(qr));

    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.qrModalRef?.destroy();
    this.qrModalRef = null;
    this.showQrModal.set(false);
  }

  onQrCodeChanged(_qrCode: QrCode | null): void {
    const id = this.projectData()?.id;
    if (id) {
      this.loadProject(id);
    }
  }

  // Contact Modal methods
  openContactModal(contact: ProjectContact | null): void {
    const container = this.contactModalContainer();
    if (!container) return;

    const project = this.project();
    if (!project) return;

    container.clear();
    this.contactModalRef = container.createComponent(this.contactModalComponent);

    // Set inputs
    const projectData = this.projectData();
    this.contactModalRef.instance.projectId = projectData?.id;
    this.contactModalRef.instance.contact = contact;

    // Subscribe to outputs
    this.contactModalRef.instance.close?.subscribe(() => this.closeContactModal());
    this.contactModalRef.instance.saved?.subscribe((c: ProjectContact) => this.onContactSaved(c));

    this.editingContact.set(contact);
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.contactModalRef?.destroy();
    this.contactModalRef = null;
    this.showContactModal.set(false);
    this.editingContact.set(null);
  }

  onContactSaved(_contact: ProjectContact): void {
    this.closeContactModal();
    const id = this.projectData()?.id;
    if (id) {
      this.loadProject(id);
    }
  }

  // Delete confirmation methods
  confirmDeleteContact(contact: ProjectContact): void {
    this.deletingContact.set(contact);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingContact.set(null);
  }

  deleteContact(): void {
    const contact = this.deletingContact();
    const projectId = this.projectData()?.id;
    if (!contact?.id || !projectId) return;

    this.deleting.set(true);
    this.projectService.deleteContact(projectId, contact.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.cancelDelete();
        this.loadProject(projectId);
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  // Project Edit Modal methods
  openEditProjectModal(): void {
    if (!this.projectEditModalComponent) return;

    const container = this.projectEditModalContainer();
    if (!container) return;

    const projectData = this.projectData();
    if (!projectData) return;

    container.clear();
    this.projectEditModalRef = container.createComponent(this.projectEditModalComponent);

    // Set inputs
    this.projectEditModalRef.instance.project = projectData;

    // Subscribe to outputs
    this.projectEditModalRef.instance.close?.subscribe(() => this.closeEditProjectModal());
    this.projectEditModalRef.instance.saved?.subscribe(() => this.onProjectSaved());
  }

  closeEditProjectModal(): void {
    this.projectEditModalRef?.destroy();
    this.projectEditModalRef = null;
  }

  onProjectSaved(): void {
    this.closeEditProjectModal();
    const id = this.projectData()?.id;
    if (id) {
      this.loadProject(id);
    }
  }

  // Project Delete methods
  confirmDeleteProject(): void {
    this.showDeleteProjectConfirm.set(true);
  }

  cancelDeleteProject(): void {
    this.showDeleteProjectConfirm.set(false);
  }

  deleteProjectConfirmed(): void {
    const projectId = this.projectData()?.id;
    if (!projectId) return;

    this.deletingProject.set(true);
    this.projectService.deleteProject(projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deletingProject.set(false);
        this.cancelDeleteProject();
        this.goBack();
      },
      error: () => {
        this.deletingProject.set(false);
      },
    });
  }

  // Order Data Dialog methods
  openOrderDataDialog(): void {
    if (!this.orderDataDialogComponent) return;

    const container = this.orderDataDialogContainer();
    if (!container) return;

    const projectData = this.projectData();
    if (!projectData?.id) return;

    container.clear();
    this.orderDataDialogRef = container.createComponent(this.orderDataDialogComponent);

    this.orderDataDialogRef.setInput('projectId', projectData.id);
    this.orderDataDialogRef.instance.close?.subscribe(() => this.closeOrderDataDialog());
  }

  closeOrderDataDialog(): void {
    this.orderDataDialogRef?.destroy();
    this.orderDataDialogRef = null;
  }

  // Samples tab dialog methods (page-card-on KÍVÜL)
  openPackageDialog(request: PackageDialogRequest): void {
    this.packageDialogData.set(request);
    this.showPackageDialog.set(true);
  }

  closePackageDialog(): void {
    this.showPackageDialog.set(false);
    this.packageDialogData.set(null);
  }

  onPackageSaved(): void {
    this.closePackageDialog();
    this.samplesTab()?.onDialogSaved();
  }

  openVersionDialog(request: VersionDialogRequest): void {
    this.versionDialogData.set(request);
    this.showVersionDialog.set(true);
  }

  closeVersionDialog(): void {
    this.showVersionDialog.set(false);
    this.versionDialogData.set(null);
  }

  onVersionSaved(): void {
    this.closeVersionDialog();
    this.samplesTab()?.onDialogSaved();
  }

  confirmDeletePackage(pkg: SamplePackage): void {
    this.deletingPackageData.set(pkg);
    this.showDeletePackageConfirm.set(true);
  }

  onDeletePackageResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const pkg = this.deletingPackageData();
      if (pkg) {
        this.samplesTab()?.executeDeletePackage(pkg);
      }
    }
    this.showDeletePackageConfirm.set(false);
    this.deletingPackageData.set(null);
  }

  confirmDeleteVersion(request: DeleteVersionRequest): void {
    this.deletingVersionData.set(request);
    this.showDeleteVersionConfirm.set(true);
  }

  onDeleteVersionResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const data = this.deletingVersionData();
      if (data) {
        this.samplesTab()?.executeDeleteVersion(data.packageId, data.version.id);
      }
    }
    this.showDeleteVersionConfirm.set(false);
    this.deletingVersionData.set(null);
  }

  // Delete user methods (a users-tab output event-jét kezeli, dialog page-card-on KÍVÜL)
  confirmDeleteUser(session: GuestSession): void {
    this.deletingUser.set(session);
    this.showDeleteUserConfirm.set(true);
  }

  onDeleteUserResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      const session = this.deletingUser();
      if (session) {
        this.usersTab()?.executeDelete(session);
      }
    }
    this.showDeleteUserConfirm.set(false);
    this.deletingUser.set(null);
  }

  // Delete contact result handler
  onDeleteContactResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteContact();
    } else {
      this.cancelDelete();
    }
  }

  // Delete project result handler
  onDeleteProjectResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteProjectConfirmed();
    } else {
      this.cancelDeleteProject();
    }
  }

  // Gallery deadline
  extendGalleryDeadline(days: number): void {
    const projectId = this.projectData()?.id;
    if (!projectId || !this.partnerService) return;

    const currentDeadline = this.projectData()?.deadline;
    const base = currentDeadline ? new Date(currentDeadline) : new Date();
    base.setDate(base.getDate() + days);
    const newDeadline = base.toISOString().split('T')[0];

    this.partnerService.setGalleryDeadline(projectId, newDeadline).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.toast.success('Siker', 'Határidő beállítva');
        // Frissítjük a lokális project data-t
        const current = this.projectData();
        if (current) {
          this.projectData.set({ ...current, deadline: response.data.deadline });
        }
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült beállítani a határidőt');
      },
    });
  }

  // Gallery creation
  createGallery(): void {
    const projectId = this.projectData()?.id;
    if (!projectId || !this.partnerService) return;

    this.partnerService.createGallery(projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Siker', 'Galéria létrehozva');
        this.router.navigate(['/partner/projects', projectId, 'gallery']);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerült a galéria létrehozása');
      },
    });
  }
}
