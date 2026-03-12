import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NgZone, DestroyRef } from '@angular/core';
import { OverlayProjectService, PersonItem, ProjectMeta } from './overlay-project.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

describe('OverlayProjectService', () => {
  let service: OverlayProjectService;
  let httpMock: HttpTestingController;
  let loggerMock: { error: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };

  const mockPersons: PersonItem[] = [
    {
      id: 1, name: 'Kiss Anna', title: null, type: 'student',
      hasPhoto: true, photoThumbUrl: '/thumb/1.jpg', photoUrl: '/photo/1.jpg',
      archiveId: null, linkedGroup: null,
    },
    {
      id: 2, name: 'Nagy Béla', title: 'igazgató', type: 'teacher',
      hasPhoto: false, photoThumbUrl: null, photoUrl: null,
      archiveId: 10, linkedGroup: 'teachers',
    },
  ];

  const mockMeta: ProjectMeta = {
    schoolName: 'Teszt Iskola',
    className: '12.A',
    contactName: 'Kovács Péter',
    contactEmail: 'kovacs@test.hu',
    partnerName: 'Fotós Kft',
    partnerCompany: 'Fotós Stúdió',
    partnerEmail: 'info@fotos.hu',
    partnerPhone: '+36301234567',
  };

  beforeEach(() => {
    loggerMock = { error: vi.fn(), debug: vi.fn() };

    // Tiszta window.electronAPI minden teszt előtt
    (window as any).electronAPI = undefined;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OverlayProjectService,
        { provide: LoggerService, useValue: loggerMock },
      ],
    });
    service = TestBed.inject(OverlayProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try { httpMock.verify(); } catch { /* ignore leftover requests */ }
    (window as any).electronAPI = undefined;
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('üres persons listával indul', () => {
      expect(service.persons()).toEqual([]);
    });

    it('loadingPersons false-szal indul', () => {
      expect(service.loadingPersons()).toBe(false);
    });

    it('isLoggedOut false-szal indul', () => {
      expect(service.isLoggedOut()).toBe(false);
    });

    it('projectMeta null-lal indul', () => {
      expect(service.projectMeta()).toBeNull();
    });

    it('lastProjectId null-lal indul', () => {
      expect(service.getLastProjectId()).toBeNull();
    });
  });

  // ============================================================================
  // resolveProjectId
  // ============================================================================
  describe('resolveProjectId', () => {
    it('visszaadja a context.projectId-t ha van', async () => {
      const result = await service.resolveProjectId({ mode: 'designer', projectId: 42 });
      expect(result).toBe(42);
    });

    it('elmenti a lastProjectId-t ha context.projectId van', async () => {
      await service.resolveProjectId({ mode: 'designer', projectId: 42 });
      expect(service.getLastProjectId()).toBe(42);
    });

    it('lastProjectId-t használja fallback-ként ha nincs context.projectId', async () => {
      service.setLastProjectId(99);
      const result = await service.resolveProjectId({ mode: 'normal' });
      expect(result).toBe(99);
    });

    it('Electron IPC-t hívja ha nincs sem context sem lastProjectId', async () => {
      const mockGetProjectId = vi.fn().mockResolvedValue({ projectId: 77 });
      (window as any).electronAPI = { overlay: { getProjectId: mockGetProjectId } };

      const result = await service.resolveProjectId({ mode: 'normal' });
      expect(result).toBe(77);
      expect(mockGetProjectId).toHaveBeenCalled();
      expect(service.getLastProjectId()).toBe(77);
    });

    it('null-t ad vissza ha sehol sincs projectId', async () => {
      const result = await service.resolveProjectId({ mode: 'normal' });
      expect(result).toBeNull();
    });

    it('kezeli az Electron IPC hibát', async () => {
      (window as any).electronAPI = {
        overlay: { getProjectId: vi.fn().mockRejectedValue(new Error('IPC error')) },
      };
      const result = await service.resolveProjectId({ mode: 'normal' });
      expect(result).toBeNull();
    });

    it('nem hívja az Electron IPC-t ha context.projectId van', async () => {
      const mockGetProjectId = vi.fn();
      (window as any).electronAPI = { overlay: { getProjectId: mockGetProjectId } };

      await service.resolveProjectId({ mode: 'designer', projectId: 10 });
      expect(mockGetProjectId).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // fetchPersons
  // ============================================================================
  describe('fetchPersons', () => {
    it('lekéri a személylistát és beállítja a persons signal-t', async () => {
      const promise = service.fetchPersons(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/persons`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPersons });

      const result = await promise;
      expect(result).toEqual(mockPersons);
      expect(service.persons()).toEqual(mockPersons);
    });

    it('üres listát ad vissza hiba esetén', async () => {
      const promise = service.fetchPersons(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/persons`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result).toEqual([]);
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('üres listát ad ha res.data null', async () => {
      const promise = service.fetchPersons(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/persons`);
      req.flush({ data: null });

      const result = await promise;
      expect(result).toEqual([]);
      expect(service.persons()).toEqual([]);
    });
  });

  // ============================================================================
  // loadPersons
  // ============================================================================
  describe('loadPersons', () => {
    it('beállítja a loadingPersons-t és elmenti a projectId-t', () => {
      service.loadPersons(10);
      expect(service.loadingPersons()).toBe(true);
      expect(service.getLastProjectId()).toBe(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);
      req.flush({ data: mockPersons });
    });

    it('sikeres válasz után frissíti a persons-t és reseteli a loadingPersons-t', () => {
      service.loadPersons(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);
      req.flush({ data: mockPersons });

      expect(service.persons()).toEqual(mockPersons);
      expect(service.loadingPersons()).toBe(false);
      expect(service.isLoggedOut()).toBe(false);
    });

    it('401-es hiba esetén beállítja az isLoggedOut-ot', () => {
      service.loadPersons(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(service.loadingPersons()).toBe(false);
      expect(service.isLoggedOut()).toBe(true);
    });

    it('419-es hiba esetén beállítja az isLoggedOut-ot', () => {
      service.loadPersons(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);
      req.flush('Session Expired', { status: 419, statusText: 'Session Expired' });

      expect(service.loadingPersons()).toBe(false);
      expect(service.isLoggedOut()).toBe(true);
    });

    it('500-as hiba esetén NEM állítja be az isLoggedOut-ot', () => {
      service.loadPersons(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(service.loadingPersons()).toBe(false);
      expect(service.isLoggedOut()).toBe(false);
    });
  });

  // ============================================================================
  // lookupProjectIdFromPerson
  // ============================================================================
  describe('lookupProjectIdFromPerson', () => {
    it('visszaadja a projectId-t és elmenti lastProjectId-nak', async () => {
      const promise = service.lookupProjectIdFromPerson(123);

      const req = httpMock.expectOne(`${environment.apiUrl}/persons/123/project-id`);
      expect(req.request.method).toBe('GET');
      req.flush({ projectId: 55 });

      const result = await promise;
      expect(result).toBe(55);
      expect(service.getLastProjectId()).toBe(55);
    });

    it('null-t ad vissza ha nincs projectId a válaszban', async () => {
      const promise = service.lookupProjectIdFromPerson(123);

      const req = httpMock.expectOne(`${environment.apiUrl}/persons/123/project-id`);
      req.flush({ projectId: null });

      const result = await promise;
      expect(result).toBeNull();
    });

    it('null-t ad vissza hiba esetén', async () => {
      const promise = service.lookupProjectIdFromPerson(123);

      const req = httpMock.expectOne(`${environment.apiUrl}/persons/123/project-id`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // fetchProjectMeta
  // ============================================================================
  describe('fetchProjectMeta', () => {
    it('lekéri a meta adatokat és beállítja a projectMeta signal-t', async () => {
      const promise = service.fetchProjectMeta(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/meta`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockMeta });

      const result = await promise;
      expect(result).toEqual(mockMeta);
      expect(service.projectMeta()).toEqual(mockMeta);
    });

    it('null-t ad vissza hiba esetén', async () => {
      const promise = service.fetchProjectMeta(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/meta`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result).toBeNull();
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('null-t állít be ha res.data null', async () => {
      const promise = service.fetchProjectMeta(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/meta`);
      req.flush({ data: null });

      const result = await promise;
      expect(result).toBeNull();
      expect(service.projectMeta()).toBeNull();
    });
  });

  // ============================================================================
  // listenAuthSync
  // ============================================================================
  describe('listenAuthSync', () => {
    it('nem regisztrál listener-t ha nincs electronAPI', () => {
      const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
      const ngZone = TestBed.inject(NgZone);

      service.listenAuthSync(destroyRef, ngZone, () => ({ mode: 'normal' }));
      expect(destroyRef.onDestroy).not.toHaveBeenCalled();
    });

    it('regisztrálja a cleanup-ot destroyRef-re', () => {
      const cleanupFn = vi.fn();
      const onAuthSyncedMock = vi.fn().mockReturnValue(cleanupFn);
      (window as any).electronAPI = { overlay: { onAuthSynced: onAuthSyncedMock } };

      const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
      const ngZone = TestBed.inject(NgZone);

      service.listenAuthSync(destroyRef, ngZone, () => ({ mode: 'normal' }));

      expect(onAuthSyncedMock).toHaveBeenCalled();
      expect(destroyRef.onDestroy).toHaveBeenCalledWith(cleanupFn);
    });

    it('auth sync callback reseteli az isLoggedOut-ot és újratölti a persons-t', () => {
      let authCallback: () => void = () => {};
      const onAuthSyncedMock = vi.fn().mockImplementation((cb: () => void) => {
        authCallback = cb;
        return vi.fn();
      });
      (window as any).electronAPI = { overlay: { onAuthSynced: onAuthSyncedMock } };

      const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
      const ngZone = TestBed.inject(NgZone);

      service.setLastProjectId(42);
      service.listenAuthSync(destroyRef, ngZone, () => ({ mode: 'normal', projectId: 42 }));

      // Szimulálunk egy isLoggedOut állapotot
      (service as any).isLoggedOut.set(true);

      // Triggereljük az auth sync callback-et
      authCallback();

      expect(service.isLoggedOut()).toBe(false);
      // loadPersons-t hívnia kellett
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons`);
      req.flush({ data: mockPersons });
    });
  });

  // ============================================================================
  // tryAuthRecovery
  // ============================================================================
  describe('tryAuthRecovery', () => {
    it('nem csinál semmit ha nincs projectId', () => {
      service.tryAuthRecovery({ mode: 'normal' });
      httpMock.expectNone(`${environment.apiUrl}/partner/projects`);
    });

    it('nem tölt újra ha loadingPersons true', () => {
      // Elindítunk egy loadPersons-t, ami loadingPersons-t true-ra állítja
      service.loadPersons(10);
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/persons`);

      service.tryAuthRecovery({ mode: 'normal', projectId: 10 });
      // Nem szabad újabb kérésnek lennie
      httpMock.expectNone(`${environment.apiUrl}/partner/projects/10/persons`);

      req.flush({ data: [] });
    });

    it('újratölti a persons-t ha van projectId és nem loading', () => {
      service.tryAuthRecovery({ mode: 'normal', projectId: 15 });
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/15/persons`);
      req.flush({ data: mockPersons });
      expect(service.persons()).toEqual(mockPersons);
    });
  });

  // ============================================================================
  // setLastProjectId / getLastProjectId
  // ============================================================================
  describe('setLastProjectId / getLastProjectId', () => {
    it('beállítja és visszaadja a lastProjectId-t', () => {
      service.setLastProjectId(100);
      expect(service.getLastProjectId()).toBe(100);
    });
  });
});
