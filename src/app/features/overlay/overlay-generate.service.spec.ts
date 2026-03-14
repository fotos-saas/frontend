import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { OverlayGenerateService } from './overlay-generate.service';
import { OverlayProjectService } from './overlay-project.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayContext } from '../../core/services/electron.types';

function createMockElectronAPI() {
  return {
    photoshop: {
      runJsx: vi.fn().mockResolvedValue({
        success: true,
        output: '__FLATTEN_RESULT__OK:/tmp/flat.jpg',
      }),
    },
    sample: {
      generate: vi.fn().mockResolvedValue({ success: true }),
    },
    finalizer: {
      upload: vi.fn().mockResolvedValue({ success: true, uploadedCount: 1 }),
    },
  };
}

describe('OverlayGenerateService', () => {
  let service: OverlayGenerateService;
  let projectService: { resolveProjectId: ReturnType<typeof vi.fn> };
  let settingsService: {
    sampleUseLargeSize: ReturnType<typeof vi.fn>;
    sampleWatermarkColor: ReturnType<typeof vi.fn>;
    sampleWatermarkOpacity: ReturnType<typeof vi.fn>;
    sampleVersion: ReturnType<typeof vi.fn>;
  };
  let pollingService: { activeDoc: ReturnType<typeof vi.fn> };

  const context: OverlayContext = { mode: 'normal', projectId: 10 };

  beforeEach(() => {
    projectService = {
      resolveProjectId: vi.fn().mockResolvedValue(10),
    };

    settingsService = {
      sampleUseLargeSize: vi.fn().mockReturnValue(false),
      sampleWatermarkColor: vi.fn().mockReturnValue('white'),
      sampleWatermarkOpacity: vi.fn().mockReturnValue(0.15),
      sampleVersion: vi.fn().mockReturnValue(''),
    };

    pollingService = {
      activeDoc: vi.fn().mockReturnValue({ name: 'tablo.psd', path: '/work/tablo.psd', dir: '/work' }),
    };

    (window as any).electronAPI = createMockElectronAPI();

    // Mock sessionStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token-123');

    TestBed.configureTestingModule({
      providers: [
        OverlayGenerateService,
        { provide: OverlayProjectService, useValue: projectService },
        { provide: OverlaySettingsService, useValue: settingsService },
        { provide: OverlayPollingService, useValue: pollingService },
      ],
    });

    service = TestBed.inject(OverlayGenerateService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('generating null', () => {
      expect(service.generating()).toBeNull();
    });

    it('generateResult null', () => {
      expect(service.generateResult()).toBeNull();
    });
  });

  // ============================================================================
  // confirmGenerate - altalanos
  // ============================================================================
  describe('confirmGenerate altalanos', () => {
    it('electronAPI nelkul ne csinaljon semmit', async () => {
      (window as any).electronAPI = undefined;

      await service.confirmGenerate('sample', context);

      expect(service.generating()).toBeNull();
      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('mar futo generalas eseten ne induljon ujra', async () => {
      // Szimulaljuk h mar fut
      service.generating.set('sample');

      await service.confirmGenerate('final', context);

      // resolveProjectId nem hivodik meg masodszor
      expect(projectService.resolveProjectId).not.toHaveBeenCalled();
    });

    it('generalas indulaskor beallitja a generating signal-t', async () => {
      let capturedGenerating: string | null = null;
      projectService.resolveProjectId.mockImplementation(async () => {
        capturedGenerating = service.generating();
        return 10;
      });

      await service.confirmGenerate('sample', context);

      expect(capturedGenerating).toBe('sample');
    });

    it('generalas vegen null-ra allitja a generating signal-t', async () => {
      await service.confirmGenerate('sample', context);

      expect(service.generating()).toBeNull();
    });

    it('varatlan hiba eseten hibauzenet jelenik meg', async () => {
      (window as any).electronAPI.photoshop.runJsx.mockRejectedValue(new Error('PS crash'));

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Váratlan hiba');
      expect(service.generating()).toBeNull();
    });
  });

  // ============================================================================
  // confirmGenerate - sample
  // ============================================================================
  describe('confirmGenerate sample', () => {
    it('nincs PSD path eseten hibauzenet', async () => {
      pollingService.activeDoc.mockReturnValue({ name: null, path: null, dir: null });

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Nincs megnyitott PSD');
    });

    it('nincs projectId eseten hibauzenet', async () => {
      projectService.resolveProjectId.mockResolvedValue(null);

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Nincs projekt azonosító');
    });

    it('flatten hiba eseten hibauzenet', async () => {
      (window as any).electronAPI.photoshop.runJsx.mockResolvedValue({
        success: false,
        error: 'Flatten failed',
      });

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Flatten failed');
    });

    it('flatten kimenet nelkul hibauzenet', async () => {
      (window as any).electronAPI.photoshop.runJsx.mockResolvedValue({
        success: true,
        output: 'some random output',
      });

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Flatten nem adott eredményt');
    });

    it('sikeres minta generalas', async () => {
      (window as any).electronAPI.sample.generate.mockResolvedValue({ success: true });

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(true);
      expect(service.generateResult()?.message).toContain('Minta kész');
    });

    it('sikertelen minta generalas', async () => {
      (window as any).electronAPI.sample.generate.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      await service.confirmGenerate('sample', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Upload failed');
    });

    it('sampleUseLargeSize true eseten 4000-es szelesseg', async () => {
      settingsService.sampleUseLargeSize.mockReturnValue(true);

      await service.confirmGenerate('sample', context);

      const call = (window as any).electronAPI.sample.generate.mock.calls[0][0];
      expect(call.sizes[0].width).toBe(4000);
    });

    it('sampleUseLargeSize false eseten 2000-es szelesseg', async () => {
      await service.confirmGenerate('sample', context);

      const call = (window as any).electronAPI.sample.generate.mock.calls[0][0];
      expect(call.sizes[0].width).toBe(2000);
    });

    it('watermark szin es opacity tovabbitva', async () => {
      settingsService.sampleWatermarkColor.mockReturnValue('black');
      settingsService.sampleWatermarkOpacity.mockReturnValue(0.3);

      await service.confirmGenerate('sample', context);

      const call = (window as any).electronAPI.sample.generate.mock.calls[0][0];
      expect(call.watermarkColor).toBe('black');
      expect(call.watermarkOpacity).toBe(0.3);
    });

    it('PSD kiterjesztes lecsipese a projektnevbol', async () => {
      pollingService.activeDoc.mockReturnValue({ name: 'mytablo.psd', path: '/work/mytablo.psd', dir: '/work' });

      await service.confirmGenerate('sample', context);

      const call = (window as any).electronAPI.sample.generate.mock.calls[0][0];
      expect(call.projectName).toBe('mytablo');
    });

    it('PSD nev null eseten default projektnevvel dolgozik', async () => {
      pollingService.activeDoc.mockReturnValue({ name: null, path: '/work/x.psd', dir: '/work' });

      await service.confirmGenerate('sample', context);

      const call = (window as any).electronAPI.sample.generate.mock.calls[0][0];
      expect(call.projectName).toBe('tablo');
    });
  });

  // ============================================================================
  // confirmGenerate - final
  // ============================================================================
  describe('confirmGenerate final', () => {
    it('nincs PSD path eseten hibauzenet', async () => {
      pollingService.activeDoc.mockReturnValue({ name: null, path: null, dir: null });

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Nincs megnyitott PSD');
    });

    it('nincs projectId eseten hibauzenet', async () => {
      projectService.resolveProjectId.mockResolvedValue(null);

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toBe('Nincs projekt azonosító');
    });

    it('sikeres veglegesites mindket tipussal', async () => {
      (window as any).electronAPI.finalizer.upload
        .mockResolvedValueOnce({ success: true, uploadedCount: 2 })
        .mockResolvedValueOnce({ success: true, uploadedCount: 1 });

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(true);
      expect(service.generateResult()?.message).toContain('Flat');
      expect(service.generateResult()?.message).toContain('Kistabló');
      expect(service.generateResult()?.message).toContain('3 feltöltve');
    });

    it('csak flat sikeres', async () => {
      (window as any).electronAPI.finalizer.upload
        .mockResolvedValueOnce({ success: true, uploadedCount: 1 })
        .mockResolvedValueOnce({ success: false, error: 'Kistablo hiba' });

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(true);
      expect(service.generateResult()?.message).toContain('Flat');
    });

    it('mindket feltoltes sikertelen', async () => {
      (window as any).electronAPI.finalizer.upload
        .mockResolvedValueOnce({ success: false, error: 'Flat hiba' })
        .mockResolvedValueOnce({ success: false, error: 'Kistablo hiba' });

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(false);
      expect(service.generateResult()?.message).toContain('Flat hiba');
    });

    it('Promise.all-t hasznal a ket feltolteshez', async () => {
      let callCount = 0;
      (window as any).electronAPI.finalizer.upload.mockImplementation(async (params: any) => {
        callCount++;
        return { success: true, uploadedCount: 1 };
      });

      await service.confirmGenerate('final', context);

      expect((window as any).electronAPI.finalizer.upload).toHaveBeenCalledTimes(2);
      const calls = (window as any).electronAPI.finalizer.upload.mock.calls;
      expect(calls[0][0].type).toBe('flat');
      expect(calls[1][0].type).toBe('small_tablo');
      expect(calls[1][0].maxSize).toBe(3000);
    });

    it('flatten hiba eseten final sem fut le', async () => {
      (window as any).electronAPI.photoshop.runJsx.mockResolvedValue({
        success: false,
        error: 'PS crashed',
      });

      await service.confirmGenerate('final', context);

      expect(service.generateResult()?.success).toBe(false);
      expect((window as any).electronAPI.finalizer.upload).not.toHaveBeenCalled();
    });
  });
});
