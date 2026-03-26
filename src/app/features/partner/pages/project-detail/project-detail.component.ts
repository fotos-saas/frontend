import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ProjectDetailWrapperComponent,
  ProjectDetailData,
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_CONTACT_MODAL_COMPONENT,
  PROJECT_EDIT_MODAL_COMPONENT,
  PROJECT_WIZARD_EDIT_MODAL_COMPONENT,
  PROJECT_ORDER_DATA_DIALOG_COMPONENT,
} from '../../../../shared/components/project-detail';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { ContactEditorModalComponent } from '@shared/components/contact-editor-modal/contact-editor-modal.component';
import { ProjectEditModalComponent } from '../../components/project-edit-modal/project-edit-modal.component';
import { CreateProjectWizardDialogComponent } from '../../components/create-project-wizard-dialog/create-project-wizard-dialog.component';
import { OrderDataDialogComponent } from '../../components/order-data-dialog/order-data-dialog.component';

/**
 * Partner Project Detail - Smart wrapper komponens.
 * Service inject és modal kezelés a közös wrapper-ben.
 * QR Modal: SharedQrCodeModalComponent (automatikusan a wrapper-ben)
 */
@Component({
  selector: 'app-partner-project-detail',
  standalone: true,
  imports: [ProjectDetailWrapperComponent],
  providers: [
    { provide: PROJECT_DETAIL_SERVICE, useExisting: PartnerService },
    { provide: PROJECT_BACK_ROUTE, useValue: '/partner/projects' },
    { provide: PROJECT_CONTACT_MODAL_COMPONENT, useValue: ContactEditorModalComponent },
    { provide: PROJECT_EDIT_MODAL_COMPONENT, useValue: ProjectEditModalComponent },
    { provide: PROJECT_WIZARD_EDIT_MODAL_COMPONENT, useValue: CreateProjectWizardDialogComponent },
    { provide: PROJECT_ORDER_DATA_DIALOG_COMPONENT, useValue: OrderDataDialogComponent },
  ],
  template: `<app-project-detail-wrapper [mapToDetailData]="mapProject" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerProjectDetailComponent {
  /** Átalakítja a Partner ProjectDetails-t a közös típusra */
  mapProject = (project: PartnerProjectDetails): ProjectDetailData => ({
    id: project.id,
    name: project.name,
    school: project.school,
    partner: project.partner,
    className: project.className,
    classYear: project.classYear,
    status: project.status,
    statusLabel: project.statusLabel,
    statusColor: project.statusColor,
    tabloStatus: project.tabloStatus,
    photoDate: project.photoDate,
    deadline: project.deadline,
    expectedClassSize: project.expectedClassSize,
    finalizedAt: project.finalizedAt,
    orderSubmittedAt: project.orderSubmittedAt,
    draftPhotoCount: project.draftPhotoCount,
    isPreliminary: project.isPreliminary,
    pendingStudentPhotos: project.pendingStudentPhotos,
    pendingTeacherPhotos: project.pendingTeacherPhotos,
    contact: project.contact,
    contacts: project.contacts ?? [],
    qrCode: project.qrCode,
    activeQrCodes: project.activeQrCodes ?? [],
    qrCodesHistory: project.qrCodesHistory ?? [],
    tabloGalleryId: project.tabloGalleryId,
    galleryPhotosCount: project.galleryPhotosCount,
    personsCount: project.personsCount,
    studentsCount: project.studentsCount,
    teachersCount: project.teachersCount,
    studentsWithPhotoCount: project.studentsWithPhotoCount,
    teachersWithPhotoCount: project.teachersWithPhotoCount,
    personsPreview: project.personsPreview,
    extraNames: project.extraNames,
    inPrintAt: project.inPrintAt,
    doneAt: project.doneAt,
    printSmallTablo: project.printSmallTablo,
    printFlat: project.printFlat,
    printCopies: project.printCopies,
    printDeadline: project.printDeadline,
    printDeadlineStatus: project.printDeadlineStatus,
    printDeadlineProposed: project.printDeadlineProposed,
    printDeadlineReason: project.printDeadlineReason,
    isUrgent: project.isUrgent,
    isReprint: project.isReprint,
    reprintCount: project.reprintCount,
    tags: project.tags ?? [],
    pendingTaskCount: project.pendingTaskCount,
    printMessagesCount: project.printMessagesCount,
    unreadPrintMessagesCount: project.unreadPrintMessagesCount,
    hasPrintError: project.hasPrintError,
    printErrorMessage: project.printErrorMessage,
    printErrorAcknowledgedAt: project.printErrorAcknowledgedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
