import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OverlayEffectsService } from './overlay-effects.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';

/**
 * overlay-effects.service – 2. rész
 * Akciók: configure, alignTopOnly, measureGridGaps, executeEqualizeGrid,
 * executeGridArrange, executeCenterSelected, applyRotateSelected,
 * applyBorderRadiusSelected, executeBorderRadius, handleJsxResult, timer cleanup
 */
describe('OverlayEffectsService – actions', () => {
  let service: OverlayEffectsService;
  let psMock: {
    runJsx: ReturnType<typeof vi.fn>;
  };
  let settingsMock: {
    nameBreakAfter: ReturnType<typeof vi.fn>;
    nameGapCm: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    psMock = {
      runJsx: vi.fn().mockResolvedValue(null),
    };
    settingsMock = {
      nameBreakAfter: vi.fn().mockReturnValue(1),
      nameGapCm: vi.fn().mockReturnValue(0.5),
    };

    TestBed.configureTestingModule({
      providers: [
        OverlayEffectsService,
        { provide: OverlayPhotoshopService, useValue: psMock },
        { provide: OverlaySettingsService, useValue: settingsMock },
      ],
    });
    service = TestBed.inject(OverlayEffectsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // configure
  // ============================================================================
  describe('configure', () => {
    it('beállítja a getLayerNames callback-et', () => {
      const mockGetLayerNames = vi.fn().mockResolvedValue(['layer1']);
      service.configure({ getLayerNames: mockGetLayerNames });
      expect(() => service.configure({ getLayerNames: mockGetLayerNames })).not.toThrow();
    });
  });

  // ============================================================================
  // alignTopOnly
  // ============================================================================
  describe('alignTopOnly', () => {
    it('loading true-ra állítja és JSX-et futtat', async () => {
      psMock.runJsx.mockResolvedValue(null);

      await service.alignTopOnly();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'equalize-grid',
        'actions/equalize-grid-selected.jsx',
        expect.objectContaining({ ALIGN_TOP_ONLY: 'true' }),
      );
      expect(service.loading()).toBe(false);
    });

    it('IMAGES_ONLY paramot ad ha imagesOnly true', async () => {
      (service as any).imagesOnly.set(true);

      await service.alignTopOnly();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'equalize-grid',
        'actions/equalize-grid-selected.jsx',
        expect.objectContaining({ ALIGN_TOP_ONLY: 'true', IMAGES_ONLY: 'true' }),
      );
    });

    it('loading false-ra állítja hiba esetén is', async () => {
      psMock.runJsx.mockRejectedValue(new Error('Hiba'));

      try {
        await service.alignTopOnly();
      } catch {
        // expected
      }
      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // measureGridGaps
  // ============================================================================
  describe('measureGridGaps', () => {
    it('loading true-ra állítja majd false-ra', async () => {
      psMock.runJsx.mockResolvedValue(null);
      await service.measureGridGaps();
      expect(service.loading()).toBe(false);
    });

    it('beállítja a gridGapPx-t és gridLayerCount-ot measure mode-ban', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ mode: 'measure', avgGapPx: 150, count: 10, dpi: 300 }),
      });

      await service.measureGridGaps();

      expect(service.gridGapPx()).toBe(150);
      expect(service.gridLayerCount()).toBe(10);
    });

    it('hibaüzenetet ad ha result.output-ban error van', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ error: 'Nincs kijelölt layer' }),
      });

      await service.measureGridGaps();

      expect(service.result()).toEqual({ success: false, message: 'Nincs kijelölt layer' });
    });

    it('hibaüzenetet ad ha nincs output', async () => {
      psMock.runJsx.mockResolvedValue({ output: null });

      await service.measureGridGaps();

      expect(service.result()).toEqual({ success: false, message: 'Nincs valasz a Photoshoptol' });
    });

    it('hibaüzenetet ad ha a parse sikertelen', async () => {
      psMock.runJsx.mockResolvedValue({ output: 'invalid json{{{' });

      await service.measureGridGaps();

      expect(service.result()).toEqual({ success: false, message: 'Hiba a valasz feldolgozasaban' });
    });
  });

  // ============================================================================
  // executeEqualizeGrid
  // ============================================================================
  describe('executeEqualizeGrid', () => {
    it('hibaüzenetet ad ha gridGapPx null', async () => {
      await service.executeEqualizeGrid();
      expect(service.result()).toEqual({ success: false, message: 'Elobb merd meg a terkoezt' });
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });

    it('JSX-et futtat a gap és alignTop paraméterekkel', async () => {
      (service as any).gridGapPx.set(200);
      (service as any).gridAlignTop.set(true);

      await service.executeEqualizeGrid();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'equalize-grid',
        'actions/equalize-grid-selected.jsx',
        expect.objectContaining({
          GAP_H_PX: '200',
          ALIGN_TOP: 'true',
        }),
      );
    });

    it('IMAGES_ONLY paramot ad ha imagesOnly true', async () => {
      (service as any).gridGapPx.set(100);
      (service as any).imagesOnly.set(true);

      await service.executeEqualizeGrid();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'equalize-grid',
        'actions/equalize-grid-selected.jsx',
        expect.objectContaining({ IMAGES_ONLY: 'true' }),
      );
    });
  });

  // ============================================================================
  // executeGridArrange
  // ============================================================================
  describe('executeGridArrange', () => {
    it('hibaüzenetet ad ha gridCols < 1', async () => {
      (service as any).gridCols.set(0);
      await service.executeGridArrange();
      expect(service.result()).toEqual({ success: false, message: 'Az oszlopszam legalabb 1 legyen' });
    });

    it('JSX-et futtat a grid paraméterekkel', async () => {
      psMock.runJsx
        .mockResolvedValueOnce({ output: JSON.stringify({ dpi: 300 }) })
        .mockResolvedValueOnce({ output: JSON.stringify({ placed: 12, cols: 5, rows: 3 }) });

      await service.executeGridArrange();

      const secondCall = psMock.runJsx.mock.calls[1];
      expect(secondCall[0]).toBe('equalize-grid');
      expect(secondCall[2]).toHaveProperty('GRID_COLS', '5');
      expect(secondCall[2]).toHaveProperty('GRID_ALIGN', 'center');
    });
  });

  // ============================================================================
  // executeCenterSelected
  // ============================================================================
  describe('executeCenterSelected', () => {
    it('loading-ot kezel és JSX-et futtat', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ count: 5, dx: 10 }),
      });

      await service.executeCenterSelected();

      expect(psMock.runJsx).toHaveBeenCalledWith('center-selected', 'actions/center-selected.jsx', {});
      expect(service.loading()).toBe(false);
    });

    it('"Mar kozepen van" üzenetet ad ha dx === 0', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ count: 5, dx: 0, message: 'Már középen van' }),
      });

      await service.executeCenterSelected();

      expect(service.result()?.message).toBe('Már középen van');
    });

    it('loading false-ra állítja hiba esetén is', async () => {
      psMock.runJsx.mockRejectedValue(new Error('Hiba'));

      try {
        await service.executeCenterSelected();
      } catch {
        // expected
      }
      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // applyRotateSelected
  // ============================================================================
  describe('applyRotateSelected', () => {
    it('nem csinál semmit ha loading=true', async () => {
      (service as any).loading.set(true);
      await service.applyRotateSelected();
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });

    it('hibaüzenetet ad ha angle <= 0', async () => {
      (service as any).rotateAngle.set(0);
      await service.applyRotateSelected();
      expect(service.result()).toEqual({ success: false, message: 'A szog legalabb 0.1 legyen' });
    });

    it('JSX-et futtat angle és random paraméterekkel', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ rotated: 5, skipped: 1 }),
      });

      await service.applyRotateSelected();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'rotate-selected',
        'actions/rotate-selected.jsx',
        { angle: 2, random: true },
      );
      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // applyBorderRadiusSelected
  // ============================================================================
  describe('applyBorderRadiusSelected', () => {
    it('nem csinál semmit ha loading=true', async () => {
      (service as any).loading.set(true);
      await service.applyBorderRadiusSelected();
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });

    it('hibaüzenetet ad ha radius <= 0', async () => {
      (service as any).borderRadius.set(0);
      await service.applyBorderRadiusSelected();
      expect(service.result()).toEqual({ success: false, message: 'A sugar legalabb 1px legyen' });
    });

    it('JSX-et futtat radius paraméterrel', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ masked: 8, skipped: 2 }),
      });

      await service.applyBorderRadiusSelected();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'border-radius',
        'actions/apply-border-radius.jsx',
        { radius: 30, useSelectedLayers: true },
      );
      expect(service.loading()).toBe(false);
    });
  });

  // ============================================================================
  // executeBorderRadius
  // ============================================================================
  describe('executeBorderRadius', () => {
    it('hibaüzenetet ad ha radius <= 0', async () => {
      (service as any).borderRadius.set(0);
      await service.executeBorderRadius();
      expect(service.result()).toEqual({ success: false, message: 'A sugar legalabb 1px legyen' });
    });

    it('useSelectedLayers true ha borderRadiusUseSelected true', async () => {
      (service as any).borderRadiusUseSelected.set(true);
      psMock.runJsx.mockResolvedValue(null);

      await service.executeBorderRadius();

      expect(psMock.runJsx).toHaveBeenCalledWith(
        'border-radius',
        'actions/apply-border-radius.jsx',
        { radius: 30, useSelectedLayers: true },
      );
    });

    it('getLayerNames-t hívja ha borderRadiusUseSelected false', async () => {
      const mockGetLayerNames = vi.fn().mockResolvedValue(['layer1', 'layer2']);
      service.configure({ getLayerNames: mockGetLayerNames });

      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ masked: 2, skipped: 0 }),
      });

      await service.executeBorderRadius();

      expect(mockGetLayerNames).toHaveBeenCalledWith('all');
      expect(psMock.runJsx).toHaveBeenCalledWith(
        'border-radius',
        'actions/apply-border-radius.jsx',
        { radius: 30, useSelectedLayers: false, layerNames: ['layer1', 'layer2'] },
      );
    });

    it('hibaüzenetet ad ha nincs layer név', async () => {
      const mockGetLayerNames = vi.fn().mockResolvedValue([]);
      service.configure({ getLayerNames: mockGetLayerNames });

      await service.executeBorderRadius();

      expect(service.result()).toEqual({ success: false, message: 'Nincsenek image layerek' });
      expect(psMock.runJsx).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // handleJsxResult (private, indirekt tesztelés)
  // ============================================================================
  describe('handleJsxResult (indirekt)', () => {
    it('fallback üzenetet ad ha nincs output', async () => {
      psMock.runJsx.mockResolvedValue(null);
      await service.executeCenterSelected();
      expect(service.result()).toEqual({ success: true, message: 'Kozepre igazitas kesz' });
    });

    it('error üzenetet ad ha az output JSON error kulcsot tartalmaz', async () => {
      psMock.runJsx.mockResolvedValue({
        output: JSON.stringify({ error: 'Valami hiba' }),
      });
      await service.executeCenterSelected();
      expect(service.result()).toEqual({ success: false, message: 'Valami hiba' });
    });

    it('fallback üzenetet ad ha a JSON parse sikertelen', async () => {
      psMock.runJsx.mockResolvedValue({ output: '<<<invalid>>>' });
      await service.executeCenterSelected();
      expect(service.result()).toEqual({ success: true, message: 'Kozepre igazitas kesz' });
    });
  });

  // ============================================================================
  // timer cleanup
  // ============================================================================
  describe('timer cleanup', () => {
    it('setResult timer lejár és null-ra állít', () => {
      service.setResult(true, 'Teszt');
      expect(service.result()).not.toBeNull();
      vi.advanceTimersByTime(3000);
      expect(service.result()).toBeNull();
    });
  });
});
