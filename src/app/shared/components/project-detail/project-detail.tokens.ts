import { InjectionToken, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectContact, ProjectDetailData, QrCode } from './project-detail.types';

/** Közös API válasz típus sikeres műveletekhez */
export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Interface a projekt detail service-ekhez.
 * Marketer és Partner service-ek egyaránt implementálják.
 *
 * A getProjectDetails return type-ja szándékosan `unknown`, mert
 * a Marketer (ProjectDetails) és Partner (PartnerProjectDetails)
 * eltérő típust ad vissza - a wrapper generikus mapFn-nel kezeli.
 */
export interface IProjectDetailService {
  getProjectDetails(id: number): Observable<unknown>;
  deleteContact(projectId: number, contactId: number): Observable<ApiSuccessResponse>;
  deleteProject(projectId: number): Observable<ApiSuccessResponse>;
  getProjectQrCode(projectId: number): Observable<{ hasQrCode: boolean; qrCode?: QrCode }>;
  generateQrCode(projectId: number): Observable<{ qrCode: QrCode }>;
  deactivateQrCode(projectId: number): Observable<ApiSuccessResponse>;
  addContact(projectId: number, data: Partial<ProjectContact>): Observable<{ data: ProjectContact }>;
  updateContact(projectId: number, contactId: number, data: Partial<ProjectContact>): Observable<{ data: ProjectContact }>;
}

/**
 * InjectionToken a projekt detail service-hez.
 * Provider-ben használd: { provide: PROJECT_DETAIL_SERVICE, useExisting: MarketerService }
 */
export const PROJECT_DETAIL_SERVICE = new InjectionToken<IProjectDetailService>('ProjectDetailService');

/**
 * InjectionToken a vissza navigáció útvonalhoz.
 * Provider-ben használd: { provide: PROJECT_BACK_ROUTE, useValue: '/marketer/projects' }
 */
export const PROJECT_BACK_ROUTE = new InjectionToken<string>('ProjectBackRoute');

/**
 * InjectionToken a QR Code Modal komponenshez.
 * Mivel a QR modal is feature-specifikus (marketer vs partner), ezt is inject-elni kell.
 */
export const PROJECT_QR_MODAL_COMPONENT = new InjectionToken<Type<any>>('ProjectQrModalComponent');

/**
 * InjectionToken a Contact Editor Modal komponenshez.
 * Mivel a contact editor is feature-specifikus, ezt is inject-elni kell.
 */
export const PROJECT_CONTACT_MODAL_COMPONENT = new InjectionToken<Type<any>>('ProjectContactModalComponent');

/**
 * InjectionToken a Project Edit Modal komponenshez.
 * Projekt szerkesztés modal (iskola, osztály, évfolyam, dátumok).
 */
export const PROJECT_EDIT_MODAL_COMPONENT = new InjectionToken<Type<any>>('ProjectEditModalComponent');

/**
 * InjectionToken az Order Data Dialog komponenshez.
 * Opcionális - csak a partner felület adja meg.
 */
export const PROJECT_ORDER_DATA_DIALOG_COMPONENT = new InjectionToken<Type<any>>('ProjectOrderDataDialogComponent');

/**
 * Projekt adat mapping függvény típusa.
 * Feature-specifikus mapping a közös ProjectDetailData típusra.
 */
export type ProjectDataMapper<T> = (project: T) => ProjectDetailData;
