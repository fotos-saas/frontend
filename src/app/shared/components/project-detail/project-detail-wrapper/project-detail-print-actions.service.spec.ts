import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProjectDetailPrintActionsService } from './project-detail-print-actions.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PartnerFinalizationService } from '../../../../features/partner/services/partner-finalization.service';
import { PartnerAlbumService } from '../../../../features/partner/services/partner-album.service';
import { ProjectDetailData } from '../project-detail.types';
import type { ProjectTask } from '../../../../features/partner/models/partner.models';

vi.mock('../../../utils/file.util', () => ({
  saveFile: vi.fn(),
}));

vi.mock('../../../utils/string.util', () => ({
  projectShortName: vi.fn().mockReturnValue('test-proj'),
}));

describe('ProjectDetailPrintActionsService', () => {
  let service: ProjectDetailPrintActionsService;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let finalizationService: {
    downloadPrintReady: ReturnType<typeof vi.fn>;
    uploadPrintReady: ReturnType<typeof vi.fn>;
    deletePrintReady: ReturnType<typeof vi.fn>;
  };
  let albumService: { downloadPendingZip: ReturnType<typeof vi.fn> };
  let mockProjectData: ProjectDetailData;
  let reloadProject: ReturnType<typeof vi.fn>;

  const mockTask: ProjectTask = {
    id: 1,
    project_id: 42,
    title: 'Teszt feladat',
    description: null,
    type: 'task',
    is_completed: false,
    completed_at: null,
    is_reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
    created_at: '2026-01-01',
    created_by: null,
    assigned_to: null,
    attachments: [],
    answer: null,
  };

  beforeEach(() => {
    toast = { success: vi.fn(), error: vi.fn() };
    finalizationService = {
      downloadPrintReady: vi.fn(),
      uploadPrintReady: vi.fn(),
      deletePrintReady: vi.fn(),
    };
    albumService = { downloadPendingZip: vi.fn() };
    reloadProject = vi.fn();

    mockProjectData = {
      id: 42,
      name: 'Test Projekt',
      school: null,
      partner: null,
      className: null,
      classYear: null,
      status: 'active',
      statusLabel: 'Aktiv',
      tabloStatus: null,
      photoDate: null,
      deadline: null,
      expectedClassSize: null,
      contact: null,
      contacts: [],
      qrCode: null,
      activeQrCodes: [],
      qrCodesHistory: [],
      printSmallTablo: { id: 1, fileName: 'small.pdf', size: 1000, mimeType: 'application/pdf', uploadedAt: '2026-01-01' },
      printFlat: { id: 2, fileName: 'flat.tiff', size: 2000, mimeType: 'image/tiff', uploadedAt: '2026-01-01' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    TestBed.configureTestingModule({
      providers: [ProjectDetailPrintActionsService],
    });
    service = TestBed.inject(ProjectDetailPrintActionsService);
    service.init({
      destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
      toast: toast as unknown as ToastService,
      finalizationService: finalizationService as unknown as PartnerFinalizationService,
      albumService: albumService as unknown as PartnerAlbumService,
      getProjectData: () => mockProjectData,
      reloadProject,
    });
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('signal alapertekek', () => {
      expect(service.showDeletePrintFileConfirm()).toBe(false);
      expect(service.deletingPrintFileType()).toBeNull();
      expect(service.downloadingType()).toBeNull();
      expect(service.showTaskDialog()).toBe(false);
      expect(service.editingTaskData()).toBeNull();
      expect(service.showTaskDeleteConfirm()).toBe(false);
      expect(service.deletingTask()).toBeNull();
      expect(service.showAnswerDialog()).toBe(false);
      expect(service.answeringTask()).toBeNull();
    });
  });

  // ============================================================================
  // downloadPrintFile()
  // ============================================================================
  describe('downloadPrintFile()', () => {
    it('letolti a small_tablo fajlt sikeresen', () => {
      const blob = new Blob(['test']);
      finalizationService.downloadPrintReady.mockReturnValue(of(blob));

      service.downloadPrintFile({ type: 'small_tablo' });

      expect(finalizationService.downloadPrintReady).toHaveBeenCalledWith(42, 'small_tablo');
      expect(service.downloadingType()).toBeNull();
    });

    it('letolti a flat fajlt sikeresen', () => {
      const blob = new Blob(['test']);
      finalizationService.downloadPrintReady.mockReturnValue(of(blob));

      service.downloadPrintFile({ type: 'flat' });

      expect(finalizationService.downloadPrintReady).toHaveBeenCalledWith(42, 'flat');
    });

    it('hiba eseten downloadingType null es toast error', () => {
      finalizationService.downloadPrintReady.mockReturnValue(throwError(() => new Error('fail')));

      service.downloadPrintFile({ type: 'small_tablo' });

      expect(service.downloadingType()).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült letölteni a fájlt.');
    });

    it('nem csinal semmit ha nincs project', () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        finalizationService: finalizationService as unknown as PartnerFinalizationService,
        albumService: null,
        getProjectData: () => null,
        reloadProject,
      });

      service.downloadPrintFile({ type: 'small_tablo' });
      expect(finalizationService.downloadPrintReady).not.toHaveBeenCalled();
    });

    it('nem csinal semmit ha nincs a megfelelo print fajl', () => {
      mockProjectData.printSmallTablo = null;

      service.downloadPrintFile({ type: 'small_tablo' });
      expect(finalizationService.downloadPrintReady).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // uploadPrintFile()
  // ============================================================================
  describe('uploadPrintFile()', () => {
    it('sikeres feltoltes utan toast success es reloadProject', () => {
      finalizationService.uploadPrintReady.mockReturnValue(of({}));
      const tabState = { uploading: { set: vi.fn() }, uploadError: { set: vi.fn() } };
      const file = new File([''], 'test.pdf');

      service.uploadPrintFile({ file, type: 'small_tablo' }, tabState);

      expect(tabState.uploading.set).toHaveBeenCalledWith(true);
      expect(tabState.uploading.set).toHaveBeenCalledWith(false);
      expect(toast.success).toHaveBeenCalled();
      expect(reloadProject).toHaveBeenCalled();
    });

    it('hiba eseten uploadError-t allit es toast error', () => {
      finalizationService.uploadPrintReady.mockReturnValue(throwError(() => new Error('fail')));
      const tabState = { uploading: { set: vi.fn() }, uploadError: { set: vi.fn() } };
      const file = new File([''], 'test.pdf');

      service.uploadPrintFile({ file, type: 'flat' }, tabState);

      expect(tabState.uploading.set).toHaveBeenCalledWith(false);
      expect(tabState.uploadError.set).toHaveBeenCalledWith('Hiba tortent a feltoltes soran.');
      expect(toast.error).toHaveBeenCalled();
    });

    it('tabState nelkul is mukodik', () => {
      finalizationService.uploadPrintReady.mockReturnValue(of({}));
      const file = new File([''], 'test.pdf');

      service.uploadPrintFile({ file, type: 'small_tablo' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // confirmDeletePrintFile() / onDeletePrintFileResult()
  // ============================================================================
  describe('print file torles', () => {
    it('confirmDeletePrintFile beallitja az allapotokat', () => {
      service.confirmDeletePrintFile({ type: 'flat' });

      expect(service.deletingPrintFileType()).toBe('flat');
      expect(service.showDeletePrintFileConfirm()).toBe(true);
    });

    it('onDeletePrintFileResult confirm eseten torli a fajlt', () => {
      service.confirmDeletePrintFile({ type: 'small_tablo' });
      finalizationService.deletePrintReady.mockReturnValue(of({}));

      service.onDeletePrintFileResult({ action: 'confirm' });

      expect(finalizationService.deletePrintReady).toHaveBeenCalledWith(42, 'small_tablo');
      expect(toast.success).toHaveBeenCalled();
      expect(reloadProject).toHaveBeenCalled();
      expect(service.showDeletePrintFileConfirm()).toBe(false);
      expect(service.deletingPrintFileType()).toBeNull();
    });

    it('onDeletePrintFileResult cancel eseten nem torol', () => {
      service.confirmDeletePrintFile({ type: 'flat' });

      service.onDeletePrintFileResult({ action: 'cancel' });

      expect(finalizationService.deletePrintReady).not.toHaveBeenCalled();
      expect(service.showDeletePrintFileConfirm()).toBe(false);
    });

    it('torles hiba eseten toast error', () => {
      service.confirmDeletePrintFile({ type: 'flat' });
      finalizationService.deletePrintReady.mockReturnValue(throwError(() => new Error('fail')));

      service.onDeletePrintFileResult({ action: 'confirm' });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // downloadPendingPhotosZip()
  // ============================================================================
  describe('downloadPendingPhotosZip()', () => {
    it('sikeres letoltes', () => {
      albumService.downloadPendingZip.mockReturnValue(of(new Blob(['test'])));

      service.downloadPendingPhotosZip();

      expect(albumService.downloadPendingZip).toHaveBeenCalledWith(42);
      expect(toast.success).toHaveBeenCalledWith('Siker', 'ZIP letoltve');
    });

    it('hiba eseten toast error', () => {
      albumService.downloadPendingZip.mockReturnValue(throwError(() => new Error('fail')));

      service.downloadPendingPhotosZip();

      expect(toast.error).toHaveBeenCalledWith('Hiba', 'A letoltes nem sikerult');
    });

    it('nem csinal semmit ha nincs albumService', () => {
      service.init({
        destroyRef: { onDestroy: vi.fn() } as unknown as DestroyRef,
        toast: toast as unknown as ToastService,
        finalizationService: null,
        albumService: null,
        getProjectData: () => mockProjectData,
        reloadProject,
      });

      service.downloadPendingPhotosZip();
      expect(albumService.downloadPendingZip).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Task muveletek
  // ============================================================================
  describe('task muveletek', () => {
    it('openTaskDialog uj feladat (null)', () => {
      service.openTaskDialog(null);
      expect(service.editingTaskData()).toBeNull();
      expect(service.showTaskDialog()).toBe(true);
    });

    it('openTaskDialog szerkesztes', () => {
      service.openTaskDialog(mockTask);
      expect(service.editingTaskData()).toEqual(mockTask);
      expect(service.showTaskDialog()).toBe(true);
    });

    it('closeTaskDialog visszaallit', () => {
      service.openTaskDialog(mockTask);
      service.closeTaskDialog();
      expect(service.showTaskDialog()).toBe(false);
      expect(service.editingTaskData()).toBeNull();
    });

    it('onTaskSaved callback hivasa', () => {
      const onSaved = vi.fn();
      service.openTaskDialog(mockTask);
      service.onTaskSaved(mockTask, onSaved);
      expect(onSaved).toHaveBeenCalledWith(mockTask, true);
      expect(service.showTaskDialog()).toBe(false);
    });

    it('onTaskSaved wasEdit false ha nem volt szerkesztes', () => {
      const onSaved = vi.fn();
      service.openTaskDialog(null);
      service.onTaskSaved(mockTask, onSaved);
      expect(onSaved).toHaveBeenCalledWith(mockTask, false);
    });

    it('confirmDeleteTask beallitja az allapotokat', () => {
      service.confirmDeleteTask(mockTask);
      expect(service.deletingTask()).toEqual(mockTask);
      expect(service.showTaskDeleteConfirm()).toBe(true);
    });

    it('onTaskDeleteResult confirm hivja a callback-et', () => {
      const executeFn = vi.fn();
      service.confirmDeleteTask(mockTask);
      service.onTaskDeleteResult({ action: 'confirm' }, executeFn);
      expect(executeFn).toHaveBeenCalledWith(mockTask);
      expect(service.showTaskDeleteConfirm()).toBe(false);
      expect(service.deletingTask()).toBeNull();
    });

    it('onTaskDeleteResult cancel nem hiv callback-et', () => {
      const executeFn = vi.fn();
      service.confirmDeleteTask(mockTask);
      service.onTaskDeleteResult({ action: 'cancel' }, executeFn);
      expect(executeFn).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Valasz dialogus
  // ============================================================================
  describe('valasz dialogus', () => {
    it('openAnswerDialog beallitja az allapotokat', () => {
      service.openAnswerDialog(mockTask);
      expect(service.answeringTask()).toEqual(mockTask);
      expect(service.showAnswerDialog()).toBe(true);
    });

    it('closeAnswerDialog visszaallit', () => {
      service.openAnswerDialog(mockTask);
      service.closeAnswerDialog();
      expect(service.showAnswerDialog()).toBe(false);
      expect(service.answeringTask()).toBeNull();
    });

    it('onAnswerSaved callback hivasa', () => {
      const onSaved = vi.fn();
      service.openAnswerDialog(mockTask);
      service.onAnswerSaved(mockTask, onSaved);
      expect(onSaved).toHaveBeenCalledWith(mockTask, true);
      expect(service.showAnswerDialog()).toBe(false);
    });
  });
});
