import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  ProjectDetailWrapperComponent,
  ProjectDetailData,
  PROJECT_DETAIL_SERVICE,
  PROJECT_BACK_ROUTE,
  PROJECT_QR_MODAL_COMPONENT,
  PROJECT_CONTACT_MODAL_COMPONENT,
} from '../../../shared/components/project-detail';
import { MarketerService, ProjectDetails } from '../services/marketer.service';
import { QrCodeModalComponent } from '../components/qr-code-modal.component';
import { ContactEditorModalComponent } from '../components/contact-editor-modal.component';

/**
 * Marketer Project Detail - Smart wrapper komponens.
 * Service inject és modal kezelés a közös wrapper-ben.
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [ProjectDetailWrapperComponent],
  providers: [
    { provide: PROJECT_DETAIL_SERVICE, useExisting: MarketerService },
    { provide: PROJECT_BACK_ROUTE, useValue: '/marketer/projects' },
    { provide: PROJECT_QR_MODAL_COMPONENT, useValue: QrCodeModalComponent },
    { provide: PROJECT_CONTACT_MODAL_COMPONENT, useValue: ContactEditorModalComponent },
  ],
  template: `<app-project-detail-wrapper [mapToDetailData]="mapProject" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  /** Átalakítja a Marketer ProjectDetails-t a közös típusra */
  mapProject = (project: ProjectDetails): ProjectDetailData => ({
    id: project.id,
    name: project.name,
    school: project.school,
    partner: project.partner,
    className: project.className,
    classYear: project.classYear,
    status: project.status,
    statusLabel: project.statusLabel,
    tabloStatus: project.tabloStatus,
    photoDate: project.photoDate,
    deadline: project.deadline,
    expectedClassSize: project.expectedClassSize,
    contact: project.contact,
    contacts: project.contacts ?? [],
    qrCode: project.qrCode,
    qrCodesHistory: project.qrCodesHistory ?? [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
