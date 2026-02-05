import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ProjectDetailWrapperComponent,
  ProjectDetailData,
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_CONTACT_MODAL_COMPONENT,
  PROJECT_EDIT_MODAL_COMPONENT,
  PROJECT_ORDER_DATA_DIALOG_COMPONENT,
} from '../../../../shared/components/project-detail';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { ContactEditorModalComponent } from '../../components/contact-editor-modal/contact-editor-modal.component';
import { ProjectEditModalComponent } from '../../components/project-edit-modal/project-edit-modal.component';
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
    draftPhotoCount: project.draftPhotoCount,
    contact: project.contact,
    contacts: project.contacts ?? [],
    qrCode: project.qrCode,
    qrCodesHistory: project.qrCodesHistory ?? [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
