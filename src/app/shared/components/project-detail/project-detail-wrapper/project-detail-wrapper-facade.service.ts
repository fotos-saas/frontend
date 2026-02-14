import {
  Injectable,
  signal,
  ViewContainerRef,
  ComponentRef,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { SharedQrCodeModalComponent } from '../../qr-code-modal/qr-code-modal.component';
import { ConfirmDialogResult } from '../../confirm-dialog/confirm-dialog.component';
import { ProjectDetailData, ProjectContact, QrCode } from '../project-detail.types';
import {
  IProjectDetailService,
  ProjectDataMapper,
} from '../project-detail.tokens';
import { IQrCodeService } from '../../../interfaces/qr-code.interface';
import { GuestSession, SamplePackage } from '../../../../features/partner/services/partner.service';
import {
  PackageDialogRequest,
  VersionDialogRequest,
  DeleteVersionRequest,
} from '../project-samples-tab/project-samples-tab.component';

/**
 * Project Detail Wrapper Facade Service
 *
 * A modal kezelest, API hivasokat es allapot-muveleket kezeli
 * a project-detail-wrapper komponens szamara.
 *
 * Nem providedIn: 'root' - komponens szintu scope szukseges,
 * mert a tokenek (PROJECT_DETAIL_SERVICE, stb.) injector-specifikusak.
 */
@Injectable()
export class ProjectDetailWrapperFacadeService<T> {
  private projectService!: IProjectDetailService;
  private backRoute!: string;
  private contactModalComponent!: any;
  private projectEditModalComponent: any | null = null;
  private orderDataDialogComponent: any | null = null;
  private partnerService: PartnerService | null = null;
  private destroyRef!: DestroyRef;
  private router!: Router;
  private toast!: ToastService;

  // Dynamic component refs
  private qrModalRef: ComponentRef<any> | null = null;
  private contactModalRef: ComponentRef<any> | null = null;
  private projectEditModalRef: ComponentRef<any> | null = null;
  private orderDataDialogRef: ComponentRef<any> | null = null;

  // State signals
  readonly loading = signal(true);
  readonly project = signal<T | null>(null);
  readonly projectData = signal<ProjectDetailData | null>(null);

  // Modal states
  readonly showQrModal = signal(false);
  readonly showContactModal = signal(false);
  readonly editingContact = signal<ProjectContact | null>(null);

  // Delete contact confirmation
  readonly showDeleteConfirm = signal(false);
  readonly deletingContact = signal<ProjectContact | null>(null);
  readonly deleting = signal(false);

  // Delete user confirmation
  readonly showDeleteUserConfirm = signal(false);
  readonly deletingUser = signal<GuestSession | null>(null);

  // Samples dialogs
  readonly showPackageDialog = signal(false);
  readonly packageDialogData = signal<PackageDialogRequest | null>(null);
  readonly showVersionDialog = signal(false);
  readonly versionDialogData = signal<VersionDialogRequest | null>(null);
  readonly showDeletePackageConfirm = signal(false);
  readonly deletingPackageData = signal<SamplePackage | null>(null);
  readonly showDeleteVersionConfirm = signal(false);
  readonly deletingVersionData = signal<DeleteVersionRequest | null>(null);

  // Delete project confirmation
  readonly showDeleteProjectConfirm = signal(false);
  readonly deletingProject = signal(false);

  /**
   * Inicializalas - a komponens biztositja a fuggosegeket
   */
  init(deps: {
    projectService: IProjectDetailService;
    backRoute: string;
    contactModalComponent: any;
    projectEditModalComponent: any | null;
    orderDataDialogComponent: any | null;
    partnerService: PartnerService | null;
    destroyRef: DestroyRef;
    router: Router;
    toast: ToastService;
  }): void {
    this.projectService = deps.projectService;
    this.backRoute = deps.backRoute;
    this.contactModalComponent = deps.contactModalComponent;
    this.projectEditModalComponent = deps.projectEditModalComponent;
    this.orderDataDialogComponent = deps.orderDataDialogComponent;
    this.partnerService = deps.partnerService;
    this.destroyRef = deps.destroyRef;
    this.router = deps.router;
    this.toast = deps.toast;
  }

  // === PROJECT LOADING ===

  loadProject(id: number, mapFn: ProjectDataMapper<T>): void {
    this.projectService.getProjectDetails(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (raw: unknown) => {
        const project = raw as T;
        this.project.set(project);
        this.projectData.set(mapFn(project));
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

  // === QR MODAL ===

  openQrModal(container: ViewContainerRef): void {
    const projectData = this.projectData();
    if (!projectData) return;

    container.clear();
    this.qrModalRef = container.createComponent(SharedQrCodeModalComponent);
    this.qrModalRef.setInput('projectId', projectData.id);
    this.qrModalRef.setInput('projectName', projectData.name ?? '');
    this.qrModalRef.setInput('qrService', this.projectService as unknown as IQrCodeService);

    (this.qrModalRef.instance as any).close.subscribe(() => this.closeQrModal());
    (this.qrModalRef.instance as any).qrCodeChanged.subscribe((qr: QrCode | null) => {
      const id = this.projectData()?.id;
      if (id) this.loadProject(id, this.currentMapFn!);
    });

    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.qrModalRef?.destroy();
    this.qrModalRef = null;
    this.showQrModal.set(false);
  }

  // === CONTACT MODAL ===

  openContactModal(container: ViewContainerRef, contact: ProjectContact | null): void {
    const projectData = this.projectData();
    if (!projectData) return;

    container.clear();
    this.contactModalRef = container.createComponent(this.contactModalComponent);
    this.contactModalRef.setInput('projectId', projectData.id);
    this.contactModalRef.setInput('contact', contact);
    (this.contactModalRef.instance as any).close?.subscribe(() => this.closeContactModal());
    (this.contactModalRef.instance as any).saved?.subscribe((c: ProjectContact) => {
      this.closeContactModal();
      const id = this.projectData()?.id;
      if (id) this.loadProject(id, this.currentMapFn!);
    });

    this.editingContact.set(contact);
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.contactModalRef?.destroy();
    this.contactModalRef = null;
    this.showContactModal.set(false);
    this.editingContact.set(null);
  }

  // === PROJECT EDIT MODAL ===

  openEditProjectModal(container: ViewContainerRef): void {
    if (!this.projectEditModalComponent) return;
    const projectData = this.projectData();
    if (!projectData) return;

    container.clear();
    this.projectEditModalRef = container.createComponent(this.projectEditModalComponent);
    this.projectEditModalRef.setInput('project', projectData);
    (this.projectEditModalRef.instance as any).close?.subscribe(() => this.closeEditProjectModal());
    (this.projectEditModalRef.instance as any).saved?.subscribe(() => {
      this.closeEditProjectModal();
      const id = this.projectData()?.id;
      if (id) this.loadProject(id, this.currentMapFn!);
    });
  }

  closeEditProjectModal(): void {
    this.projectEditModalRef?.destroy();
    this.projectEditModalRef = null;
  }

  // === ORDER DATA DIALOG ===

  openOrderDataDialog(container: ViewContainerRef): void {
    if (!this.orderDataDialogComponent) return;
    const projectData = this.projectData();
    if (!projectData?.id) return;

    container.clear();
    this.orderDataDialogRef = container.createComponent(this.orderDataDialogComponent);
    this.orderDataDialogRef.setInput('projectId', projectData.id);
    (this.orderDataDialogRef.instance as any).close?.subscribe(() => this.closeOrderDataDialog());
  }

  closeOrderDataDialog(): void {
    this.orderDataDialogRef?.destroy();
    this.orderDataDialogRef = null;
  }

  // === DELETE CONTACT ===

  confirmDeleteContact(contact: ProjectContact): void {
    this.deletingContact.set(contact);
    this.showDeleteConfirm.set(true);
  }

  onDeleteContactResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.executeDeleteContact();
    } else {
      this.cancelDelete();
    }
  }

  private cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingContact.set(null);
  }

  private executeDeleteContact(): void {
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
        this.loadProject(projectId, this.currentMapFn!);
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  // === DELETE PROJECT ===

  confirmDeleteProject(): void {
    this.showDeleteProjectConfirm.set(true);
  }

  onDeleteProjectResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.executeDeleteProject();
    } else {
      this.showDeleteProjectConfirm.set(false);
    }
  }

  private executeDeleteProject(): void {
    const projectId = this.projectData()?.id;
    if (!projectId) return;

    this.deletingProject.set(true);
    this.projectService.deleteProject(projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deletingProject.set(false);
        this.showDeleteProjectConfirm.set(false);
        this.goBack();
      },
      error: () => {
        this.deletingProject.set(false);
      },
    });
  }

  // === DELETE USER ===

  confirmDeleteUser(session: GuestSession): void {
    this.deletingUser.set(session);
    this.showDeleteUserConfirm.set(true);
  }

  onDeleteUserResult(result: ConfirmDialogResult, executeDeleteFn: (session: GuestSession) => void): void {
    if (result.action === 'confirm') {
      const session = this.deletingUser();
      if (session) {
        executeDeleteFn(session);
      }
    }
    this.showDeleteUserConfirm.set(false);
    this.deletingUser.set(null);
  }

  // === SAMPLES DIALOG ===

  openPackageDialog(request: PackageDialogRequest): void {
    this.packageDialogData.set(request);
    this.showPackageDialog.set(true);
  }

  closePackageDialog(): void {
    this.showPackageDialog.set(false);
    this.packageDialogData.set(null);
  }

  openVersionDialog(request: VersionDialogRequest): void {
    this.versionDialogData.set(request);
    this.showVersionDialog.set(true);
  }

  closeVersionDialog(): void {
    this.showVersionDialog.set(false);
    this.versionDialogData.set(null);
  }

  confirmDeletePackage(pkg: SamplePackage): void {
    this.deletingPackageData.set(pkg);
    this.showDeletePackageConfirm.set(true);
  }

  onDeletePackageResult(result: ConfirmDialogResult, executeDeleteFn: (pkg: SamplePackage) => void): void {
    if (result.action === 'confirm') {
      const pkg = this.deletingPackageData();
      if (pkg) executeDeleteFn(pkg);
    }
    this.showDeletePackageConfirm.set(false);
    this.deletingPackageData.set(null);
  }

  confirmDeleteVersion(request: DeleteVersionRequest): void {
    this.deletingVersionData.set(request);
    this.showDeleteVersionConfirm.set(true);
  }

  onDeleteVersionResult(result: ConfirmDialogResult, executeDeleteFn: (packageId: number, versionId: number) => void): void {
    if (result.action === 'confirm') {
      const data = this.deletingVersionData();
      if (data) executeDeleteFn(data.packageId, data.version.id);
    }
    this.showDeleteVersionConfirm.set(false);
    this.deletingVersionData.set(null);
  }

  // === GALLERY ===

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
        this.toast.success('Siker', 'Hatarido beallitva');
        const current = this.projectData();
        if (current) {
          this.projectData.set({ ...current, deadline: response.data.deadline });
        }
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerult beallitani a hataridot');
      },
    });
  }

  createGallery(): void {
    const projectId = this.projectData()?.id;
    if (!projectId || !this.partnerService) return;

    this.partnerService.createGallery(projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Siker', 'Galeria letrehozva');
        this.router.navigate(['/partner/projects', projectId, 'gallery']);
      },
      error: () => {
        this.toast.error('Hiba', 'Nem sikerult a galeria letrehozasa');
      },
    });
  }

  // === INTERNAL ===

  /** A jelenlegi map fuggveny tarolasa reload-hoz */
  currentMapFn: ProjectDataMapper<T> | null = null;

  setMapFn(fn: ProjectDataMapper<T>): void {
    this.currentMapFn = fn;
  }
}
