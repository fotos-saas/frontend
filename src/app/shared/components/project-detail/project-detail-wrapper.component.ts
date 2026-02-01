import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  input,
  ViewContainerRef,
  ComponentRef,
  Type,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectDetailViewComponent } from './project-detail-view.component';
import { ProjectDetailData, ProjectContact, QrCode } from './project-detail.types';
import {
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_QR_MODAL_COMPONENT,
  PROJECT_CONTACT_MODAL_COMPONENT,
  IProjectDetailService,
  ProjectDataMapper,
} from './project-detail.tokens';
import { ICONS } from '../../constants/icons.constants';

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
  imports: [CommonModule, LucideAngularModule, ProjectDetailViewComponent],
  template: `
    <div class="max-w-3xl mx-auto page-card">
      <!-- Közös detail view komponens -->
      <app-project-detail-view
        [project]="projectData()"
        [loading]="loading()"
        (back)="goBack()"
        (openQrModal)="openQrModal()"
        (openContactModal)="openContactModal($event)"
        (deleteContact)="confirmDeleteContact($event)"
      />
    </div>

    <!-- QR Code Modal container -->
    <ng-container #qrModalContainer></ng-container>

    <!-- Contact Editor Modal container -->
    <ng-container #contactModalContainer></ng-container>

    <!-- Delete Confirmation Modal -->
    @if (showDeleteConfirm()) {
      <div class="dialog-backdrop" (click)="cancelDelete()">
        <div class="dialog-panel max-w-sm p-5" (click)="$event.stopPropagation()">
          <div class="flex flex-col items-center text-center">
            <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <lucide-icon [name]="ICONS.DELETE" [size]="28" class="text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Kapcsolattartó törlése</h3>
            <p class="text-sm text-gray-600 mb-5">
              Biztosan törölni szeretnéd <strong>{{ deletingContact()?.name }}</strong> kapcsolattartót?
            </p>
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              (click)="cancelDelete()"
            >Mégse</button>
            <button
              class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              (click)="deleteContact()"
              [disabled]="deleting()"
            >{{ deleting() ? 'Törlés...' : 'Törlés' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailWrapperComponent<T> implements OnInit {
  /** Mapping függvény a feature-specifikus típusból ProjectDetailData-ra */
  mapToDetailData = input.required<ProjectDataMapper<T>>();

  // Injected dependencies
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(PROJECT_DETAIL_SERVICE);
  private backRoute = inject(PROJECT_BACK_ROUTE);
  private qrModalComponent = inject(PROJECT_QR_MODAL_COMPONENT);
  private contactModalComponent = inject(PROJECT_CONTACT_MODAL_COMPONENT);
  private destroyRef = inject(DestroyRef);

  // ViewChild references for dynamic component creation
  private qrModalContainer = viewChild('qrModalContainer', { read: ViewContainerRef });
  private contactModalContainer = viewChild('contactModalContainer', { read: ViewContainerRef });

  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;

  // State signals
  loading = signal(true);
  project = signal<T | null>(null);
  projectData = signal<ProjectDetailData | null>(null);

  // Modal states
  showQrModal = signal(false);
  showContactModal = signal(false);
  editingContact = signal<ProjectContact | null>(null);

  // Delete confirmation states
  showDeleteConfirm = signal(false);
  deletingContact = signal<ProjectContact | null>(null);
  deleting = signal(false);

  // Dynamic component references
  private qrModalRef: ComponentRef<any> | null = null;
  private contactModalRef: ComponentRef<any> | null = null;

  ngOnInit(): void {
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

  // QR Modal methods
  openQrModal(): void {
    const container = this.qrModalContainer();
    if (!container) return;

    const project = this.project();
    if (!project) return;

    container.clear();
    this.qrModalRef = container.createComponent(this.qrModalComponent);

    // Set inputs
    const projectData = this.projectData();
    this.qrModalRef.instance.projectId = projectData?.id;
    this.qrModalRef.instance.projectName = projectData?.name ?? '';

    // Subscribe to outputs
    this.qrModalRef.instance.close?.subscribe(() => this.closeQrModal());
    this.qrModalRef.instance.qrCodeChanged?.subscribe((qr: QrCode | null) => this.onQrCodeChanged(qr));

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
}
