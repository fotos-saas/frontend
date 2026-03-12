import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PortraitSettingsActionsService } from './portrait-settings-actions.service';
import { PartnerService } from '../../../features/partner/services/partner.service';
import { ToastService } from '../../../core/services/toast.service';
import { EMPTY_PORTRAIT_SETTINGS, PortraitSettings } from '../../../features/partner/models/portrait.models';

describe('PortraitSettingsActionsService', () => {
  let service: PortraitSettingsActionsService;
  let partnerService: {
    getPortraitSettings: ReturnType<typeof vi.fn>;
    updatePortraitSettings: ReturnType<typeof vi.fn>;
    uploadPortraitBackground: ReturnType<typeof vi.fn>;
    deletePortraitBackground: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockSettings: PortraitSettings = {
    ...EMPTY_PORTRAIT_SETTINGS,
    enabled: true,
    mode: 'replace',
    background_type: 'preset',
  };

  const mockLoadResponse = {
    data: {
      settings: mockSettings,
      has_background_image: true,
      background_image_url: '/bg.jpg',
      background_thumb_url: '/bg_thumb.jpg',
    },
  };

  beforeEach(() => {
    partnerService = {
      getPortraitSettings: vi.fn(),
      updatePortraitSettings: vi.fn(),
      uploadPortraitBackground: vi.fn(),
      deletePortraitBackground: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        PortraitSettingsActionsService,
        { provide: PartnerService, useValue: partnerService },
        { provide: ToastService, useValue: toast },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(PortraitSettingsActionsService);
  });

  // ============================================================================
  // Kezdeti allapot
  // ============================================================================
  describe('kezdeti allapot', () => {
    it('loading true', () => expect(service.loading()).toBe(true));
    it('saving false', () => expect(service.saving()).toBe(false));
    it('uploading false', () => expect(service.uploading()).toBe(false));
    it('deleting false', () => expect(service.deleting()).toBe(false));
    it('hasBackgroundImage false', () => expect(service.hasBackgroundImage()).toBe(false));
    it('backgroundImageUrl null', () => expect(service.backgroundImageUrl()).toBeNull());
    it('backgroundThumbUrl null', () => expect(service.backgroundThumbUrl()).toBeNull());
    it('settings EMPTY', () => expect(service.settings()).toEqual({ ...EMPTY_PORTRAIT_SETTINGS }));
  });

  // ============================================================================
  // load()
  // ============================================================================
  describe('load()', () => {
    it('betolti az osszes adatot sikeresen', () => {
      partnerService.getPortraitSettings.mockReturnValue(of(mockLoadResponse));

      service.load();

      expect(service.loading()).toBe(false);
      expect(service.settings()).toEqual(mockSettings);
      expect(service.hasBackgroundImage()).toBe(true);
      expect(service.backgroundImageUrl()).toBe('/bg.jpg');
      expect(service.backgroundThumbUrl()).toBe('/bg_thumb.jpg');
    });

    it('hiba eseten loading false es toast error', () => {
      partnerService.getPortraitSettings.mockReturnValue(throwError(() => new Error('fail')));

      service.load();

      expect(service.loading()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült betölteni a portré beállításokat');
    });
  });

  // ============================================================================
  // save()
  // ============================================================================
  describe('save()', () => {
    it('elmenti a beallitasokat es frissiti a signal-t', () => {
      const updatedSettings = { ...mockSettings, output_quality: 90 };
      partnerService.updatePortraitSettings.mockReturnValue(
        of({ data: { settings: updatedSettings } }),
      );
      service.settings.set(mockSettings);

      service.save();

      expect(service.saving()).toBe(false);
      expect(service.settings().output_quality).toBe(90);
      expect(toast.success).toHaveBeenCalledWith('Siker', 'Portré beállítások mentve');
    });

    it('hiba eseten saving false es toast error', () => {
      partnerService.updatePortraitSettings.mockReturnValue(throwError(() => new Error('fail')));

      service.save();

      expect(service.saving()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült menteni a beállításokat');
    });
  });

  // ============================================================================
  // uploadBackground()
  // ============================================================================
  describe('uploadBackground()', () => {
    it('feltolti a hatterkepet sikeresen', () => {
      partnerService.uploadPortraitBackground.mockReturnValue(
        of({ data: { url: '/new_bg.jpg', thumb_url: '/new_thumb.jpg' } }),
      );
      const file = new File([''], 'bg.jpg', { type: 'image/jpeg' });

      service.uploadBackground(file);

      expect(service.uploading()).toBe(false);
      expect(service.hasBackgroundImage()).toBe(true);
      expect(service.backgroundImageUrl()).toBe('/new_bg.jpg');
      expect(service.backgroundThumbUrl()).toBe('/new_thumb.jpg');
      expect(toast.success).toHaveBeenCalledWith('Siker', 'Háttérkép feltöltve');
    });

    it('hiba eseten uploading false es toast error', () => {
      partnerService.uploadPortraitBackground.mockReturnValue(throwError(() => new Error('fail')));
      const file = new File([''], 'bg.jpg');

      service.uploadBackground(file);

      expect(service.uploading()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült feltölteni a háttérképet');
    });
  });

  // ============================================================================
  // deleteBackground()
  // ============================================================================
  describe('deleteBackground()', () => {
    it('torli a hatterkepet sikeresen', () => {
      service.hasBackgroundImage.set(true);
      service.backgroundImageUrl.set('/bg.jpg');
      service.backgroundThumbUrl.set('/thumb.jpg');
      partnerService.deletePortraitBackground.mockReturnValue(of({}));

      service.deleteBackground();

      expect(service.deleting()).toBe(false);
      expect(service.hasBackgroundImage()).toBe(false);
      expect(service.backgroundImageUrl()).toBeNull();
      expect(service.backgroundThumbUrl()).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Siker', 'Háttérkép törölve');
    });

    it('hiba eseten deleting false es toast error', () => {
      partnerService.deletePortraitBackground.mockReturnValue(throwError(() => new Error('fail')));

      service.deleteBackground();

      expect(service.deleting()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült törölni a háttérképet');
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

    it('boolean mezot normalan frissiti', () => {
      service.updateSetting('decontaminate', true);
      expect(service.settings().decontaminate).toBe(true);
    });

    it('string tipusu mezot normalan frissiti', () => {
      service.updateSetting('mode', 'darken');
      expect(service.settings().mode).toBe('darken');
    });
  });
});
