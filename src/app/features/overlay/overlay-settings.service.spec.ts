import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OverlaySettingsService } from './overlay-settings.service';
import { environment } from '../../../environments/environment';

describe('OverlaySettingsService', () => {
  let service: OverlaySettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Tiszta localStorage és electronAPI minden teszt előtt
    localStorage.clear();
    (window as any).electronAPI = undefined;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OverlaySettingsService,
      ],
    });
    service = TestBed.inject(OverlaySettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush outstanding requests to avoid cascading TestBed failures
    try { httpMock.verify(); } catch { /* ignore leftover requests */ }
    localStorage.clear();
    (window as any).electronAPI = undefined;
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('nameBreakAfter 1-gyel indul', () => {
      expect(service.nameBreakAfter()).toBe(1);
    });

    it('nameGapCm 0.5-tel indul', () => {
      expect(service.nameGapCm()).toBe(0.5);
    });

    it('sampleUseLargeSize false-szal indul', () => {
      expect(service.sampleUseLargeSize()).toBe(false);
    });

    it('sampleWatermarkColor "white"-tal indul', () => {
      expect(service.sampleWatermarkColor()).toBe('white');
    });

    it('sampleWatermarkOpacity 0.15-tel indul', () => {
      expect(service.sampleWatermarkOpacity()).toBe(0.15);
    });

    it('sampleVersion üres stringgel indul', () => {
      expect(service.sampleVersion()).toBe('');
    });

    it('syncWithBorder true-val indul', () => {
      expect(service.syncWithBorder()).toBe(true);
    });
  });

  // ============================================================================
  // SyncWithBorder
  // ============================================================================
  describe('loadSyncBorderForProject', () => {
    it('true-t ad ha nincs localStorage érték', () => {
      expect(service.loadSyncBorderForProject(1)).toBe(true);
    });

    it('false-t ad ha localStorage "false"', () => {
      localStorage.setItem('sync-border-1', 'false');
      expect(service.loadSyncBorderForProject(1)).toBe(false);
    });

    it('true-t ad ha localStorage "true"', () => {
      localStorage.setItem('sync-border-1', 'true');
      expect(service.loadSyncBorderForProject(1)).toBe(true);
    });

    it('"default" kulcsot használ ha nincs projectId', () => {
      localStorage.setItem('sync-border-default', 'false');
      expect(service.loadSyncBorderForProject()).toBe(false);
    });
  });

  describe('saveSyncBorder', () => {
    it('elmenti a syncWithBorder értéket localStorage-ba', () => {
      service.saveSyncBorder(5);
      expect(localStorage.getItem('sync-border-5')).toBe('true');
    });

    it('"default" kulcsra ment ha nincs projectId', () => {
      service.saveSyncBorder();
      expect(localStorage.getItem('sync-border-default')).toBe('true');
    });

    it('false-t ment ha syncWithBorder false', () => {
      // Először toggle-öljük false-ra (jelenleg true)
      (service as any).syncWithBorder.set(false);
      service.saveSyncBorder(3);
      expect(localStorage.getItem('sync-border-3')).toBe('false');
    });
  });

  describe('toggleSyncBorder', () => {
    it('megfordítja a syncWithBorder értéket', () => {
      expect(service.syncWithBorder()).toBe(true);
      service.toggleSyncBorder(1);
      expect(service.syncWithBorder()).toBe(false);
      service.toggleSyncBorder(1);
      expect(service.syncWithBorder()).toBe(true);
    });

    it('elmenti a localStorage-ba', () => {
      service.toggleSyncBorder(7);
      expect(localStorage.getItem('sync-border-7')).toBe('false');
    });

    it('elküldi az Electron parancsot ha elérhető', () => {
      const executeCommandMock = vi.fn();
      (window as any).electronAPI = { overlay: { executeCommand: executeCommandMock } };

      service.toggleSyncBorder(1);
      expect(executeCommandMock).toHaveBeenCalledWith('sync-border-off');

      service.toggleSyncBorder(1);
      expect(executeCommandMock).toHaveBeenCalledWith('sync-border-on');
    });

    it('nem hív Electron parancsot ha nincs electronAPI', () => {
      // Nem dob hibát electronAPI nélkül
      expect(() => service.toggleSyncBorder(1)).not.toThrow();
    });
  });

  // ============================================================================
  // Név beállítások
  // ============================================================================
  describe('cycleBreakAfter', () => {
    it('0 → 1 → 2 → 0 ciklikusan vált', () => {
      (service as any).nameBreakAfter.set(0);
      service.cycleBreakAfter();
      expect(service.nameBreakAfter()).toBe(1);

      service.cycleBreakAfter();
      expect(service.nameBreakAfter()).toBe(2);

      service.cycleBreakAfter();
      expect(service.nameBreakAfter()).toBe(0);
    });

    it('Electron-ba menti a beállítást', () => {
      const setNameBreakAfterMock = vi.fn();
      (window as any).electronAPI = { photoshop: { setNameBreakAfter: setNameBreakAfterMock, setNameGap: vi.fn() } };

      service.cycleBreakAfter();
      expect(setNameBreakAfterMock).toHaveBeenCalledWith(2);
    });
  });

  describe('adjustGap', () => {
    it('növeli a gap-et delta-val', () => {
      service.adjustGap(0.5);
      expect(service.nameGapCm()).toBe(1.0);
    });

    it('csökkenti a gap-et negatív delta-val', () => {
      service.adjustGap(-0.3);
      expect(service.nameGapCm()).toBe(0.2);
    });

    it('nem megy 0 alá', () => {
      service.adjustGap(-10);
      expect(service.nameGapCm()).toBe(0);
    });

    it('nem megy 5 fölé', () => {
      service.adjustGap(100);
      expect(service.nameGapCm()).toBe(5);
    });

    it('kerekítve egy tizedesre', () => {
      (service as any).nameGapCm.set(0.0);
      service.adjustGap(0.15);
      // Math.round(0.15 * 10) / 10 = 0.2
      expect(service.nameGapCm()).toBe(0.2);
    });

    it('Electron-ba menti a beállítást', () => {
      const setNameGapMock = vi.fn();
      (window as any).electronAPI = { photoshop: { setNameGap: setNameGapMock, setNameBreakAfter: vi.fn() } };

      service.adjustGap(0.5);
      expect(setNameGapMock).toHaveBeenCalledWith(1.0);
    });
  });

  // ============================================================================
  // loadSettings
  // ============================================================================
  describe('loadSettings', () => {
    it('nem tölt be ha nincs electronAPI', async () => {
      await service.loadSettings(1);
      // Nem dob hibát
      expect(service.nameGapCm()).toBe(0.5); // maradt a default
    });

    it('betölti a gap és breakAfter értékeket Electron-ból', async () => {
      (window as any).electronAPI = {
        photoshop: {
          getNameGap: vi.fn().mockResolvedValue(2.0),
          getNameBreakAfter: vi.fn().mockResolvedValue(0),
        },
      };

      await service.loadSettings();

      expect(service.nameGapCm()).toBe(2.0);
      expect(service.nameBreakAfter()).toBe(0);
    });

    it('nem tölti be kétszer (nameSettingsLoaded flag)', async () => {
      const getNameGapMock = vi.fn().mockResolvedValue(2.0);
      const getNameBreakAfterMock = vi.fn().mockResolvedValue(0);
      (window as any).electronAPI = {
        photoshop: { getNameGap: getNameGapMock, getNameBreakAfter: getNameBreakAfterMock },
      };

      await service.loadSettings();
      await service.loadSettings();

      expect(getNameGapMock).toHaveBeenCalledTimes(1);
    });

    it('betölti a sample settings-et ha van projectId', async () => {
      (window as any).electronAPI = {
        photoshop: {
          getNameGap: vi.fn().mockResolvedValue(1.0),
          getNameBreakAfter: vi.fn().mockResolvedValue(1),
        },
      };

      await service.loadSettings(42);

      // loadSampleSettingsForProject HTTP hívást indít
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/sample-settings`);
      req.flush({
        data: {
          sample_use_large_size: true,
          sample_watermark_color: 'black',
          sample_watermark_opacity: 25,
          sample_version: '3',
        },
      });

      expect(service.sampleUseLargeSize()).toBe(true);
      expect(service.sampleWatermarkColor()).toBe('black');
      expect(service.sampleWatermarkOpacity()).toBe(0.25);
      expect(service.sampleVersion()).toBe('3');
    });

    it('kezeli az Electron IPC hibát', async () => {
      (window as any).electronAPI = {
        photoshop: {
          getNameGap: vi.fn().mockRejectedValue(new Error('IPC error')),
          getNameBreakAfter: vi.fn().mockRejectedValue(new Error('IPC error')),
        },
      };

      await service.loadSettings();
      // Nem dob hibát, maradnak a defaultok
      expect(service.nameGapCm()).toBe(0.5);
    });
  });

  // ============================================================================
  // Minta generálás beállítások
  // ============================================================================
  describe('toggleSampleSize', () => {
    it('megfordítja a sampleUseLargeSize értéket', () => {
      expect(service.sampleUseLargeSize()).toBe(false);
      service.toggleSampleSize(1);
      expect(service.sampleUseLargeSize()).toBe(true);
      // Flush the first toggle's HTTP request
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});

      service.toggleSampleSize(1);
      expect(service.sampleUseLargeSize()).toBe(false);
      // Flush the second toggle's HTTP request
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('elküldi a backend-nek ha van projectId', () => {
      service.toggleSampleSize(10);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/sample-settings`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ sample_use_large_size: true });
      req.flush({});
    });

    it('nem küld HTTP-t ha nincs projectId', () => {
      service.toggleSampleSize(null);
      httpMock.expectNone(`${environment.apiUrl}/partner/projects`);
    });
  });

  describe('toggleWatermarkColor', () => {
    it('white → black → white ciklikusan vált', () => {
      expect(service.sampleWatermarkColor()).toBe('white');
      service.toggleWatermarkColor(1);
      expect(service.sampleWatermarkColor()).toBe('black');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});

      service.toggleWatermarkColor(1);
      expect(service.sampleWatermarkColor()).toBe('white');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('elmenti a backend-re', () => {
      service.toggleWatermarkColor(5);
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/sample-settings`);
      expect(req.request.body).toEqual({ sample_watermark_color: 'black' });
      req.flush({});
    });
  });

  describe('cycleOpacity', () => {
    it('növeli az opacity-t 1%-kal (direction = 1)', () => {
      expect(service.sampleWatermarkOpacity()).toBe(0.15);
      service.cycleOpacity(1, 1);
      expect(service.sampleWatermarkOpacity()).toBe(0.16);
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('csökkenti az opacity-t 1%-kal (direction = -1)', () => {
      expect(service.sampleWatermarkOpacity()).toBe(0.15);
      service.cycleOpacity(-1, 1);
      expect(service.sampleWatermarkOpacity()).toBe(0.14);
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('nem megy 5% alá', () => {
      (service as any).sampleWatermarkOpacity.set(0.05);
      service.cycleOpacity(-1, 1);
      expect(service.sampleWatermarkOpacity()).toBe(0.05);
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('nem megy 50% fölé', () => {
      (service as any).sampleWatermarkOpacity.set(0.50);
      service.cycleOpacity(1, 1);
      expect(service.sampleWatermarkOpacity()).toBe(0.50);
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('elmenti a backend-re százalékban', () => {
      service.cycleOpacity(1, 7);
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/7/sample-settings`);
      expect(req.request.body).toEqual({ sample_watermark_opacity: 16 });
      req.flush({});
    });
  });

  describe('cycleSampleVersion', () => {
    it('0-ról 1-re lép (direction = 1)', () => {
      expect(service.sampleVersion()).toBe('');
      service.cycleSampleVersion(1, 1);
      expect(service.sampleVersion()).toBe('1');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('1-ről 2-re lép', () => {
      (service as any).sampleVersion.set('1');
      service.cycleSampleVersion(1, 1);
      expect(service.sampleVersion()).toBe('2');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('1-ről 0-ra lép (direction = -1) és üres string lesz', () => {
      (service as any).sampleVersion.set('1');
      service.cycleSampleVersion(-1, 1);
      expect(service.sampleVersion()).toBe('');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('nem megy 0 alá', () => {
      service.cycleSampleVersion(-1, 1);
      expect(service.sampleVersion()).toBe('');
      httpMock.expectOne(`${environment.apiUrl}/partner/projects/1/sample-settings`).flush({});
    });

    it('elmenti a backend-re', () => {
      service.cycleSampleVersion(1, 3);
      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/3/sample-settings`);
      expect(req.request.body).toEqual({ sample_version: '1' });
      req.flush({});
    });
  });

  // ============================================================================
  // saveSampleSettingsToBackend
  // ============================================================================
  describe('saveSampleSettingsToBackend', () => {
    it('PUT kérést küld a megfelelő URL-re', () => {
      service.saveSampleSettingsToBackend(10, { sample_use_large_size: true });

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/10/sample-settings`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ sample_use_large_size: true });
      req.flush({});
    });

    it('nem küld kérést ha nincs projectId', () => {
      service.saveSampleSettingsToBackend(null, { sample_use_large_size: true });
      httpMock.expectNone(`${environment.apiUrl}/partner/projects`);
    });
  });

  // ============================================================================
  // loadSampleSettingsForProject
  // ============================================================================
  describe('loadSampleSettingsForProject', () => {
    it('reseteli a defaultokra és betölti a DB értékeket', () => {
      // Előtte módosítjuk
      (service as any).sampleUseLargeSize.set(true);
      (service as any).sampleWatermarkColor.set('black');

      service.loadSampleSettingsForProject(5);

      // Resetelve kell lennie
      expect(service.sampleUseLargeSize()).toBe(false);
      expect(service.sampleWatermarkColor()).toBe('white');

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/sample-settings`);
      req.flush({
        data: {
          sample_use_large_size: true,
          sample_watermark_color: 'black',
          sample_watermark_opacity: 30,
          sample_version: '2',
        },
      });

      expect(service.sampleUseLargeSize()).toBe(true);
      expect(service.sampleWatermarkColor()).toBe('black');
      expect(service.sampleWatermarkOpacity()).toBe(0.30);
      expect(service.sampleVersion()).toBe('2');
    });

    it('null értékeknél defaultokra áll vissza', () => {
      service.loadSampleSettingsForProject(5);

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/5/sample-settings`);
      req.flush({
        data: {
          sample_use_large_size: null,
          sample_watermark_color: null,
          sample_watermark_opacity: null,
          sample_version: null,
        },
      });

      expect(service.sampleUseLargeSize()).toBe(false);
      expect(service.sampleWatermarkColor()).toBe('white');
      expect(service.sampleWatermarkOpacity()).toBe(0.15);
      expect(service.sampleVersion()).toBe('');
    });
  });
});
