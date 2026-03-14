import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PartnerPersonService } from './partner-person.service';
import { environment } from '../../../../environments/environment';

describe('PartnerPersonService', () => {
  let service: PartnerPersonService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/partner`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PartnerPersonService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ============================================================================
  // ensurePersonArchive
  // ============================================================================
  describe('ensurePersonArchive', () => {
    it('POST kérést küld a helyes URL-re', () => {
      const projectId = 10;
      const personId = 5;

      service.ensurePersonArchive(projectId, personId).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/${projectId}/persons/${personId}/ensure-archive`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
    });

    it('visszaadja az archiveId-t sikeres válasz esetén', () => {
      const projectId = 10;
      const personId = 5;
      const mockResponse = { success: true, data: { archiveId: 42 }, message: 'Archívum létrehozva' };

      let result: any;
      service.ensurePersonArchive(projectId, personId).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/${projectId}/persons/${personId}/ensure-archive`)
        .flush(mockResponse);

      expect(result).toEqual(mockResponse);
      expect(result.data.archiveId).toBe(42);
    });
  });

  // ============================================================================
  // updatePerson
  // ============================================================================
  describe('updatePerson', () => {
    it('PATCH kérést küld a helyes URL-re', () => {
      const projectId = 10;
      const personId = 5;
      const updateData = { name: 'Új Név', title: 'igazgató' };

      service.updatePerson(projectId, personId, updateData).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/${projectId}/persons/${personId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush({ success: true, message: 'Frissítve', data: { id: 5, name: 'Új Név', title: 'igazgató', note: null } });
    });

    it('visszaadja a frissített adatokat', () => {
      const expectedResponse = {
        success: true,
        message: 'Frissítve',
        data: { id: 5, name: 'Kiss János', title: null, note: 'megjegyzés' },
      };

      let result: any;
      service.updatePerson(10, 5, { name: 'Kiss János', note: 'megjegyzés' }).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5`).flush(expectedResponse);
      expect(result.data.name).toBe('Kiss János');
      expect(result.data.note).toBe('megjegyzés');
    });

    it('részleges frissítés is működik (csak name)', () => {
      service.updatePerson(10, 5, { name: 'Teszt' }).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/5`);
      expect(req.request.body).toEqual({ name: 'Teszt' });
      req.flush({ success: true, message: '', data: { id: 5, name: 'Teszt', title: null, note: null } });
    });
  });

  // ============================================================================
  // deletePerson
  // ============================================================================
  describe('deletePerson', () => {
    it('DELETE kérést küld a helyes URL-re', () => {
      service.deletePerson(10, 5).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Törölve', data: { id: 5 } });
    });

    it('visszaadja a törölt id-t', () => {
      let result: any;
      service.deletePerson(10, 5).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5`)
        .flush({ success: true, message: 'Törölve', data: { id: 5 } });

      expect(result.data.id).toBe(5);
    });
  });

  // ============================================================================
  // deletePersonsBatch
  // ============================================================================
  describe('deletePersonsBatch', () => {
    it('POST kérést küld a helyes URL-re az ids tömbbel', () => {
      const ids = [1, 2, 3];
      service.deletePersonsBatch(10, ids).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/batch-delete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ ids: [1, 2, 3] });
      req.flush({ success: true, message: 'Törölve', data: { deleted_count: 3 } });
    });

    it('visszaadja a törölt elemek számát', () => {
      let result: any;
      service.deletePersonsBatch(10, [1, 2]).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/batch-delete`)
        .flush({ success: true, message: 'Törölve', data: { deleted_count: 2 } });

      expect(result.data.deleted_count).toBe(2);
    });

    it('üres tömbbel is működik', () => {
      service.deletePersonsBatch(10, []).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/batch-delete`);
      expect(req.request.body).toEqual({ ids: [] });
      req.flush({ success: true, message: '', data: { deleted_count: 0 } });
    });
  });

  // ============================================================================
  // overridePersonPhoto
  // ============================================================================
  describe('overridePersonPhoto', () => {
    it('PATCH kérést küld photo_id-val', () => {
      service.overridePersonPhoto(10, 5, 99).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/5/override-photo`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ photo_id: 99 });
      req.flush({
        success: true, message: 'Fotó felülírva',
        data: { id: 5, hasPhoto: true, photoThumbUrl: '/thumb.jpg', photoUrl: '/photo.jpg', hasOverride: true },
      });
    });

    it('visszaadja a frissített fotó adatokat', () => {
      let result: any;
      service.overridePersonPhoto(10, 5, 99).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5/override-photo`)
        .flush({
          success: true, message: 'OK',
          data: { id: 5, hasPhoto: true, photoThumbUrl: '/t.jpg', photoUrl: '/p.jpg', hasOverride: true },
        });

      expect(result.data.hasPhoto).toBe(true);
      expect(result.data.hasOverride).toBe(true);
      expect(result.data.photoThumbUrl).toBe('/t.jpg');
    });
  });

  // ============================================================================
  // resetPersonPhoto
  // ============================================================================
  describe('resetPersonPhoto', () => {
    it('PATCH kérést küld photo_id: null-al', () => {
      service.resetPersonPhoto(10, 5).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/5/override-photo`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ photo_id: null });
      req.flush({
        success: true, message: 'Fotó visszaállítva',
        data: { id: 5, hasPhoto: false, photoThumbUrl: null, photoUrl: null, hasOverride: false },
      });
    });

    it('visszaadja a visszaállított adatokat', () => {
      let result: any;
      service.resetPersonPhoto(10, 5).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5/override-photo`)
        .flush({
          success: true, message: '',
          data: { id: 5, hasPhoto: false, photoThumbUrl: null, photoUrl: null, hasOverride: false },
        });

      expect(result.data.hasOverride).toBe(false);
      expect(result.data.photoUrl).toBeNull();
    });
  });

  // ============================================================================
  // updateExtraNames
  // ============================================================================
  describe('updateExtraNames', () => {
    it('PATCH kérést küld a helyes URL-re', () => {
      const data = { students: 'Anna, Béla', teachers: 'Kiss János' };
      service.updateExtraNames(10, data).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/extra-names`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(data);
      req.flush({ success: true, message: '', data: { extraNames: data } });
    });

    it('visszaadja az extra neveket', () => {
      let result: any;
      const inputData = { students: 'Csaba', teachers: '' };
      service.updateExtraNames(10, inputData).subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/extra-names`)
        .flush({ success: true, message: '', data: { extraNames: inputData } });

      expect(result.data.extraNames.students).toBe('Csaba');
      expect(result.data.extraNames.teachers).toBe('');
    });
  });

  // ============================================================================
  // addPersons
  // ============================================================================
  describe('addPersons', () => {
    it('POST kérést küld diák hozzáadáshoz', () => {
      service.addPersons(10, 'Anna\nBéla', 'student').subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/add`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ names: 'Anna\nBéla', type: 'student' });
      req.flush({
        success: true, message: '2 személy hozzáadva',
        data: { created: [], duplicates: [], archiveMatches: 0 },
      });
    });

    it('POST kérést küld tanár hozzáadáshoz', () => {
      service.addPersons(10, 'Kiss János', 'teacher').subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/projects/10/persons/add`);
      expect(req.request.body.type).toBe('teacher');
      req.flush({ success: true, message: '', data: { created: [], duplicates: [], archiveMatches: 0 } });
    });

    it('visszaadja a létrehozott személyeket és duplikátumokat', () => {
      let result: any;
      service.addPersons(10, 'Anna\nAnna\nBéla', 'student').subscribe(r => result = r);

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/add`)
        .flush({
          success: true,
          message: '2 személy hozzáadva',
          data: {
            created: [
              { id: 1, name: 'Anna', type: 'student', archiveLinked: false, hasPhoto: false },
              { id: 2, name: 'Béla', type: 'student', archiveLinked: true, hasPhoto: true },
            ],
            duplicates: ['Anna'],
            archiveMatches: 1,
          },
        });

      expect(result.data.created).toHaveLength(2);
      expect(result.data.duplicates).toEqual(['Anna']);
      expect(result.data.archiveMatches).toBe(1);
    });
  });

  // ============================================================================
  // HTTP hibakezelés
  // ============================================================================
  describe('HTTP hibakezelés', () => {
    it('updatePerson hibát dob 404-nél', () => {
      let error: any;
      service.updatePerson(10, 999, { name: 'Teszt' }).subscribe({
        error: (e) => error = e,
      });

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/999`)
        .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(error.status).toBe(404);
    });

    it('deletePerson hibát dob 403-nál', () => {
      let error: any;
      service.deletePerson(10, 5).subscribe({ error: (e) => error = e });

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5`)
        .flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(error.status).toBe(403);
    });

    it('addPersons hibát dob 422-nél (validációs hiba)', () => {
      let error: any;
      service.addPersons(10, '', 'student').subscribe({ error: (e) => error = e });

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/add`)
        .flush({ message: 'Validation error', errors: { names: ['Kötelező mező'] } }, { status: 422, statusText: 'Unprocessable Entity' });

      expect(error.status).toBe(422);
    });

    it('ensurePersonArchive hibát dob 500-nál', () => {
      let error: any;
      service.ensurePersonArchive(10, 5).subscribe({ error: (e) => error = e });

      httpTesting.expectOne(`${baseUrl}/projects/10/persons/5/ensure-archive`)
        .flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(error.status).toBe(500);
    });
  });

  // ============================================================================
  // URL struktúra validáció
  // ============================================================================
  describe('URL struktúra', () => {
    it('különböző projectId-kkal helyes URL-t generál', () => {
      service.deletePerson(1, 1).subscribe();
      httpTesting.expectOne(`${baseUrl}/projects/1/persons/1`).flush({ success: true, message: '', data: { id: 1 } });

      service.deletePerson(999, 888).subscribe();
      httpTesting.expectOne(`${baseUrl}/projects/999/persons/888`).flush({ success: true, message: '', data: { id: 888 } });
    });
  });
});
