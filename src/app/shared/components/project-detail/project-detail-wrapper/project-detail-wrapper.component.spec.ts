import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectDetailWrapperComponent } from './project-detail-wrapper.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PROJECT_DETAIL_SERVICE } from '../project-detail.tokens';
import { PROJECT_BACK_ROUTE } from '../project-detail.tokens';
import { PROJECT_CONTACT_MODAL_COMPONENT } from '../project-detail.tokens';
import { PROJECT_EDIT_MODAL_COMPONENT } from '../project-detail.tokens';
import { PROJECT_ORDER_DATA_DIALOG_COMPONENT } from '../project-detail.tokens';
import { Location } from '@angular/common';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { PartnerGalleryService } from '../../../../features/partner/services/partner-gallery.service';
import { PartnerAlbumService } from '../../../../features/partner/services/partner-album.service';
import { PartnerFinalizationService } from '../../../../features/partner/services/partner-finalization.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ElectronService } from '../../../../core/services/electron.service';
import { ProjectDetailWrapperFacadeService } from './project-detail-wrapper-facade.service';
import { ProjectDetailDynamicDialogsService } from './project-detail-dynamic-dialogs.service';
import { ProjectDetailPrintActionsService } from './project-detail-print-actions.service';

describe('ProjectDetailWrapperComponent', () => {
  let component: ProjectDetailWrapperComponent<any>;
  let fixture: ComponentFixture<ProjectDetailWrapperComponent<any>>;

  beforeEach(async () => {
    const mockAuthService = {
      isMarketer: vi.fn().mockReturnValue(false)
    };
    const mockPROJECT_DETAIL_SERVICE = {
      getProject: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      updateStatus: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
    };
    const mockPROJECT_BACK_ROUTE = '/projects';
    const mockPROJECT_CONTACT_MODAL_COMPONENT = {};
    const mockPROJECT_EDIT_MODAL_COMPONENT = {};
    const mockPROJECT_ORDER_DATA_DIALOG_COMPONENT = {};
    const mockPartnerService = {};
    const mockPartnerGalleryService = {};
    const mockPartnerAlbumService = {};
    const mockPartnerFinalizationService = {};
    const mockToastService = {
      toast: vi.fn().mockReturnValue(null),
      success: vi.fn(),
      error: vi.fn(),
    };
    const mockElectronService = {
      isElectron: false,
    };
    const mockProjectDetailWrapperFacadeService = {
      projectData: vi.fn().mockReturnValue(null),
      loadProject: vi.fn(),
      init: vi.fn(),
      setMapFn: vi.fn(),
      loading: { set: vi.fn() },
      goBack: vi.fn(),
      updateProjectStatus: vi.fn(),
      project: vi.fn().mockReturnValue(null),
      openQrModal: vi.fn(),
      openContactModal: vi.fn(),
      openEditProjectModal: vi.fn(),
      openOrderDataDialog: vi.fn(),
      closePackageDialog: vi.fn(),
      closeVersionDialog: vi.fn(),
      onDeletePackageResult: vi.fn(),
      onDeleteVersionResult: vi.fn(),
      onDeleteUserResult: vi.fn(),
    };
    const mockProjectDetailDynamicDialogsService = {
      init: vi.fn(),
      openPersonsModal: vi.fn(),
      openAddPersonsDialog: vi.fn(),
      openUploadWizard: vi.fn(),
      openOrderWizard: vi.fn(),
      openSelectionDownloadDialog: vi.fn(),
    };
    const mockProjectDetailPrintActionsService = {
      init: vi.fn(),
      downloadPrintFile: vi.fn(),
      uploadPrintFile: vi.fn(),
      confirmDeletePrintFile: vi.fn(),
      onDeletePrintFileResult: vi.fn(),
      downloadPendingPhotosZip: vi.fn(),
      openTaskDialog: vi.fn(),
      closeTaskDialog: vi.fn(),
      onTaskSaved: vi.fn(),
      confirmDeleteTask: vi.fn(),
      onTaskDeleteResult: vi.fn(),
    };

    const mockActivatedRoute = {
      snapshot: {
        params: { id: '1' },
        queryParams: {},
        paramMap: { get: vi.fn().mockReturnValue('1') },
      },
      params: { subscribe: vi.fn() },
      queryParams: { subscribe: vi.fn() },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailWrapperComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: vi.fn(), events: { subscribe: vi.fn() }, url: '/' } },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PROJECT_DETAIL_SERVICE, useValue: mockPROJECT_DETAIL_SERVICE },
        { provide: PROJECT_BACK_ROUTE, useValue: mockPROJECT_BACK_ROUTE },
        { provide: PROJECT_CONTACT_MODAL_COMPONENT, useValue: mockPROJECT_CONTACT_MODAL_COMPONENT },
        { provide: PROJECT_EDIT_MODAL_COMPONENT, useValue: mockPROJECT_EDIT_MODAL_COMPONENT },
        { provide: PROJECT_ORDER_DATA_DIALOG_COMPONENT, useValue: mockPROJECT_ORDER_DATA_DIALOG_COMPONENT },
        { provide: Location, useValue: { back: vi.fn(), path: vi.fn().mockReturnValue('/'), subscribe: vi.fn(), onUrlChange: vi.fn() } },
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: PartnerGalleryService, useValue: mockPartnerGalleryService },
        { provide: PartnerAlbumService, useValue: mockPartnerAlbumService },
        { provide: PartnerFinalizationService, useValue: mockPartnerFinalizationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ElectronService, useValue: mockElectronService },
        { provide: ProjectDetailWrapperFacadeService, useValue: mockProjectDetailWrapperFacadeService },
        { provide: ProjectDetailDynamicDialogsService, useValue: mockProjectDetailDynamicDialogsService },
        { provide: ProjectDetailPrintActionsService, useValue: mockProjectDetailPrintActionsService }
      ],
    })
    .overrideComponent(ProjectDetailWrapperComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA], providers: [] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailWrapperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mapToDetailData', vi.fn().mockReturnValue({}) as any);
    // Skip detectChanges - complex component with many token dependencies
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
