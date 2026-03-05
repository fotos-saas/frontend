import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PokePresetService } from './poke-preset.service';
import { GuestService } from './guest.service';
import { LoggerService } from './logger.service';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

describe('PokePresetService', () => {
  let service: PokePresetService;
  let httpMock: HttpTestingController;

  const mockGuestService = {
    getGuestSessionHeader: vi.fn().mockReturnValue(new HttpHeaders()),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GuestService, useValue: mockGuestService },
        { provide: LoggerService, useValue: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } },
      ],
    });
    service = TestBed.inject(PokePresetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadPresets', () => {
    it('preseteket betölti és signal-ba menti', async () => {
      const promise = firstValueFrom(service.loadPresets());
      const req = httpMock.expectOne((r) => r.url.includes('/pokes/presets'));
      req.flush({ success: true, data: { presets: [{ key: 'hello', emoji: '👋', text: 'Hello!', category: null }] } });

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('hello');
      expect(service.presets().length).toBe(1);
    });

    it('hiba esetén üres tömböt ad', async () => {
      const promise = firstValueFrom(service.loadPresets());
      const req = httpMock.expectOne((r) => r.url.includes('/pokes/presets'));
      req.error(new ProgressEvent('error'));

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  describe('loadMissingUsers', () => {
    it('hiányzókat betölti', async () => {
      const promise = firstValueFrom(service.loadMissingUsers());
      const req = httpMock.expectOne((r) => r.url.includes('/missing'));
      req.flush({
        success: true,
        data: {
          categories: {
            voting: { count: 0, users: [], has_active_poll: false, active_polls_count: 0, total_missing_photos: 0, message: '' },
            photoshoot: { count: 0, users: [], has_active_poll: false, active_polls_count: 0, total_missing_photos: 0, message: '' },
            image_selection: { count: 0, users: [], has_active_poll: false, active_polls_count: 0, total_missing_photos: 0, message: '' },
          },
          summary: { totalMissing: 0 },
        },
      });

      const result = await promise;
      expect(result).toBe(true);
      expect(service.loading()).toBe(false);
    });
  });

  describe('presetsForCategory', () => {
    it('szűri category szerint', () => {
      service.presets.set([
        { key: 'a', emoji: '👋', text: 'A', category: 'voting' as any },
        { key: 'b', emoji: '📸', text: 'B', category: null as any },
      ]);
      expect(service.presetsForCategory('voting' as any).length).toBe(2);
      expect(service.presetsForCategory(null).length).toBe(1);
    });
  });

  describe('clearPresets', () => {
    it('állapotot visszaállítja', () => {
      service.presets.set([{ key: 'a' } as any]);
      service.clearPresets();
      expect(service.presets()).toEqual([]);
      expect(service.missingSummary()).toBeNull();
    });
  });
});
