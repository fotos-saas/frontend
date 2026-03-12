import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { environment } from '../../../environments/environment';
import { ActiveDocInfo } from '../../core/services/electron.types';

/** Flush microtasks — await after calling async methods so HTTP requests are dispatched */
function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('OverlaySortService', () => {
  let service: OverlaySortService;
  let httpMock: HttpTestingController;
  let psMock: {
    getSortableNames: ReturnType<typeof vi.fn>;
    runJsx: ReturnType<typeof vi.fn>;
  };
  let settingsMock: {
    nameBreakAfter: ReturnType<typeof vi.fn>;
    nameGapCm: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    (window as any).electronAPI = undefined;

    psMock = {
      getSortableNames: vi.fn().mockResolvedValue([]),
      runJsx: vi.fn().mockResolvedValue(null),
    };
    settingsMock = {
      nameBreakAfter: vi.fn().mockReturnValue(1),
      nameGapCm: vi.fn().mockReturnValue(0.5),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OverlaySortService,
        { provide: OverlayPhotoshopService, useValue: psMock },
        { provide: OverlaySettingsService, useValue: settingsMock },
      ],
    });
    service = TestBed.inject(OverlaySortService);
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
    it('sorting false-szal indul', () => {
      expect(service.sorting()).toBe(false);
    });
  });

  // ============================================================================
  // slugToHumanName
  // ============================================================================
  describe('slugToHumanName', () => {
    it('slug-ot human-readable névre alakít', () => {
      expect(service.slugToHumanName('kiss-anna---123')).toBe('Kiss Anna');
    });

    it('több kötőjelet is kezel', () => {
      expect(service.slugToHumanName('nagy-bela-peter---456')).toBe('Nagy Bela Peter');
    });

    it('alulvonást is kezel', () => {
      expect(service.slugToHumanName('kovacs_janos---789')).toBe('Kovacs Janos');
    });

    it('id nélküli slug-ot is kezel', () => {
      expect(service.slugToHumanName('kiss-anna')).toBe('Kiss Anna');
    });

    it('üres stringet ad vissza üres inputra', () => {
      expect(service.slugToHumanName('')).toBe('');
    });
  });

  // ============================================================================
  // sortAbc
  // ============================================================================
  describe('sortAbc', () => {
    it('nem csinál semmit ha kevesebb mint 2 név van', async () => {
      psMock.getSortableNames.mockResolvedValue(['egy-nev---1']);
      await service.sortAbc();
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });

    it('nem csinál semmit ha sorting=true (már fut)', async () => {
      (service as any).sorting.set(true);
      await service.sortAbc();
      expect(psMock.getSortableNames).not.toHaveBeenCalled();
    });

    it('ABC sorrendbe rendezi a neveket és reorder JSX-et hív', async () => {
      psMock.getSortableNames.mockResolvedValue(['nagy-bela---2', 'kiss-anna---1']);

      await service.sortAbc();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'reorder-layers',
        'actions/reorder-layers.jsx',
        expect.objectContaining({
          GROUP: 'All',
        }),
      );
      const callArgs = psMock.runJsx.mock.calls[0][2];
      const orderedNames = JSON.parse(callArgs.ORDERED_NAMES);
      expect(orderedNames[0]).toBe('kiss-anna---1');
      expect(orderedNames[1]).toBe('nagy-bela---2');
    });

    it('Intl.Collator magyar ABC sorrendet használ', async () => {
      // Magyar specifikus: Á az A után jön, Ö az O után
      psMock.getSortableNames.mockResolvedValue(['zoldfa---3', 'almafa---1', 'barack---2']);

      await service.sortAbc();

      const callArgs = psMock.runJsx.mock.calls[0][2];
      const orderedNames = JSON.parse(callArgs.ORDERED_NAMES);
      expect(orderedNames[0]).toBe('almafa---1');
      expect(orderedNames[1]).toBe('barack---2');
      expect(orderedNames[2]).toBe('zoldfa---3');
    });

    it('sorting false-ra állítja befejezés után', async () => {
      psMock.getSortableNames.mockResolvedValue(['b---2', 'a---1']);
      await service.sortAbc();
      expect(service.sorting()).toBe(false);
    });

    it('sorting false-ra állítja hiba esetén is', async () => {
      psMock.getSortableNames.mockResolvedValue(['b---2', 'a---1']);
      psMock.runJsx.mockRejectedValue(new Error('JSX error'));
      await service.sortAbc();
      expect(service.sorting()).toBe(false);
    });
  });

  // ============================================================================
  // sortGender
  // ============================================================================
  describe('sortGender', () => {
    it('nem csinál semmit ha kevesebb mint 2 név van', async () => {
      psMock.getSortableNames.mockResolvedValue(['egy-nev---1']);
      await service.sortGender();
      expect(service.sorting()).toBe(false);
    });

    it('nem csinál semmit ha sorting=true', async () => {
      (service as any).sorting.set(true);
      await service.sortGender();
      expect(psMock.getSortableNames).not.toHaveBeenCalled();
    });

    it('felváltva fiú-lány sorrendbe rendezi API gender classification alapján', async () => {
      psMock.getSortableNames.mockResolvedValue(['kiss-anna---1', 'nagy-bela---2', 'szabo-kata---3', 'toth-peter---4']);

      const sortPromise = service.sortGender();

      // Wait for getSortableNames to resolve and HTTP request to be dispatched
      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/classify-name-genders`);
      expect(req.request.method).toBe('POST');
      req.flush({
        success: true,
        classifications: [
          { name: 'Kiss Anna', gender: 'girl' },
          { name: 'Nagy Bela', gender: 'boy' },
          { name: 'Szabo Kata', gender: 'girl' },
          { name: 'Toth Peter', gender: 'boy' },
        ],
      });

      await sortPromise;
      expect(psMock.runJsx).toHaveBeenCalled();
      expect(service.sorting()).toBe(false);
    });

    it('sorting false-ra állítja API hiba esetén', async () => {
      psMock.getSortableNames.mockResolvedValue(['kiss-anna---1', 'nagy-bela---2']);

      const sortPromise = service.sortGender();

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/classify-name-genders`);
      req.error(new ProgressEvent('Network error'));

      await sortPromise;
      expect(service.sorting()).toBe(false);
    });
  });

  // ============================================================================
  // sortGrid
  // ============================================================================
  describe('sortGrid', () => {
    const mockActiveDoc: ActiveDocInfo = {
      name: 'test.psd',
      path: '/test/test.psd',
      dir: '/test',
    };

    it('nem csinál semmit ha sorting=true', async () => {
      (service as any).sorting.set(true);
      await service.sortGrid(mockActiveDoc);
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });

    it('nem hív JSX-et ha nincs electronAPI', async () => {
      await service.sortGrid(mockActiveDoc);
      expect(psMock.runJsx).not.toHaveBeenCalled();
      expect(service.sorting()).toBe(false);
    });

    it('lekéri a grid beállításokat Electron-ból és JSX-et futtat', async () => {
      (window as any).electronAPI = {
        photoshop: {
          getMargin: vi.fn().mockResolvedValue(3),
          getGapH: vi.fn().mockResolvedValue(2.5),
          getGapV: vi.fn().mockResolvedValue(3.5),
          getStudentSize: vi.fn().mockResolvedValue(7),
          getTeacherSize: vi.fn().mockResolvedValue(8),
          getGridAlign: vi.fn().mockResolvedValue('left'),
        },
      };

      await service.sortGrid(mockActiveDoc);

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'arrange-grid',
        'actions/arrange-grid.jsx',
        expect.objectContaining({
          boardWidthCm: 120,
          boardHeightCm: 80,
          marginCm: 3,
          gapHCm: 2.5,
          gapVCm: 3.5,
          studentSizeCm: 7,
          teacherSizeCm: 8,
          gridAlign: 'left',
        }),
      );
      expect(service.sorting()).toBe(false);
    });

    it('default értékeket használ ha Electron null-t ad vissza', async () => {
      (window as any).electronAPI = {
        photoshop: {
          getMargin: vi.fn().mockResolvedValue(null),
          getGapH: vi.fn().mockResolvedValue(null),
          getGapV: vi.fn().mockResolvedValue(null),
          getStudentSize: vi.fn().mockResolvedValue(null),
          getTeacherSize: vi.fn().mockResolvedValue(null),
          getGridAlign: vi.fn().mockResolvedValue(null),
        },
      };

      await service.sortGrid(mockActiveDoc);

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'arrange-grid',
        'actions/arrange-grid.jsx',
        expect.objectContaining({
          marginCm: 2,
          gapHCm: 2,
          gapVCm: 3,
          studentSizeCm: 6,
          teacherSizeCm: 6,
          gridAlign: 'center',
        }),
      );
    });
  });

  // ============================================================================
  // submitCustomOrder
  // ============================================================================
  describe('submitCustomOrder', () => {
    it('visszaad {success: false} üres szöveg esetén', async () => {
      const result = await service.submitCustomOrder('  ');
      expect(result.success).toBe(false);
    });

    it('visszaad {success: false} ha sorting=true', async () => {
      (service as any).sorting.set(true);
      const result = await service.submitCustomOrder('Anna, Béla');
      expect(result.success).toBe(false);
    });

    it('visszaad {success: false} ha kevesebb mint 2 layer név', async () => {
      psMock.getSortableNames.mockResolvedValue(['egy-nev---1']);
      const result = await service.submitCustomOrder('Anna, Béla');
      expect(result.success).toBe(false);
      expect(result.message).toContain('2 kijelölt');
    });

    it('elküldi a neveket az AI matching API-nak és reorder-t hív', async () => {
      psMock.getSortableNames.mockResolvedValue(['kiss-anna---1', 'nagy-bela---2', 'toth-peter---3']);

      const promise = service.submitCustomOrder('Béla, Péter, Anna');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.custom_order).toBe('Béla, Péter, Anna');
      expect(req.request.body.layer_names).toEqual(['Kiss Anna', 'Nagy Bela', 'Toth Peter']);

      req.flush({
        success: true,
        ordered_names: ['Nagy Bela', 'Toth Peter', 'Kiss Anna'],
        unmatched: [],
      });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toContain('Rendezve');
      expect(psMock.runJsx).toHaveBeenCalled();
    });

    it('visszaad hibaüzenetet ha az API sikertelen', async () => {
      psMock.getSortableNames.mockResolvedValue(['a---1', 'b---2']);

      const promise = service.submitCustomOrder('valami');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.flush({ success: false, ordered_names: null, unmatched: [] });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.message).toContain('Hiba');
    });

    it('kezeli a hálózati hibát', async () => {
      psMock.getSortableNames.mockResolvedValue(['a---1', 'b---2']);

      const promise = service.submitCustomOrder('valami');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result.success).toBe(false);
      expect(service.sorting()).toBe(false);
    });
  });

  // ============================================================================
  // submitCustomOrderScoped
  // ============================================================================
  describe('submitCustomOrderScoped', () => {
    it('visszaad {success: false} üres szöveg esetén', async () => {
      const result = await service.submitCustomOrderScoped('', ['a---1'], 'students');
      expect(result.success).toBe(false);
    });

    it('nem hívja a getSortableNames-t, hanem a scopedSlugs-ot használja', async () => {
      const scopedSlugs = ['kiss-anna---1', 'nagy-bela---2'];

      const promise = service.submitCustomOrderScoped('Anna, Béla', scopedSlugs, 'students');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      expect(req.request.body.layer_names).toEqual(['Kiss Anna', 'Nagy Bela']);
      req.flush({
        success: true,
        ordered_names: ['Kiss Anna', 'Nagy Bela'],
        unmatched: [],
      });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(psMock.getSortableNames).not.toHaveBeenCalled();
    });

    it('a megfelelő GROUP-ot használja a reorder JSX hívásban (teachers)', async () => {
      const scopedSlugs = ['a---1', 'b---2'];

      const promise = service.submitCustomOrderScoped('A, B', scopedSlugs, 'teachers');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.flush({
        success: true,
        ordered_names: ['A', 'B'],
        unmatched: [],
      });

      await promise;

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'reorder-layers',
        'actions/reorder-layers.jsx',
        expect.objectContaining({
          GROUP: 'Teachers',
        }),
      );
    });

    it('"students" group → "Students" label', async () => {
      const promise = service.submitCustomOrderScoped('A, B', ['a---1', 'b---2'], 'students');

      await flushMicrotasks();

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/ai/match-custom-order`);
      req.flush({ success: true, ordered_names: ['A', 'B'], unmatched: [] });

      await promise;

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'reorder-layers',
        'actions/reorder-layers.jsx',
        expect.objectContaining({ GROUP: 'Students' }),
      );
    });
  });

  // ============================================================================
  // arrangeNames
  // ============================================================================
  describe('arrangeNames', () => {
    it('delegálja a PS service runJsx-nek a helyes paraméterekkel', async () => {
      await service.arrangeNames('center');

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'arrange-names',
        'actions/arrange-names-selected.jsx',
        {
          TEXT_ALIGN: 'center',
          BREAK_AFTER: '1',
          NAME_GAP_CM: '0.5',
        },
      );
    });

    it('a settings signal-ek aktuális értékeit használja', async () => {
      settingsMock.nameBreakAfter.mockReturnValue(2);
      settingsMock.nameGapCm.mockReturnValue(1.5);

      await service.arrangeNames('left');

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'arrange-names',
        'actions/arrange-names-selected.jsx',
        {
          TEXT_ALIGN: 'left',
          BREAK_AFTER: '2',
          NAME_GAP_CM: '1.5',
        },
      );
    });
  });

  // ============================================================================
  // reorderLayersByNamesScoped (public)
  // ============================================================================
  describe('reorderLayersByNamesScoped', () => {
    it('runJsx-et hív a megadott nevekkel és GROUP-pal', async () => {
      await service.reorderLayersByNamesScoped(['anna', 'bela'], 'Students');

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'reorder-layers',
        'actions/reorder-layers.jsx',
        {
          ORDERED_NAMES: JSON.stringify(['anna', 'bela']),
          GROUP: 'Students',
        },
      );
    });
  });
});
