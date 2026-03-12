import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef, ViewContainerRef, Type } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectDetailWrapperFacadeService } from './project-detail-wrapper-facade.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { IProjectDetailService } from '../project-detail.tokens';
import { ProjectDetailData } from '../project-detail.types';

describe('ProjectDetailWrapperFacadeService', () => {
  let service: ProjectDetailWrapperFacadeService<unknown>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let projectService: {
    getProjectDetails: ReturnType<typeof vi.fn>;
    deleteContact: ReturnType<typeof vi.fn>;
    deleteProject: ReturnType<typeof vi.fn>;
  };
  let partnerService: {
    getGlobalSettings: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    setGalleryDeadline: ReturnType<typeof vi.fn>;
    createGallery: ReturnType<typeof vi.fn>;
  };

  const mockProjectData: ProjectDetailData = {
    id: 42,
    name: 'Test Projekt',
    school: { id: 1, name: 'Teszt Iskola', city: 'Budapest' },
    partner: null,
    className: '12.A',
    classYear: '2026',
    status: 'active',
    statusLabel: 'Aktiv',
    statusColor: 'green',
    tabloStatus: null,
    photoDate: null,
    deadline: '2026-06-01',
    expectedClassSize: 30,
    contact: null,
    contacts: [{ id: 1, name: 'Teszt', email: 'test@test.com', phone: null }],
    qrCode: null,
    activeQrCodes: [],
    qrCodesHistory: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  class MockContactModal {}
  class MockEditModal {}

  const mapFn = (raw: unknown) => mockProjectData;

  beforeEach(() => {
    toast = { success: vi.fn(), error: vi.fn() };
    router = { navigate: vi.fn() };
    projectService = {
      getProjectDetails: vi.fn(),
      deleteContact: vi.fn(),
      deleteProject: vi.fn(),
    };
    partnerService = {
      getGlobalSettings: vi.fn().mockReturnValue(of({ data: { project_creation_mode: 'form' } })),
      updateProject: vi.fn(),
      setGalleryDeadline: vi.fn(),
      createGallery: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ProjectDetailWrapperFacadeService],
    });
    service = TestBed.inject(ProjectDetailWrapperFacadeService);
    service.init({
      projectService: projectService as unknown as IProjectDetailService,
      backRoute: '/partner/projects',
      contactModalComponent: MockContactModal as Type<unknown>,
      projectEditModalComponent: MockEditModal as Type<unknown>,
      wizardEditModalComponent: null,
      orderDataDialogComponent: null,
      partnerService: partnerService as unknown as PartnerService,
      destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
      router: router as unknown as Router,
      toast: toast as unknown as ToastService,
    });
    service.setMapFn(mapFn);
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('loading true', () => expect(service.loading()).toBe(true));
    it('project null', () => expect(service.project()).toBeNull());
    it('projectData null', () => expect(service.projectData()).toBeNull());
    it('showQrModal false', () => expect(service.showQrModal()).toBe(false));
    it('showContactModal false', () => expect(service.showContactModal()).toBe(false));
    it('showDeleteConfirm false', () => expect(service.showDeleteConfirm()).toBe(false));
    it('showDeleteProjectConfirm false', () => expect(service.showDeleteProjectConfirm()).toBe(false));
    it('deletingProject false', () => expect(service.deletingProject()).toBe(false));
  });

  // ============================================================================
  // init() — wizard mod
  // ============================================================================
  describe('init()', () => {
    it('useWizardEdit false ha project_creation_mode nem wizard', () => {
      expect(service.useWizardEdit()).toBe(false);
    });

    it('useWizardEdit true ha project_creation_mode wizard', () => {
      partnerService.getGlobalSettings.mockReturnValue(
        of({ data: { project_creation_mode: 'wizard' } }),
      );
      class MockWizard {}
      service.init({
        projectService: projectService as unknown as IProjectDetailService,
        backRoute: '/partner/projects',
        contactModalComponent: MockContactModal as Type<unknown>,
        projectEditModalComponent: MockEditModal as Type<unknown>,
        wizardEditModalComponent: MockWizard as Type<unknown>,
        orderDataDialogComponent: null,
        partnerService: partnerService as unknown as PartnerService,
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        router: router as unknown as Router,
        toast: toast as unknown as ToastService,
      });
      expect(service.useWizardEdit()).toBe(true);
    });
  });

  // ============================================================================
  // loadProject()
  // ============================================================================
  describe('loadProject()', () => {
    it('betolti a projektet es beallitja a signal-eket', () => {
      projectService.getProjectDetails.mockReturnValue(of({ id: 42 }));

      service.loadProject(42, mapFn);

      expect(service.loading()).toBe(false);
      expect(service.project()).toEqual({ id: 42 });
      expect(service.projectData()).toEqual(mockProjectData);
    });

    it('hiba eseten loading false', () => {
      projectService.getProjectDetails.mockReturnValue(throwError(() => new Error('fail')));

      service.loadProject(42, mapFn);

      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // goBack()
  // ============================================================================
  describe('goBack()', () => {
    it('navigal a backRoute-ra', () => {
      service.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/partner/projects']);
    });
  });

  // ============================================================================
  // updateProjectStatus()
  // ============================================================================
  describe('updateProjectStatus()', () => {
    it('frissiti a projekt statuszat', () => {
      service.projectData.set(mockProjectData);
      partnerService.updateProject.mockReturnValue(of({}));

      service.updateProjectStatus({ value: 'done', label: 'Kesz', color: 'blue' });

      expect(partnerService.updateProject).toHaveBeenCalledWith(42, { status: 'done' });
      expect(service.projectData()!.status).toBe('done');
      expect(service.projectData()!.statusLabel).toBe('Kesz');
      expect(service.projectData()!.statusColor).toBe('blue');
    });

    it('nem csinal semmit ha nincs projectData', () => {
      service.updateProjectStatus({ value: 'done', label: 'Kesz', color: 'blue' });
      expect(partnerService.updateProject).not.toHaveBeenCalled();
    });

    it('hiba eseten toast error', () => {
      service.projectData.set(mockProjectData);
      partnerService.updateProject.mockReturnValue(throwError(() => new Error('fail')));

      service.updateProjectStatus({ value: 'done', label: 'Kesz', color: 'blue' });

      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült frissíteni a státuszt');
    });
  });

  // ============================================================================
  // QR Modal
  // ============================================================================
  describe('QR modal', () => {
    it('closeQrModal visszaallit', () => {
      service.showQrModal.set(true);
      service.closeQrModal();
      expect(service.showQrModal()).toBe(false);
    });
  });

  // ============================================================================
  // Contact modal
  // ============================================================================
  describe('contact modal', () => {
    it('closeContactModal visszaallit', () => {
      service.showContactModal.set(true);
      service.editingContact.set(mockProjectData.contacts[0]);
      service.closeContactModal();
      expect(service.showContactModal()).toBe(false);
      expect(service.editingContact()).toBeNull();
    });
  });

  // ============================================================================
  // Delete contact
  // ============================================================================
  describe('delete contact', () => {
    it('confirmDeleteContact beallitja az allapotokat', () => {
      const contact = { id: 1, name: 'Teszt', email: 'test@test.com', phone: null };
      service.confirmDeleteContact(contact);
      expect(service.deletingContact()).toEqual(contact);
      expect(service.showDeleteConfirm()).toBe(true);
    });

    it('onDeleteContactResult cancel eseten visszaallit', () => {
      service.showDeleteConfirm.set(true);
      service.onDeleteContactResult({ action: 'cancel' });
      expect(service.showDeleteConfirm()).toBe(false);
      expect(service.deletingContact()).toBeNull();
    });

    it('onDeleteContactResult confirm eseten torli a kontaktot', () => {
      service.projectData.set(mockProjectData);
      service.confirmDeleteContact({ id: 1, name: 'Teszt', email: 'test@test.com', phone: null });
      projectService.deleteContact.mockReturnValue(of({ success: true }));
      projectService.getProjectDetails.mockReturnValue(of({ id: 42 }));

      service.onDeleteContactResult({ action: 'confirm' });

      expect(projectService.deleteContact).toHaveBeenCalledWith(42, 1);
      expect(service.deleting()).toBe(false);
    });
  });

  // ============================================================================
  // Delete project
  // ============================================================================
  describe('delete project', () => {
    it('confirmDeleteProject beallitja showDeleteProjectConfirm-ot', () => {
      service.confirmDeleteProject();
      expect(service.showDeleteProjectConfirm()).toBe(true);
    });

    it('onDeleteProjectResult cancel eseten visszaallit', () => {
      service.showDeleteProjectConfirm.set(true);
      service.onDeleteProjectResult({ action: 'cancel' });
      expect(service.showDeleteProjectConfirm()).toBe(false);
    });

    it('onDeleteProjectResult confirm eseten torli a projektet es navigal', () => {
      service.projectData.set(mockProjectData);
      projectService.deleteProject.mockReturnValue(of({ success: true }));

      service.confirmDeleteProject();
      service.onDeleteProjectResult({ action: 'confirm' });

      expect(projectService.deleteProject).toHaveBeenCalledWith(42);
      expect(service.deletingProject()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/partner/projects']);
    });

    it('torles hiba eseten deletingProject false', () => {
      service.projectData.set(mockProjectData);
      projectService.deleteProject.mockReturnValue(throwError(() => new Error('fail')));

      service.confirmDeleteProject();
      service.onDeleteProjectResult({ action: 'confirm' });

      expect(service.deletingProject()).toBe(false);
    });
  });

  // ============================================================================
  // Delete user
  // ============================================================================
  describe('delete user', () => {
    const mockSession = { id: 1, guestName: 'Teszt', guestEmail: null } as any;

    it('confirmDeleteUser beallitja az allapotokat', () => {
      service.confirmDeleteUser(mockSession);
      expect(service.deletingUser()).toEqual(mockSession);
      expect(service.showDeleteUserConfirm()).toBe(true);
    });

    it('onDeleteUserResult confirm hivja a callback-et', () => {
      const executeFn = vi.fn();
      service.confirmDeleteUser(mockSession);
      service.onDeleteUserResult({ action: 'confirm' }, executeFn);
      expect(executeFn).toHaveBeenCalledWith(mockSession);
      expect(service.showDeleteUserConfirm()).toBe(false);
    });

    it('onDeleteUserResult cancel nem hiv callback-et', () => {
      const executeFn = vi.fn();
      service.confirmDeleteUser(mockSession);
      service.onDeleteUserResult({ action: 'cancel' }, executeFn);
      expect(executeFn).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Samples dialog
  // ============================================================================
  describe('samples dialog', () => {
    it('openPackageDialog es closePackageDialog', () => {
      service.openPackageDialog({ editId: 1, initialTitle: 'Teszt' });
      expect(service.showPackageDialog()).toBe(true);
      expect(service.packageDialogData()).toEqual({ editId: 1, initialTitle: 'Teszt' });

      service.closePackageDialog();
      expect(service.showPackageDialog()).toBe(false);
      expect(service.packageDialogData()).toBeNull();
    });

    it('openVersionDialog es closeVersionDialog', () => {
      service.openVersionDialog({ packageId: 1, editVersion: null });
      expect(service.showVersionDialog()).toBe(true);

      service.closeVersionDialog();
      expect(service.showVersionDialog()).toBe(false);
    });

    it('confirmDeletePackage es onDeletePackageResult confirm', () => {
      const pkg = { id: 1, title: 'Teszt' } as any;
      const executeFn = vi.fn();
      service.confirmDeletePackage(pkg);
      expect(service.showDeletePackageConfirm()).toBe(true);

      service.onDeletePackageResult({ action: 'confirm' }, executeFn);
      expect(executeFn).toHaveBeenCalledWith(pkg);
      expect(service.showDeletePackageConfirm()).toBe(false);
    });

    it('confirmDeleteVersion es onDeleteVersionResult confirm', () => {
      const request = { packageId: 1, version: { id: 2 } } as any;
      const executeFn = vi.fn();
      service.confirmDeleteVersion(request);
      expect(service.showDeleteVersionConfirm()).toBe(true);

      service.onDeleteVersionResult({ action: 'confirm' }, executeFn);
      expect(executeFn).toHaveBeenCalledWith(1, 2);
      expect(service.showDeleteVersionConfirm()).toBe(false);
    });
  });

  // ============================================================================
  // Gallery muveletek
  // ============================================================================
  describe('gallery muveletek', () => {
    it('extendGalleryDeadline sikeres', () => {
      service.projectData.set(mockProjectData);
      partnerService.setGalleryDeadline.mockReturnValue(
        of({ data: { deadline: '2026-06-08' } }),
      );

      service.extendGalleryDeadline(7);

      expect(partnerService.setGalleryDeadline).toHaveBeenCalledWith(42, expect.any(String));
      expect(toast.success).toHaveBeenCalled();
      expect(service.projectData()!.deadline).toBe('2026-06-08');
    });

    it('extendGalleryDeadline hiba eseten toast error', () => {
      service.projectData.set(mockProjectData);
      partnerService.setGalleryDeadline.mockReturnValue(throwError(() => new Error('fail')));

      service.extendGalleryDeadline(7);

      expect(toast.error).toHaveBeenCalled();
    });

    it('createGallery sikeres navigacio', () => {
      service.projectData.set(mockProjectData);
      partnerService.createGallery.mockReturnValue(of({}));

      service.createGallery();

      expect(partnerService.createGallery).toHaveBeenCalledWith(42);
      expect(toast.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/partner/projects', 42, 'gallery']);
    });

    it('createGallery hiba eseten toast error', () => {
      service.projectData.set(mockProjectData);
      partnerService.createGallery.mockReturnValue(throwError(() => new Error('fail')));

      service.createGallery();

      expect(toast.error).toHaveBeenCalled();
    });

    it('createGallery nem csinal semmit ha nincs projectData', () => {
      service.createGallery();
      expect(partnerService.createGallery).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // setMapFn()
  // ============================================================================
  describe('setMapFn()', () => {
    it('beallitja a currentMapFn-t', () => {
      const fn = (raw: unknown) => mockProjectData;
      service.setMapFn(fn);
      expect(service.currentMapFn).toBe(fn);
    });
  });
});
