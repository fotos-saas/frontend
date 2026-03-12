import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef, ViewContainerRef, ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Subject } from 'rxjs';
import { ProjectDetailDynamicDialogsService } from './project-detail-dynamic-dialogs.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerGalleryService } from '../../../../features/partner/services/partner-gallery.service';
import { ProjectDetailData } from '../project-detail.types';

// Mock saveFile utility
vi.mock('../../../utils/file.util', () => ({
  saveFile: vi.fn(),
}));

vi.mock('../../../utils/string.util', () => ({
  projectShortName: vi.fn().mockReturnValue('test-project'),
}));

describe('ProjectDetailDynamicDialogsService', () => {
  let service: ProjectDetailDynamicDialogsService<unknown>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let galleryService: { downloadMonitoringZip: ReturnType<typeof vi.fn> };
  let mockProjectData: ProjectDetailData;
  let reloadProject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    toast = { success: vi.fn(), error: vi.fn() };
    galleryService = { downloadMonitoringZip: vi.fn() };
    reloadProject = vi.fn();

    mockProjectData = {
      id: 42,
      name: 'Test Projekt',
      school: { id: 1, name: 'Teszt Iskola', city: 'Budapest' },
      partner: null,
      className: '12.A',
      classYear: '2026',
      status: 'active',
      statusLabel: 'Aktiv',
      tabloStatus: null,
      photoDate: null,
      deadline: null,
      expectedClassSize: 30,
      contact: null,
      contacts: [],
      qrCode: null,
      activeQrCodes: [],
      qrCodesHistory: [],
      tabloGalleryId: 10,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    TestBed.configureTestingModule({
      providers: [ProjectDetailDynamicDialogsService],
    });
    service = TestBed.inject(ProjectDetailDynamicDialogsService);
    service.init({
      destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
      toast: toast as unknown as ToastService,
      galleryService: galleryService as unknown as PartnerGalleryService,
      getProjectData: () => mockProjectData,
      reloadProject,
    });
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('downloadingSelections false', () => {
      expect(service.downloadingSelections()).toBe(false);
    });
  });

  // ============================================================================
  // openPersonsModal()
  // ============================================================================
  describe('openPersonsModal()', () => {
    it('nem csinal semmit ha nincs projectData', async () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: null,
        getProjectData: () => null,
        reloadProject,
      });

      const container = { clear: vi.fn(), createComponent: vi.fn() } as unknown as ViewContainerRef;
      await service.openPersonsModal(container);
      expect(container.clear).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // openAddPersonsDialog()
  // ============================================================================
  describe('openAddPersonsDialog()', () => {
    it('nem csinal semmit ha nincs projectData', async () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: null,
        getProjectData: () => null,
        reloadProject,
      });

      const container = { clear: vi.fn() } as unknown as ViewContainerRef;
      await service.openAddPersonsDialog(container, 'student');
      expect(container.clear).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // openUploadWizard()
  // ============================================================================
  describe('openUploadWizard()', () => {
    it('nem csinal semmit ha nincs projectData', async () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: null,
        getProjectData: () => null,
        reloadProject,
      });

      const container = { clear: vi.fn() } as unknown as ViewContainerRef;
      await service.openUploadWizard(container);
      expect(container.clear).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // openOrderWizard()
  // ============================================================================
  describe('openOrderWizard()', () => {
    it('nem csinal semmit ha nincs projectData', async () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: null,
        getProjectData: () => null,
        reloadProject,
      });

      const container = { clear: vi.fn() } as unknown as ViewContainerRef;
      await service.openOrderWizard(container);
      expect(container.clear).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // openSelectionDownloadDialog()
  // ============================================================================
  describe('openSelectionDownloadDialog()', () => {
    it('nem csinal semmit ha nincs tabloGalleryId', async () => {
      const noGallery = { ...mockProjectData, tabloGalleryId: null };
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: galleryService as unknown as PartnerGalleryService,
        getProjectData: () => noGallery,
        reloadProject,
      });

      const container = { clear: vi.fn() } as unknown as ViewContainerRef;
      await service.openSelectionDownloadDialog(container);
      expect(container.clear).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // downloadSelections (private, indirekt teszt)
  // ============================================================================
  describe('downloadSelections logika', () => {
    it('downloadingSelections false marad ha nincs galleryService', () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        galleryService: null,
        getProjectData: () => mockProjectData,
        reloadProject,
      });

      // Hivjuk a private metodus-t indirekt modon
      (service as any).downloadSelections({ fileNaming: 'original', personType: 'both' });
      expect(service.downloadingSelections()).toBe(false);
    });

    it('sikeres letoltes utan downloadingSelections false es toast success', () => {
      const blob = new Blob(['test']);
      galleryService.downloadMonitoringZip.mockReturnValue(of(blob));

      (service as any).downloadSelections({ fileNaming: 'original', personType: 'both' });

      expect(service.downloadingSelections()).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Siker', 'ZIP letoltve');
    });

    it('hiba eseten downloadingSelections false es toast error', () => {
      galleryService.downloadMonitoringZip.mockReturnValue(throwError(() => new Error('fail')));

      (service as any).downloadSelections({ fileNaming: 'original', personType: 'both' });

      expect(service.downloadingSelections()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'A ZIP letoltes nem sikerult');
    });

    it('personType "student" eseten personType parametert kuld', () => {
      galleryService.downloadMonitoringZip.mockReturnValue(of(new Blob(['test'])));

      (service as any).downloadSelections({ fileNaming: 'student_name', personType: 'student' });

      expect(galleryService.downloadMonitoringZip).toHaveBeenCalledWith(42, {
        zipContent: 'all',
        fileNaming: 'student_name',
        includeExcel: false,
        personType: 'student',
        effectiveOnly: true,
      });
    });

    it('personType "both" eseten undefined a personType parameter', () => {
      galleryService.downloadMonitoringZip.mockReturnValue(of(new Blob(['test'])));

      (service as any).downloadSelections({ fileNaming: 'original', personType: 'both' });

      expect(galleryService.downloadMonitoringZip).toHaveBeenCalledWith(42, expect.objectContaining({
        personType: undefined,
      }));
    });
  });
});
