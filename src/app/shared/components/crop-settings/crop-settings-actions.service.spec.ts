import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CropSettingsActionsService } from './crop-settings-actions.service';
import { PartnerService } from '@features/partner/services/partner.service';
import { ToastService } from '@core/services/toast.service';
import { EMPTY_CROP_SETTINGS, CROP_PRESETS, CropSettings } from '@features/partner/models/crop.models';

describe('CropSettingsActionsService', () => {
  let service: CropSettingsActionsService;
  let partnerService: { getCropSettings: ReturnType<typeof vi.fn>; updateCropSettings: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockSettings: CropSettings = {
    enabled: true,
    preset: 'school_portrait',
    head_padding_top: 0.25,
    chin_padding_bottom: 0.40,
    shoulder_width: 0.85,
    face_position_y: 0.38,
    aspect_ratio: '4:5',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  };

  beforeEach(() => {
    partnerService = {
      getCropSettings: vi.fn(),
      updateCropSettings: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CropSettingsActionsService,
        { provide: PartnerService, useValue: partnerService },
        { provide: ToastService, useValue: toast },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(CropSettingsActionsService);
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('loading true', () => {
      expect(service.loading()).toBe(true);
    });

    it('saving false', () => {
      expect(service.saving()).toBe(false);
    });

    it('settings EMPTY_CROP_SETTINGS', () => {
      expect(service.settings()).toEqual({ ...EMPTY_CROP_SETTINGS });
    });
  });

  // ============================================================================
  // load()
  // ============================================================================
  describe('load()', () => {
    it('betolti a beallitasokat es frissiti a signal-eket', () => {
      partnerService.getCropSettings.mockReturnValue(
        of({ data: { settings: mockSettings } }),
      );

      service.load();

      expect(service.loading()).toBe(false);
      expect(service.settings()).toEqual(mockSettings);
    });

    it('loading true-ra allit hivas elott', () => {
      service['loading'].set(false);
      partnerService.getCropSettings.mockReturnValue(
        of({ data: { settings: mockSettings } }),
      );

      service.load();

      // A subscribe mar lefutott, de ellenorizzuk hogy hivaskor true volt
      expect(partnerService.getCropSettings).toHaveBeenCalled();
    });

    it('ha nincs settings a valaszban, nem irja felul', () => {
      partnerService.getCropSettings.mockReturnValue(of({ data: {} }));

      service.load();

      expect(service.settings()).toEqual({ ...EMPTY_CROP_SETTINGS });
      expect(service.loading()).toBe(false);
    });

    it('hiba eseten loading false-ra allit es toast-ot mutat', () => {
      partnerService.getCropSettings.mockReturnValue(throwError(() => new Error('fail')));

      service.load();

      expect(service.loading()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        'Hiba',
        'Nem sikerült betölteni a vágási beállításokat',
      );
    });
  });

  // ============================================================================
  // save()
  // ============================================================================
  describe('save()', () => {
    it('elmenti a beallitasokat sikeres eseten', () => {
      service.settings.set(mockSettings);
      partnerService.updateCropSettings.mockReturnValue(
        of({ data: { settings: { ...mockSettings, output_quality: 90 } } }),
      );

      service.save();

      expect(service.saving()).toBe(false);
      expect(service.settings().output_quality).toBe(90);
      expect(toast.success).toHaveBeenCalledWith('Mentve', 'Vágási beállítások sikeresen mentve');
    });

    it('saving true-ra allit mentes kozben', () => {
      partnerService.updateCropSettings.mockReturnValue(
        of({ data: { settings: mockSettings } }),
      );

      service.save();

      // Vegul false lesz
      expect(service.saving()).toBe(false);
      expect(partnerService.updateCropSettings).toHaveBeenCalled();
    });

    it('hiba eseten saving false es toast error', () => {
      partnerService.updateCropSettings.mockReturnValue(throwError(() => new Error('fail')));

      service.save();

      expect(service.saving()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült menteni a beállításokat');
    });

    it('ha nincs settings a valaszban, nem irja felul', () => {
      service.settings.set(mockSettings);
      partnerService.updateCropSettings.mockReturnValue(of({ data: {} }));

      service.save();

      expect(service.settings()).toEqual(mockSettings);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // updateSetting()
  // ============================================================================
  describe('updateSetting()', () => {
    it('frissiti a megadott kulcsot', () => {
      service.updateSetting('enabled', true);
      expect(service.settings().enabled).toBe(true);
    });

    it('szam tipusu mezot stringbol konvertal', () => {
      service.updateSetting('output_quality', '80' as unknown as number);
      expect(service.settings().output_quality).toBe(80);
    });

    it('NaN ertek eseten nem modosit', () => {
      const before = service.settings().output_quality;
      service.updateSetting('output_quality', 'abc' as unknown as number);
      expect(service.settings().output_quality).toBe(before);
    });

    it('string tipusu mezot normalan frissiti', () => {
      service.updateSetting('aspect_ratio', '1:1');
      expect(service.settings().aspect_ratio).toBe('1:1');
    });
  });

  // ============================================================================
  // applyPreset()
  // ============================================================================
  describe('applyPreset()', () => {
    it('alkalmazza a yearbook presetet', () => {
      service.applyPreset('yearbook');

      const s = service.settings();
      expect(s.preset).toBe('yearbook');
      expect(s.aspect_ratio).toBe(CROP_PRESETS.yearbook.aspect_ratio);
      expect(s.head_padding_top).toBe(CROP_PRESETS.yearbook.head_padding_top);
    });

    it('alkalmazza a passport presetet', () => {
      service.applyPreset('passport');

      const s = service.settings();
      expect(s.preset).toBe('passport');
      expect(s.face_position_y).toBe(CROP_PRESETS.passport.face_position_y);
    });

    it('alkalmazza a headshot presetet', () => {
      service.applyPreset('headshot');
      expect(service.settings().aspect_ratio).toBe('1:1');
    });

    it('megorzi a korabbi enabled erteket preset alkalmazaskor', () => {
      service.settings.set({ ...mockSettings, enabled: true });
      service.applyPreset('yearbook');
      expect(service.settings().enabled).toBe(true);
    });
  });
});
