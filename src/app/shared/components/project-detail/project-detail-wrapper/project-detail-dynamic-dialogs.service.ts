import { Injectable, ViewContainerRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerGalleryService } from '../../../../features/partner/services/partner-gallery.service';
import { SelectionDownloadResult } from '../../../../features/partner/components/selection-download-dialog/selection-download-dialog.component';
import { saveFile } from '../../../utils/file.util';
import { projectShortName } from '../../../utils/string.util';
import { ProjectDetailData } from '../project-detail.types';
import { ProjectDataMapper } from '../project-detail.tokens';

/**
 * Dinamikus (lazy-loaded) dialogusok kezelese a project detail wrapper szamara.
 * Persons modal, Upload wizard, Order wizard, Selection download.
 *
 * Nem providedIn: 'root' - komponens szintu scope.
 */
@Injectable()
export class ProjectDetailDynamicDialogsService<T> {
  private destroyRef!: DestroyRef;
  private toast!: ToastService;
  private galleryService: PartnerGalleryService | null = null;
  private getProjectData!: () => ProjectDetailData | null;
  private reloadProject!: () => void;

  /** Persons modal ref a reload-hoz */
  private personsModalRef: { instance: { loadPersons: (silent?: boolean) => void } } | null = null;

  readonly downloadingSelections = signal(false);

  init(deps: {
    destroyRef: DestroyRef;
    toast: ToastService;
    galleryService: PartnerGalleryService | null;
    getProjectData: () => ProjectDetailData | null;
    reloadProject: () => void;
  }): void {
    this.destroyRef = deps.destroyRef;
    this.toast = deps.toast;
    this.galleryService = deps.galleryService;
    this.getProjectData = deps.getProjectData;
    this.reloadProject = deps.reloadProject;
  }

  // === PERSONS MODAL ===

  async openPersonsModal(
    container: ViewContainerRef,
    typeFilter?: 'student' | 'teacher',
    openUploadWizardFn?: (album: 'students' | 'teachers') => void,
    openAddPersonsFn?: (type: 'student' | 'teacher') => void,
    expandedViewFn?: (data: { projectId: number }) => void,
  ): Promise<void> {
    const projectData = this.getProjectData();
    if (!projectData) return;

    container.clear();
    const { PersonsModalComponent } = await import(
      '../../../../features/partner/components/persons-modal/persons-modal/persons-modal.component'
    );
    const ref = container.createComponent(PersonsModalComponent);
    ref.setInput('projectId', projectData.id);
    ref.setInput('projectName', projectData.name);
    ref.setInput('schoolName', projectData.school?.name ?? null);
    ref.setInput('className', projectData.className ?? null);
    if (typeFilter) {
      ref.setInput('initialTypeFilter', typeFilter);
    }
    this.personsModalRef = ref;
    ref.instance.close.subscribe(() => {
      container.clear();
      this.personsModalRef = null;
      this.reloadProject();
    });
    ref.instance.openUploadWizard.subscribe((personType: string) => {
      container.clear();
      this.personsModalRef = null;
      openUploadWizardFn?.(personType === 'student' ? 'students' : 'teachers');
    });
    ref.instance.addPersonsRequested.subscribe((type: 'student' | 'teacher') => {
      openAddPersonsFn?.(type);
    });
    ref.instance.expandedViewRequested.subscribe((data: { projectId: number }) => {
      container.clear();
      this.personsModalRef = null;
      expandedViewFn?.(data);
    });
  }

  // === ADD PERSONS DIALOG ===

  async openAddPersonsDialog(container: ViewContainerRef, type: 'student' | 'teacher'): Promise<void> {
    const projectData = this.getProjectData();
    if (!projectData) return;

    container.clear();
    const { AddPersonsDialogComponent } = await import(
      '../../../../features/partner/components/add-persons-dialog/add-persons-dialog.component'
    );
    const ref = container.createComponent(AddPersonsDialogComponent);
    ref.setInput('projectId', projectData.id);
    ref.setInput('type', type);
    ref.instance.close.subscribe(() => container.clear());
    ref.instance.personsAdded.subscribe(() => {
      this.reloadProject();
      this.personsModalRef?.instance.loadPersons(true);
    });
  }

  // === UPLOAD WIZARD ===

  async openUploadWizard(container: ViewContainerRef, initialAlbum?: 'students' | 'teachers'): Promise<void> {
    const projectData = this.getProjectData();
    if (!projectData) return;

    container.clear();
    const { PhotoUploadWizardComponent } = await import(
      '../../../../features/partner/components/photo-upload-wizard/photo-upload-wizard/photo-upload-wizard.component'
    );
    const ref = container.createComponent(PhotoUploadWizardComponent);
    ref.setInput('projectId', projectData.id);
    if (initialAlbum) {
      ref.setInput('initialAlbum', initialAlbum);
    }
    if (projectData.isPreliminary) {
      ref.setInput('isPreliminary', true);
    }
    ref.instance.close.subscribe(() => container.clear());
    ref.instance.completed.subscribe(() => {
      container.clear();
      this.reloadProject();
    });
  }

  // === ORDER WIZARD ===

  async openOrderWizard(container: ViewContainerRef): Promise<void> {
    const projectData = this.getProjectData();
    if (!projectData) return;

    container.clear();
    const { PartnerOrderWizardDialogComponent } = await import(
      '../../../../features/partner/components/partner-order-wizard-dialog/partner-order-wizard-dialog.component'
    );
    const ref = container.createComponent(PartnerOrderWizardDialogComponent);
    ref.setInput('projectId', projectData.id);
    ref.setInput('projectName', projectData.name);
    ref.instance.close.subscribe(() => container.clear());
    ref.instance.saved.subscribe(() => {
      container.clear();
      this.reloadProject();
    });
  }

  // === SELECTION DOWNLOAD ===

  async openSelectionDownloadDialog(container: ViewContainerRef): Promise<void> {
    const projectData = this.getProjectData();
    if (!container || !projectData?.tabloGalleryId) return;

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
    const projectData = this.getProjectData();
    if (!projectData?.id || !this.galleryService) return;

    this.downloadingSelections.set(true);
    this.galleryService.downloadMonitoringZip(projectData.id, {
      zipContent: 'all',
      fileNaming: result.fileNaming,
      includeExcel: false,
      personType: result.personType === 'both' ? undefined : result.personType,
      effectiveOnly: true,
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob) => {
        const name = projectShortName(projectData.name ?? '', projectData.id);
        saveFile(blob, `${name}.zip`);
        this.downloadingSelections.set(false);
        this.toast.success('Siker', 'ZIP letoltve');
      },
      error: () => {
        this.downloadingSelections.set(false);
        this.toast.error('Hiba', 'A ZIP letoltes nem sikerult');
      },
    });
  }
}
