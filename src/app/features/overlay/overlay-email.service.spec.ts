import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OverlayEmailService } from './overlay-email.service';
import { OverlayProjectService, ProjectMeta } from './overlay-project.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';

describe('OverlayEmailService', () => {
  let service: OverlayEmailService;
  let httpMock: HttpTestingController;
  let projectServiceMock: {
    fetchProjectMeta: ReturnType<typeof vi.fn>;
  };
  let loggerMock: { error: ReturnType<typeof vi.fn>; debug: ReturnType<typeof vi.fn> };

  const mockMeta: ProjectMeta = {
    schoolName: 'Teszt Iskola',
    className: '12.A',
    contactName: 'Kiss János',
    contactEmail: 'kiss@test.hu',
    partnerName: 'Fotós Béla',
    partnerCompany: 'FotóStúdió Kft.',
    partnerEmail: 'bela@foto.hu',
    partnerPhone: '+36301234567',
  };

  const overlayTemplates = [
    { name: 'tablo_sample_ready', display_name: 'Minta kész', subject: 'Minta kész - {school_name}', category: 'tablo' },
    { name: 'tablo_modifications_done', display_name: 'Módosítás kész', subject: 'Módosítás - {class_name}', category: 'tablo' },
  ];

  const allTemplates = [
    ...overlayTemplates,
    { name: 'unrelated_template', display_name: 'Más', subject: 'Más', category: 'other' },
  ];

  /**
   * openPanel helper: elindítja az openPanel-t és flush-olja az összes szükséges HTTP kérést.
   * Az openPanel Promise.all-t használ + a ngZone.run callback-ben selectTemplate-et hív,
   * ami szintén HTTP-t csinál. Mivel a firstValueFrom a HTTP válaszra vár, a requesteket
   * a microtask ütemezés előtt kell flusholni.
   */
  async function openPanelAndFlush(
    projectId: number,
    templates: Array<{ name: string; display_name: string; subject: string; category: string }>,
    templateDetail: { name: string; subject: string; body: string },
  ): Promise<void> {
    const openPromise = service.openPanel(projectId);

    // A Promise.all-ban lévő firstValueFrom(http.get) kérés
    // Kis delay hogy a request kimenjen
    await Promise.resolve();
    const templatesReq = httpMock.expectOne(`${environment.apiUrl}/partner/email-templates`);
    templatesReq.flush({ data: templates });

    // Microtask-ok: a ngZone.run callback-ben selectTemplate hív firstValueFrom-ot
    await Promise.resolve();
    await Promise.resolve();

    // selectTemplate HTTP kérés flusholása — match-eljük ami van
    const detailReqs = httpMock.match(req =>
      req.method === 'GET' && req.url.startsWith(`${environment.apiUrl}/partner/email-templates/`)
      && req.url !== `${environment.apiUrl}/partner/email-templates`
    );
    detailReqs.forEach(r => r.flush({ data: { ...templateDetail, available_variables: [] } }));

    await openPromise;
  }

  beforeEach(() => {
    projectServiceMock = {
      fetchProjectMeta: vi.fn().mockResolvedValue(mockMeta),
    };

    loggerMock = {
      error: vi.fn(),
      debug: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OverlayEmailService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OverlayProjectService, useValue: projectServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(OverlayEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Cleanup: cancel any pending requests
    httpMock.match(() => true);
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('Kezdeti állapot', () => {
    it('panelOpen alapértéke false', () => {
      expect(service.panelOpen()).toBe(false);
    });

    it('loading alapértéke false', () => {
      expect(service.loading()).toBe(false);
    });

    it('templates üres tömb', () => {
      expect(service.templates()).toEqual([]);
    });

    it('selectedTemplateName null', () => {
      expect(service.selectedTemplateName()).toBeNull();
    });

    it('resolvedSubject üres string', () => {
      expect(service.resolvedSubject()).toBe('');
    });

    it('resolvedBodyHtml üres string', () => {
      expect(service.resolvedBodyHtml()).toBe('');
    });

    it('hasTemplates false ha nincs template', () => {
      expect(service.hasTemplates()).toBe(false);
    });

    it('copyFeedback null', () => {
      expect(service.copyFeedback()).toBeNull();
    });
  });

  // ============================================================================
  // openPanel
  // ============================================================================
  describe('openPanel', () => {
    it('nem csinál semmit ha projectId null', async () => {
      await service.openPanel(null);
      expect(service.panelOpen()).toBe(false);
      expect(projectServiceMock.fetchProjectMeta).not.toHaveBeenCalled();
      httpMock.verify();
    });

    it('megnyitja a panelt és loading-ot beállítja', async () => {
      await openPanelAndFlush(42, allTemplates, {
        name: 'tablo_sample_ready', subject: 'Minta kész', body: '<p>Body</p>',
      });

      expect(service.panelOpen()).toBe(true);
      expect(service.loading()).toBe(false);
      expect(service.templates().length).toBe(2);
      httpMock.verify();
    });

    it('csak overlay sablonokat szűri ki (unrelated kihagyva)', async () => {
      await openPanelAndFlush(42, allTemplates, {
        name: 'tablo_sample_ready', subject: 'X', body: '',
      });

      const names = service.templates().map(t => t.name);
      expect(names).toContain('tablo_sample_ready');
      expect(names).toContain('tablo_modifications_done');
      expect(names).not.toContain('unrelated_template');
      httpMock.verify();
    });

    it('beállítja a contactName és contactEmail mezőket meta-ból', async () => {
      await openPanelAndFlush(42, allTemplates, {
        name: 'tablo_sample_ready', subject: 'X', body: '',
      });

      expect(service.contactName()).toBe('Kiss János');
      expect(service.contactEmail()).toBe('kiss@test.hu');
      httpMock.verify();
    });

    it('ha nincs tablo_sample_ready, az első sablont választja ki', async () => {
      const nonDefaultTemplates = [
        { name: 'tablo_modifications_done', display_name: 'Módosítás', subject: 'Mod', category: 'tablo' },
      ];

      await openPanelAndFlush(42, nonDefaultTemplates, {
        name: 'tablo_modifications_done', subject: 'Mod', body: '',
      });

      expect(service.selectedTemplateName()).toBe('tablo_modifications_done');
      httpMock.verify();
    });

    it('hiba esetén loading false-ra áll', async () => {
      projectServiceMock.fetchProjectMeta.mockRejectedValue(new Error('fail'));

      await service.openPanel(42);

      expect(service.loading()).toBe(false);
      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('üres sablonlista esetén nem hív selectTemplate-t', async () => {
      await openPanelAndFlush(42, [], { name: '', subject: '', body: '' });

      expect(service.selectedTemplateName()).toBeNull();
      expect(service.templates()).toEqual([]);
      httpMock.verify();
    });
  });

  // ============================================================================
  // selectTemplate
  // ============================================================================
  describe('selectTemplate', () => {
    it('beállítja a selectedTemplateName-t és tölti be a sablont', async () => {
      const promise = service.selectTemplate('tablo_sample_ready');

      await Promise.resolve();
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/email-templates/tablo_sample_ready`);
      req.flush({ data: { name: 'tablo_sample_ready', subject: 'Teszt subject', body: '<p>Teszt body</p>', available_variables: [] } });

      await promise;

      expect(service.selectedTemplateName()).toBe('tablo_sample_ready');
      expect(service.resolvedSubject()).toBe('Teszt subject');
      expect(service.resolvedBodyHtml()).toBe('<p>Teszt body</p>');
      httpMock.verify();
    });

    it('placeholder-eket lecseréli a meta adatok alapján', async () => {
      // Először openPanel-lel betöltjük a meta-t
      await openPanelAndFlush(42, overlayTemplates, {
        name: 'tablo_sample_ready',
        subject: '{school_name} - {class_name}',
        body: '<p>Kedves {contact_name}!</p><p>Partner: {partner_name}</p>',
      });

      expect(service.resolvedSubject()).toBe('Teszt Iskola - 12.A');
      expect(service.resolvedBodyHtml()).toContain('Kedves Kiss János!');
      expect(service.resolvedBodyHtml()).toContain('Partner: Fotós Béla');
      httpMock.verify();
    });

    it('hiba esetén logol', async () => {
      const promise = service.selectTemplate('bad_template');

      await Promise.resolve();
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/email-templates/bad_template`);
      req.error(new ProgressEvent('error'));

      await promise;

      expect(loggerMock.error).toHaveBeenCalled();
      httpMock.verify();
    });
  });

  // ============================================================================
  // closePanel
  // ============================================================================
  describe('closePanel', () => {
    it('visszaállítja az összes állapotot', () => {
      service.panelOpen.set(true);
      service.selectedTemplateName.set('test');
      service.resolvedSubject.set('subject');
      service.resolvedBodyHtml.set('<p>body</p>');
      service.templates.set([{ name: 'x', display_name: 'x', subject: 'x', category: 'x' }]);

      service.closePanel();

      expect(service.panelOpen()).toBe(false);
      expect(service.selectedTemplateName()).toBeNull();
      expect(service.resolvedSubject()).toBe('');
      expect(service.resolvedBodyHtml()).toBe('');
      expect(service.templates()).toEqual([]);
    });
  });

  // ============================================================================
  // copyText
  // ============================================================================
  describe('copyText', () => {
    it('szöveget vágólapra másolja és feedback-et mutat', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText: writeTextMock, write: vi.fn() } });

      await service.copyText('test text', 'Címzett');

      expect(writeTextMock).toHaveBeenCalledWith('test text');
      expect(service.copyFeedback()).toBe('Címzett');
    });

    it('clipboard hiba esetén logol', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, { clipboard: { writeText: writeTextMock, write: vi.fn() } });

      await service.copyText('test', 'Label');

      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // copyHtml
  // ============================================================================
  describe('copyHtml', () => {
    it('HTML-t rich text-ként vágólapra másolja', async () => {
      const writeMock = vi.fn().mockResolvedValue(undefined);
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { write: writeMock, writeText: writeTextMock } });

      const originalClipboardItem = globalThis.ClipboardItem;
      globalThis.ClipboardItem = class MockClipboardItem {
        constructor(public data: Record<string, Blob>) {}
      } as any;

      await service.copyHtml('<p>Teszt szöveg</p>', 'Body');

      expect(writeMock).toHaveBeenCalled();
      expect(service.copyFeedback()).toBe('Body');

      if (originalClipboardItem) {
        globalThis.ClipboardItem = originalClipboardItem;
      }
    });

    it('fallback-ként plain text-et másol ha a rich copy nem sikerül', async () => {
      const writeMock = vi.fn().mockRejectedValue(new Error('Rich copy fail'));
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { write: writeMock, writeText: writeTextMock } });

      const originalClipboardItem = globalThis.ClipboardItem;
      globalThis.ClipboardItem = class MockClipboardItem {
        constructor(public data: Record<string, Blob>) {}
      } as any;

      await service.copyHtml('<p>Teszt</p>', 'Body');

      expect(writeTextMock).toHaveBeenCalledWith('Teszt');
      expect(loggerMock.error).toHaveBeenCalled();

      if (originalClipboardItem) {
        globalThis.ClipboardItem = originalClipboardItem;
      }
    });
  });

  // ============================================================================
  // hasTemplates computed
  // ============================================================================
  describe('hasTemplates computed', () => {
    it('true ha van template', () => {
      service.templates.set([{ name: 'x', display_name: 'x', subject: 'x', category: 'x' }]);
      expect(service.hasTemplates()).toBe(true);
    });

    it('false ha üres a templates lista', () => {
      service.templates.set([]);
      expect(service.hasTemplates()).toBe(false);
    });
  });
});
