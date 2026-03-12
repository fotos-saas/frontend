import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, HttpEventType } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ExpandedTeacherViewDataService } from './expanded-teacher-view-data.service';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerPersonService } from '../../services/partner-person.service';
import { LoggerService } from '@core/services/logger.service';
import type { ExpandedViewResponse, ExpandedClassTeacher } from './expanded-teacher-view.types';

describe('ExpandedTeacherViewDataService', () => {
  let service: ExpandedTeacherViewDataService;
  let teacherService: Record<string, ReturnType<typeof vi.fn>>;
  let personService: Record<string, ReturnType<typeof vi.fn>>;
  let logger: { error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  const mockTeacher = (id: number, name: string, normalized: string, extra?: Partial<ExpandedClassTeacher>): ExpandedClassTeacher => ({
    personId: id, name, title: null, archiveId: null, hasPhoto: false,
    photoThumbUrl: null, hasOverride: false, linkedGroup: null,
    normalizedName: normalized, ...extra,
  });

  const mockData: ExpandedViewResponse = {
    sessionId: 10,
    projects: [{ projectId: 1, schoolName: 'Iskola A', className: '12.A' }],
    uploadedPhotos: [{ id: 100, filename: 'photo1.jpg', url: '/photo.jpg', thumbUrl: '/thumb.jpg' }],
    classes: [
      {
        projectId: 1, schoolId: 1, schoolName: 'Iskola A', className: '12.A', classYear: '2026',
        teachers: [mockTeacher(1, 'Kiss Janos', 'kiss_janos'), mockTeacher(2, 'Nagy Maria', 'nagy_maria')],
      },
      {
        projectId: 2, schoolId: 2, schoolName: 'Iskola B', className: '12.B', classYear: '2026',
        teachers: [mockTeacher(3, 'Kiss Janos', 'kiss_janos')],
      },
    ],
    similarityGroups: [{
      type: 'exact', normalizedName: 'kiss_janos', variants: ['Kiss Janos'],
      persons: [{ personId: 1, projectId: 1, name: 'Kiss Janos' }, { personId: 3, projectId: 2, name: 'Kiss Janos' }],
    }],
    availableProjects: [{ projectId: 5, schoolName: 'Iskola C', className: '12.C' }],
  };

  beforeEach(() => {
    teacherService = {
      getExpandedView: vi.fn(), addProjectToSession: vi.fn(), removeProjectFromSession: vi.fn(),
      uploadPhotosToSession: vi.fn(), deleteSessionPhoto: vi.fn(), deleteAllSessionPhotos: vi.fn(),
      syncSessionPhotos: vi.fn(), assignPhotoToTeacher: vi.fn(),
      removeOverridePhoto: vi.fn(), setOverridePhoto: vi.fn(),
    };
    personService = { addPersons: vi.fn(), updatePerson: vi.fn(), deletePerson: vi.fn() };
    logger = { error: vi.fn(), info: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ExpandedTeacherViewDataService,
        { provide: PartnerTeacherService, useValue: teacherService },
        { provide: PartnerPersonService, useValue: personService },
        { provide: LoggerService, useValue: logger },
      ],
    });
    service = TestBed.inject(ExpandedTeacherViewDataService);
  });

  describe('kezdeti allapot', () => {
    it('signal alapertekek', () => {
      expect(service.loading()).toBe(false);
      expect(service.uploading()).toBe(false);
      expect(service.syncing()).toBe(false);
      expect(service.data()).toBeNull();
      expect(service.assigning()).toBe(false);
      expect(service.pendingDrop()).toBeNull();
      expect(service.selectedPersonId()).toBeNull();
      expect(service.uploadProgress()).toBe(0);
    });

    it('computed-ok ures allapotban', () => {
      expect(service.sessionId()).toBeNull();
      expect(service.uploadedPhotos()).toEqual([]);
      expect(service.classes()).toEqual([]);
      expect(service.similarityGroups()).toEqual([]);
      expect(service.matchingPersonIds().size).toBe(0);
      expect(service.highlightedSimilarityGroup()).toBeNull();
      expect(service.linkedGroupNumbers().size).toBe(0);
    });
  });

  describe('loadData()', () => {
    it('betolti az adatokat sikeresen', () => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
      expect(service.loading()).toBe(false);
      expect(service.data()).toEqual(mockData);
      expect(service.sessionId()).toBe(10);
    });

    it('hiba eseten loading false es logger.error', () => {
      teacherService.getExpandedView.mockReturnValue(throwError(() => new Error('fail')));
      service.loadData(1);
      expect(service.loading()).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('computed-ok adattal', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('matchingPersonIds megtalal tobb azonos nevu tanart', () => {
      service.hoveredNormalizedName.set('kiss_janos');
      const ids = service.matchingPersonIds();
      expect(ids.size).toBe(2);
      expect(ids.has(1)).toBe(true);
      expect(ids.has(3)).toBe(true);
    });

    it('matchingPersonIds ures ha nincs hover', () => {
      expect(service.matchingPersonIds().size).toBe(0);
    });

    it('highlightedSimilarityGroup megtalal csoportot', () => {
      service.hoveredNormalizedName.set('kiss_janos');
      expect(service.highlightedSimilarityGroup()!.normalizedName).toBe('kiss_janos');
    });

    it('highlightedSimilarityGroup null ha nincs match', () => {
      service.hoveredNormalizedName.set('nem_letezo');
      expect(service.highlightedSimilarityGroup()).toBeNull();
    });

    it('linkedGroupNumbers szamolja a 2+ tagot', () => {
      service.data.set({
        ...mockData,
        classes: [{
          ...mockData.classes[0],
          teachers: [
            mockTeacher(1, 'Kiss Janos', 'kiss_janos', { linkedGroup: 'group1' }),
            mockTeacher(2, 'Nagy Maria', 'nagy_maria', { linkedGroup: 'group1' }),
          ],
        }],
      });
      expect(service.linkedGroupNumbers().get('group1')).toBe(1);
    });

    it('linkedGroupNumbers nem szamolja az egytagut', () => {
      service.data.set({
        ...mockData,
        classes: [{ ...mockData.classes[0], teachers: [mockTeacher(1, 'A', 'a', { linkedGroup: 'solo' })] }],
      });
      expect(service.linkedGroupNumbers().has('solo')).toBe(false);
    });
  });

  describe('addProject / removeProject', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('addProject sikeres', () => {
      teacherService.addProjectToSession.mockReturnValue(of(mockData));
      service.addProject(5);
      expect(teacherService.addProjectToSession).toHaveBeenCalledWith(10, 5);
      expect(service.loading()).toBe(false);
    });

    it('addProject nem csinal semmit sessionId nelkul', () => {
      service.data.set(null);
      service.addProject(5);
      expect(teacherService.addProjectToSession).not.toHaveBeenCalled();
    });

    it('removeProject sikeres', () => {
      teacherService.removeProjectFromSession.mockReturnValue(of(mockData));
      service.removeProject(2);
      expect(teacherService.removeProjectFromSession).toHaveBeenCalledWith(10, 2);
    });
  });

  describe('uploadPhotos()', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('progress esemeny frissiti a szazalekot', () => {
      teacherService.uploadPhotosToSession.mockReturnValue(of(
        { type: HttpEventType.UploadProgress, loaded: 50, total: 100 },
      ));
      service.uploadPhotos([new File([''], 'test.jpg')]);
      expect(service.uploadProgress()).toBe(50);
    });

    it('sikeres feltoltes hozzaadja a fotokat', () => {
      const newPhotos = [{ id: 200, filename: 'new.jpg', url: '/new.jpg', thumbUrl: '/t.jpg' }];
      teacherService.uploadPhotosToSession.mockReturnValue(of(new HttpResponse({ body: { photos: newPhotos } })));
      service.uploadPhotos([new File([''], 'test.jpg')]);
      expect(service.uploading()).toBe(false);
      expect(service.uploadedPhotos().length).toBe(2);
      expect(service.uploadedPhotos()[0].id).toBe(200);
    });

    it('hiba eseten uploading false', () => {
      teacherService.uploadPhotosToSession.mockReturnValue(throwError(() => new Error('fail')));
      service.uploadPhotos([new File([''], 'test.jpg')]);
      expect(service.uploading()).toBe(false);
      expect(service.uploadProgress()).toBe(0);
    });
  });

  describe('foto torles', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('deletePhoto eltavolitja a fotot', () => {
      teacherService.deleteSessionPhoto.mockReturnValue(of({}));
      service.deletePhoto(100);
      expect(service.uploadedPhotos().length).toBe(0);
    });

    it('deleteAllPhotos uritja a listat', () => {
      teacherService.deleteAllSessionPhotos.mockReturnValue(of({}));
      service.deleteAllPhotos();
      expect(service.uploadedPhotos().length).toBe(0);
    });
  });

  describe('syncPhotos()', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('sikeres szinkron ujratolt', () => {
      teacherService.syncSessionPhotos.mockReturnValue(of({}));
      service.syncPhotos();
      expect(service.syncing()).toBe(false);
      expect(teacherService.getExpandedView).toHaveBeenCalledTimes(2);
    });

    it('hiba eseten syncing false', () => {
      teacherService.syncSessionPhotos.mockReturnValue(throwError(() => new Error('fail')));
      service.syncPhotos();
      expect(service.syncing()).toBe(false);
    });
  });

  describe('handlePhotoDrop()', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('egyetlen tanarrnal kozvetlenul assign-ol', () => {
      teacherService.assignPhotoToTeacher.mockReturnValue(of({}));
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.handlePhotoDrop(100, 2);
      expect(teacherService.assignPhotoToTeacher).toHaveBeenCalledWith(10, 100, [2]);
    });

    it('tobb azonos nevu tanarrnal pendingDrop-ot allit', () => {
      service.handlePhotoDrop(100, 1);
      expect(service.pendingDrop()).not.toBeNull();
      expect(service.pendingDrop()!.allPersonIds.length).toBe(2);
      expect(service.pendingDrop()!.teacherName).toBe('Kiss Janos');
    });

    it('nem csinal semmit ha nincs data', () => {
      service.data.set(null);
      service.handlePhotoDrop(100, 1);
      expect(service.pendingDrop()).toBeNull();
    });
  });

  describe('confirmDrop / cancelDrop', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
      service.handlePhotoDrop(100, 1);
    });

    it('confirmDrop "all" minden person-nak', () => {
      teacherService.assignPhotoToTeacher.mockReturnValue(of({}));
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.confirmDrop('all');
      expect(service.pendingDrop()).toBeNull();
      expect(teacherService.assignPhotoToTeacher).toHaveBeenCalledWith(10, 100, expect.arrayContaining([1, 3]));
    });

    it('confirmDrop "single" csak a target-nek', () => {
      teacherService.assignPhotoToTeacher.mockReturnValue(of({}));
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.confirmDrop('single');
      expect(teacherService.assignPhotoToTeacher).toHaveBeenCalledWith(10, 100, [1]);
    });

    it('cancelDrop torol mindent', () => {
      service.draggedPhoto.set(mockData.uploadedPhotos[0]);
      service.cancelDrop();
      expect(service.pendingDrop()).toBeNull();
      expect(service.draggedPhoto()).toBeNull();
    });
  });

  describe('assignPhotoToTeacher()', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('nem futtat ha mar assigning', () => {
      service.assigning.set(true);
      service.assignPhotoToTeacher(100, [1]);
      expect(teacherService.assignPhotoToTeacher).not.toHaveBeenCalled();
    });

    it('sikeres assign utan ujratolt', () => {
      teacherService.assignPhotoToTeacher.mockReturnValue(of({}));
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.assignPhotoToTeacher(100, [1]);
      expect(service.assigning()).toBe(false);
      expect(service.draggedPhoto()).toBeNull();
    });
  });

  describe('override muveletek', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('removeOverride frissiti a tanar fotojat', () => {
      teacherService.removeOverridePhoto.mockReturnValue(of({
        data: { hasPhoto: false, hasOverride: false, photoThumbUrl: null },
      }));
      service.removeOverride(1);
      expect(service.classes()[0].teachers.find(t => t.personId === 1)!.hasOverride).toBe(false);
    });

    it('setOverrideFromArchive hivja a service-t', () => {
      teacherService.setOverridePhoto.mockReturnValue(of({
        data: { hasPhoto: true, hasOverride: true, photoThumbUrl: '/override.jpg' },
      }));
      service.setOverrideFromArchive(1, 99);
      expect(teacherService.setOverridePhoto).toHaveBeenCalledWith(1, 1, 99);
    });
  });

  describe('tanar CRUD', () => {
    beforeEach(() => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
    });

    it('addTeacher hozzaad es ujratolt', () => {
      personService.addPersons.mockReturnValue(of({}));
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.addTeacher(1, 'Uj Tanar');
      expect(personService.addPersons).toHaveBeenCalledWith(1, 'Uj Tanar', 'teacher');
    });

    it('updateTeacher frissiti a nevet', () => {
      personService.updatePerson.mockReturnValue(of({ data: { name: 'Kiss Janos Uj', title: 'Dr.' } }));
      service.updateTeacher(1, 1, { name: 'Kiss Janos Uj', title: 'Dr.' });
      const teacher = service.classes()[0].teachers.find(t => t.personId === 1);
      expect(teacher!.name).toBe('Kiss Janos Uj');
      expect(teacher!.title).toBe('Dr.');
    });

    it('deleteTeacher eltavolitja a listbol', () => {
      personService.deletePerson.mockReturnValue(of({}));
      service.deleteTeacher(1, 1);
      expect(service.classes()[0].teachers.find(t => t.personId === 1)).toBeUndefined();
    });

    it('deleteTeacher torli a selectedPersonId-t ha az torolt szemely', () => {
      service.selectedPersonId.set(1);
      personService.deletePerson.mockReturnValue(of({}));
      service.deleteTeacher(1, 1);
      expect(service.selectedPersonId()).toBeNull();
    });
  });

  describe('hover es select', () => {
    it('onTeacherHover beallitja az allapotokat', () => {
      service.onTeacherHover('kiss_janos', 1);
      expect(service.hoveredNormalizedName()).toBe('kiss_janos');
      expect(service.hoveredPersonId()).toBe(1);
    });

    it('onTeacherHover null-ra allit', () => {
      service.onTeacherHover('kiss_janos', 1);
      service.onTeacherHover(null, null);
      expect(service.hoveredNormalizedName()).toBeNull();
    });

    it('onTeacherSelect toggle mukodik', () => {
      service.onTeacherSelect(1);
      expect(service.selectedPersonId()).toBe(1);
      service.onTeacherSelect(1);
      expect(service.selectedPersonId()).toBeNull();
    });

    it('onTeacherSelect masik szemelyre valt', () => {
      service.onTeacherSelect(1);
      service.onTeacherSelect(2);
      expect(service.selectedPersonId()).toBe(2);
    });
  });

  describe('reloadData()', () => {
    it('ujratolt ha volt sourceProjectId', () => {
      teacherService.getExpandedView.mockReturnValue(of(mockData));
      service.loadData(1);
      service.reloadData();
      expect(teacherService.getExpandedView).toHaveBeenCalledTimes(2);
    });

    it('nem csinal semmit ha nem volt loadData', () => {
      service.reloadData();
      expect(teacherService.getExpandedView).not.toHaveBeenCalled();
    });
  });
});
