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
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { PartnerGalleryService } from '../../../../features/partner/services/partner-gallery.service';
import { SelectionDownloadResult } from '../../../../features/partner/components/selection-download-dialog/selection-download-dialog.component';
import { saveFile } from '../../../utils/file.util';
import { projectShortName } from '../../../utils/string.util';
import { ProjectDetailHeaderComponent } from '../project-detail-header/project-detail-header.component';
import { ProjectDetailViewComponent } from '../project-detail-view/project-detail-view.component';
import { ProjectDetailTabsComponent, ProjectDetailTab } from '../project-detail-tabs/project-detail-tabs.component';
import { ProjectSettingsTabComponent } from '../project-settings-tab/project-settings-tab.component';
import { ProjectUsersTabComponent } from '../project-users-tab/project-users-tab.component';
import { ProjectPrintTabComponent } from '../project-print-tab/project-print-tab.component';
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
  ProjectDataMapper,
} from '../project-detail.tokens';
import { ICONS } from '../../../constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import { GuestSession, SamplePackage } from '../../../../features/partner/services/partner.service';
import { PartnerFinalizationService } from '../../../../features/partner/services/partner-finalization.service';
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
    ProjectPrintTabComponent,
    ConfirmDialogComponent,
    SamplePackageDialogComponent,
    SampleVersionDialogComponent,
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
  private readonly galleryService = inject(PartnerGalleryService, { optional: true });
  private readonly finalizationService = inject(PartnerFinalizationService, { optional: true });
  private readonly toast = inject(ToastService);

  readonly facade = inject(ProjectDetailWrapperFacadeService<T>);

  // ViewChild references for dynamic component creation
  private readonly qrModalContainer = viewChild('qrModalContainer', { read: ViewContainerRef });
  private readonly contactModalContainer = viewChild('contactModalContainer', { read: ViewContainerRef });
  private readonly projectEditModalContainer = viewChild('projectEditModalContainer', { read: ViewContainerRef });
  private readonly orderDataDialogContainer = viewChild('orderDataDialogContainer', { read: ViewContainerRef });
  private readonly personsModalContainer = viewChild('personsModalContainer', { read: ViewContainerRef });
  private readonly uploadWizardContainer = viewChild('uploadWizardContainer', { read: ViewContainerRef });
  private readonly selectionDownloadContainer = viewChild('selectionDownloadContainer', { read: ViewContainerRef });
  private readonly orderWizardContainer = viewChild('orderWizardContainer', { read: ViewContainerRef });

  readonly ICONS = ICONS;
  readonly isMarketer = this.authService.isMarketer;

  activeTab = signal<ProjectDetailTab>('overview');
  hiddenTabs = computed<ProjectDetailTab[]>(() => {
    const hidden: ProjectDetailTab[] = [];
    if (this.isMarketer()) hidden.push('settings');
    const status = this.projectData()?.status;
    if (status !== 'in_print' && status !== 'done') hidden.push('print');
    return hidden;
  });

  // Delegate state signals from facade - direct signal references
  readonly loading = this.facade.loading;
  readonly project = this.facade.project;
  readonly projectData = this.facade.projectData;
  readonly showQrModal = this.facade.showQrModal;
  readonly showContactModal = this.facade.showContactModal;
  readonly editingContact = this.facade.editingContact;
  readonly showDeleteConfirm = this.facade.showDeleteConfirm;
  readonly deletingContact = this.facade.deletingContact;
  readonly deleting = this.facade.deleting;
  readonly showDeleteUserConfirm = this.facade.showDeleteUserConfirm;
  readonly deletingUser = this.facade.deletingUser;
  readonly showPackageDialog = this.facade.showPackageDialog;
  readonly packageDialogData = this.facade.packageDialogData;
  readonly showVersionDialog = this.facade.showVersionDialog;
  readonly versionDialogData = this.facade.versionDialogData;
  readonly showDeletePackageConfirm = this.facade.showDeletePackageConfirm;
  readonly deletingPackageData = this.facade.deletingPackageData;
  readonly showDeleteVersionConfirm = this.facade.showDeleteVersionConfirm;
  readonly deletingVersionData = this.facade.deletingVersionData;
  readonly showDeleteProjectConfirm = this.facade.showDeleteProjectConfirm;
  readonly deletingProject = this.facade.deletingProject;

  // Tab references
  private readonly usersTab = viewChild(ProjectUsersTabComponent);
  private readonly samplesTab = viewChild(ProjectSamplesTabComponent);
  private readonly printTab = viewChild(ProjectPrintTabComponent);

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

    initTabFromFragment(this.activeTab, this.location, ['overview', 'users', 'samples', 'settings', 'print'] as const, 'overview');

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) {
      this.facade.loading.set(false);
      return;
    }
    this.facade.loadProject(id, this.mapToDetailData());
  }

  goBack(): void { this.facade.goBack(); }

  onStatusChange(event: { value: string; label: string; color: string }): void {
    this.facade.updateProjectStatus(event);
  }

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

  // === PERSONS MODAL ===

  async openPersonsModalDialog(typeFilter?: 'student' | 'teacher'): Promise<void> {
    const container = this.personsModalContainer();
    if (!container || !this.projectData()) return;

    container.clear();
    const { PersonsModalComponent } = await import(
      '../../../../features/partner/components/persons-modal/persons-modal/persons-modal.component'
    );
    const ref = container.createComponent(PersonsModalComponent);
    ref.setInput('projectId', this.projectData()!.id);
    ref.setInput('projectName', this.projectData()!.name);
    if (typeFilter) {
      ref.setInput('initialTypeFilter', typeFilter);
    }
    ref.instance.close.subscribe(() => {
      container.clear();
    });
    ref.instance.openUploadWizard.subscribe(() => {
      container.clear();
      this.openUploadWizardDialog();
    });
  }

  async openUploadWizardDialog(): Promise<void> {
    const container = this.uploadWizardContainer();
    if (!container || !this.projectData()) return;

    container.clear();
    const { PhotoUploadWizardComponent } = await import(
      '../../../../features/partner/components/photo-upload-wizard/photo-upload-wizard/photo-upload-wizard.component'
    );
    const ref = container.createComponent(PhotoUploadWizardComponent);
    ref.setInput('projectId', this.projectData()!.id);
    ref.instance.close.subscribe(() => {
      container.clear();
    });
    ref.instance.completed.subscribe(() => {
      container.clear();
      this.facade.loadProject(this.projectData()!.id, this.mapToDetailData());
    });
  }

  // === ORDER WIZARD ===

  async openOrderWizardDialog(): Promise<void> {
    const container = this.orderWizardContainer();
    if (!container || !this.projectData()) return;

    container.clear();
    const { PartnerOrderWizardDialogComponent } = await import(
      '../../../../features/partner/components/partner-order-wizard-dialog/partner-order-wizard-dialog.component'
    );
    const ref = container.createComponent(PartnerOrderWizardDialogComponent);
    ref.setInput('projectId', this.projectData()!.id);
    ref.setInput('projectName', this.projectData()!.name);
    ref.instance.close.subscribe(() => {
      container.clear();
    });
    ref.instance.saved.subscribe(() => {
      container.clear();
      this.facade.loadProject(this.projectData()!.id, this.mapToDetailData());
    });
  }

  // === PRINT TAB ===

  downloadPrintReadyFile(): void {
    const project = this.projectData();
    if (!project?.printReadyFile || !this.finalizationService) return;

    const fileName = project.printReadyFile.fileName;
    this.finalizationService.downloadPrintReady(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => saveFile(blob, fileName),
        error: () => this.toast.error('Hiba', 'Nem sikerült letölteni a fájlt.'),
      });
  }

  uploadPrintReadyFile(file: File): void {
    const project = this.projectData();
    if (!project || !this.finalizationService) return;

    const tab = this.printTab();
    tab?.uploading.set(true);
    tab?.uploadError.set(null);

    this.finalizationService.uploadPrintReady(project.id, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          tab?.uploading.set(false);
          this.toast.success('Siker', 'Nyomdakész fájl feltöltve.');
          this.facade.loadProject(project.id, this.mapToDetailData());
        },
        error: () => {
          tab?.uploading.set(false);
          tab?.uploadError.set('Hiba történt a feltöltés során.');
          this.toast.error('Hiba', 'Nem sikerült feltölteni a fájlt.');
        },
      });
  }

  // === GALLERY ===

  extendGalleryDeadline(days: number): void { this.facade.extendGalleryDeadline(days); }
  createGallery(): void { this.facade.createGallery(); }

  // === SELECTION DOWNLOAD ===

  readonly downloadingSelections = signal(false);

  async openSelectionDownloadDialog(): Promise<void> {
    const container = this.selectionDownloadContainer();
    if (!container || !this.projectData()?.tabloGalleryId) return;

    container.clear();
    const { SelectionDownloadDialogComponent } = await import(
      '../../../../features/partner/components/selection-download-dialog/selection-download-dialog.component'
    );
    const ref = container.createComponent(SelectionDownloadDialogComponent);
    ref.instance.close.subscribe(() => container.clear());
    ref.instance.download.subscribe((result: SelectionDownloadResult) => {
      container.clear();
      this.downloadSelections(result);
    });
  }

  private downloadSelections(result: SelectionDownloadResult): void {
    const projectId = this.projectData()?.id;
    if (!projectId || !this.galleryService) return;

    this.downloadingSelections.set(true);
    this.galleryService.downloadMonitoringZip(projectId, {
      zipContent: 'all',
      fileNaming: result.fileNaming,
      includeExcel: false,
      personType: result.personType === 'both' ? undefined : result.personType,
      effectiveOnly: true,
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob) => {
        const name = projectShortName(this.projectData()?.name ?? '', projectId);
        saveFile(blob, `${name}.zip`);
        this.downloadingSelections.set(false);
        this.toast.success('Siker', 'ZIP letöltve');
      },
      error: () => {
        this.downloadingSelections.set(false);
        this.toast.error('Hiba', 'A ZIP letöltés nem sikerült');
      },
    });
  }
}
