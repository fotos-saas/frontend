import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OverlayUploadService, PsLayerPerson, BatchProgress } from './overlay-upload.service';
import { environment } from '../../../environments/environment';

// matchFilesToPersons mock
vi.mock('../../shared/utils/filename-matcher.util', () => ({
  matchFilesToPersons: vi.fn().mockReturnValue([]),
}));

import { matchFilesToPersons } from '../../shared/utils/filename-matcher.util';

describe('OverlayUploadService', () => {
  let service: OverlayUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OverlayUploadService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OverlayUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true); // cancel pending
    delete (window as any).electronAPI;
  });

  // ============================================================================
  // parseLayerNames
  // ============================================================================
  describe('parseLayerNames', () => {
    it('helyesen parse-olja a slug---personId formátumot', () => {
      const result = service.parseLayerNames(['farago-peter---42', 'kiss-janos---7']);

      expect(result).toHaveLength(2);
      expect(result[0].personId).toBe(42);
      expect(result[0].slug).toBe('farago-peter');
      expect(result[0].layerName).toBe('farago-peter---42');
      expect(result[0].uploadStatus).toBe('pending');
      expect(result[1].personId).toBe(7);
    });

    it('kihagyja a nem megfelelő formátumú neveket', () => {
      const result = service.parseLayerNames([
        'no-separator',
        'bad---abc',
        'bad---0',
        'bad----5',
        'good---1',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].personId).toBe(1);
    });

    it('üres tömb-re üres tömböt ad vissza', () => {
      expect(service.parseLayerNames([])).toEqual([]);
    });
  });

  // ============================================================================
  // enrichWithPersons
  // ============================================================================
  describe('enrichWithPersons', () => {
    it('kitölti a personName-t ha van match', () => {
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'kiss---1', slug: 'kiss', uploadStatus: 'pending' },
        { personId: 2, layerName: 'nagy---2', slug: 'nagy', uploadStatus: 'pending' },
      ];
      const persons = [
        { id: 1, name: 'Kiss János', type: 'student' as const, hasPhoto: false, photoThumbUrl: 'thumb1.jpg' },
        { id: 3, name: 'Más Valaki', type: 'student' as const, hasPhoto: false, photoThumbUrl: null },
      ];

      const result = service.enrichWithPersons(layers, persons);

      expect(result[0].personName).toBe('Kiss János');
      expect(result[0].photoThumbUrl).toBe('thumb1.jpg');
      expect(result[1].personName).toBe('nagy');
    });

    it('megtartja a meglévő photoThumbUrl-t ha a person-ban null', () => {
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending', photoThumbUrl: 'existing.jpg' },
      ];
      const persons = [
        { id: 1, name: 'Teszt', type: 'student' as const, hasPhoto: false, photoThumbUrl: null },
      ];

      const result = service.enrichWithPersons(layers, persons);
      expect(result[0].photoThumbUrl).toBe('existing.jpg');
    });
  });

  // ============================================================================
  // normalizeSlug
  // ============================================================================
  describe('normalizeSlug', () => {
    it('ékezeteket eltávolítja', () => {
      expect(service.normalizeSlug('árvíztűrő')).toBe('arvizturo');
    });

    it('nagybetűt kisbetűre', () => {
      expect(service.normalizeSlug('NAGY')).toBe('nagy');
    });

    it('szóközt és underscore-t kötőjelre', () => {
      expect(service.normalizeSlug('hello world_test')).toBe('hello-world-test');
    });

    it('speciális karaktereket eltávolítja', () => {
      expect(service.normalizeSlug('hello!@#$%^&*()world')).toBe('helloworld');
    });

    it('többszörös kötőjeleket egyesíti', () => {
      expect(service.normalizeSlug('hello---world')).toBe('hello-world');
    });

    it('szélső kötőjeleket eltávolítja', () => {
      expect(service.normalizeSlug('-hello-')).toBe('hello');
    });
  });

  // ============================================================================
  // matchFilesToLayers
  // ============================================================================
  describe('matchFilesToLayers', () => {
    const createFile = (name: string): File => new File([''], name, { type: 'image/jpeg' });

    it('pontos slug match-re 100% confidence-t ad', () => {
      const files = [createFile('farago-peter.jpg')];
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'farago-peter---1', slug: 'farago-peter', uploadStatus: 'pending' },
      ];

      const { matched, unmatched } = service.matchFilesToLayers(files, layers);

      expect(matched[0].file).toBeDefined();
      expect(matched[0].matchType).toBe('exact');
      expect(matched[0].matchConfidence).toBe(100);
      expect(unmatched).toHaveLength(0);
    });

    it('nem párosítható fájlokat unmatched-be teszi', () => {
      const files = [createFile('teljesen-mas.jpg')];
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'farago-peter---1', slug: 'farago-peter', uploadStatus: 'pending' },
      ];

      const { matched, unmatched } = service.matchFilesToLayers(files, layers);

      expect(matched[0].file).toBeUndefined();
      expect(unmatched).toHaveLength(1);
    });

    it('nem párosít layert újra ha már van fájl', () => {
      const existingFile = createFile('existing.jpg');
      const newFile = createFile('farago-peter.jpg');
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'farago-peter---1', slug: 'farago-peter', uploadStatus: 'pending', file: existingFile },
      ];

      const { matched, unmatched } = service.matchFilesToLayers([newFile], layers);

      expect(matched[0].file).toBe(existingFile);
      expect(unmatched).toHaveLength(1);
    });

    it('2. lépcsős smart matching-et hívja a maradék fájlokra', () => {
      const file = createFile('ismeretlen.jpg');
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending' },
      ];
      const persons = [
        { id: 1, name: 'Ismeretlen', type: 'student' as const, hasPhoto: false, photoThumbUrl: null },
      ];

      (matchFilesToPersons as ReturnType<typeof vi.fn>).mockReturnValue([
        { file, personId: 1, personName: 'Ismeretlen', matchType: 'matched', confidence: 80 },
      ]);

      const { matched } = service.matchFilesToLayers([file], layers, persons);

      expect(matchFilesToPersons).toHaveBeenCalled();
      expect(matched[0].file).toBe(file);
      expect(matched[0].matchType).toBe('smart');
    });

    it('ambiguous match-et megőrzi', () => {
      const file = createFile('valaki.jpg');
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending' },
      ];
      const persons = [
        { id: 1, name: 'Teszt', type: 'student' as const, hasPhoto: false, photoThumbUrl: null },
      ];

      (matchFilesToPersons as ReturnType<typeof vi.fn>).mockReturnValue([
        { file, personId: 1, personName: 'Teszt', matchType: 'ambiguous', confidence: 55 },
      ]);

      const { matched } = service.matchFilesToLayers([file], layers, persons);

      expect(matched[0].matchType).toBe('ambiguous');
    });
  });

  // ============================================================================
  // uploadBatch
  // ============================================================================
  describe('uploadBatch', () => {
    it('üres listánál azonnal befejezi', async () => {
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'done' },
      ];

      const result = await new Promise<PsLayerPerson[]>((resolve) => {
        service.uploadBatch(42, layers, vi.fn(), vi.fn()).subscribe({
          next: (res) => resolve(res),
        });
      });

      expect(result).toEqual(layers);
    });

    it('fájl nélküli layereket kihagyja', async () => {
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending' },
      ];

      const result = await new Promise<PsLayerPerson[]>((resolve) => {
        service.uploadBatch(42, layers, vi.fn(), vi.fn()).subscribe({
          next: (res) => resolve(res),
        });
      });

      expect(result).toEqual(layers);
    });

    it('sikeres feltöltés frissíti az állapotot', async () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending', file },
      ];

      const onProgress = vi.fn();
      const onLayerUpdate = vi.fn();

      const resultPromise = new Promise<PsLayerPerson[]>((resolve) => {
        service.uploadBatch(42, layers, onProgress, onLayerUpdate).subscribe({
          next: (res) => resolve(res),
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/1/photo`);
      expect(req.request.method).toBe('POST');
      req.flush({
        success: true,
        photo: { mediaId: 1, thumbUrl: 'thumb.jpg', url: 'https://example.com/photo.jpg', version: 1 },
      });

      const result = await resultPromise;

      expect(result[0].uploadStatus).toBe('done');
      expect(result[0].photoUrl).toBe('https://example.com/photo.jpg');
      expect(onLayerUpdate).toHaveBeenCalledWith(0, expect.objectContaining({ uploadStatus: 'uploading' }));
      expect(onLayerUpdate).toHaveBeenCalledWith(0, expect.objectContaining({ uploadStatus: 'done' }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ done: 0, total: 1 }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ done: 1, total: 1 }));
    });

    it('hiba esetén error státuszt állít be', async () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending', file },
      ];

      const onProgress = vi.fn();
      const onLayerUpdate = vi.fn();

      const resultPromise = new Promise<PsLayerPerson[]>((resolve) => {
        service.uploadBatch(42, layers, onProgress, onLayerUpdate).subscribe({
          next: (res) => resolve(res),
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/1/photo`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

      const result = await resultPromise;

      expect(result[0].uploadStatus).toBe('error');
      expect(result[0].errorMsg).toBe('Server error');
      expect(onLayerUpdate).toHaveBeenCalledWith(0, expect.objectContaining({ uploadStatus: 'error' }));
    });

    it('több fájl sorban töltődik fel', async () => {
      const file1 = new File(['data1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['data2'], 'test2.jpg', { type: 'image/jpeg' });
      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'a---1', slug: 'a', uploadStatus: 'pending', file: file1 },
        { personId: 2, layerName: 'b---2', slug: 'b', uploadStatus: 'pending', file: file2 },
      ];

      const onProgress = vi.fn();
      const onLayerUpdate = vi.fn();

      const resultPromise = new Promise<PsLayerPerson[]>((resolve) => {
        service.uploadBatch(42, layers, onProgress, onLayerUpdate).subscribe({
          next: (res) => resolve(res),
        });
      });

      // Első upload
      const req1 = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/1/photo`);
      req1.flush({ success: true, photo: { mediaId: 1, thumbUrl: 't1.jpg', url: 'u1.jpg', version: 1 } });

      // Második upload (sorban jön az első után)
      await Promise.resolve();
      const req2 = httpMock.expectOne(`${environment.apiUrl}/partner/projects/42/persons/2/photo`);
      req2.flush({ success: true, photo: { mediaId: 2, thumbUrl: 't2.jpg', url: 'u2.jpg', version: 1 } });

      const result = await resultPromise;

      expect(result[0].uploadStatus).toBe('done');
      expect(result[1].uploadStatus).toBe('done');
    });
  });

  // ============================================================================
  // placePhotosInPs
  // ============================================================================
  describe('placePhotosInPs', () => {
    it('false-t ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;

      const result = await service.placePhotosInPs([]);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Electron API nem elérhető');
    });

    it('false-t ad ha nincs behelyezhető fotó', async () => {
      (window as any).electronAPI = { photoshop: { placePhotos: vi.fn() } };

      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'pending' },
      ];

      const result = await service.placePhotosInPs(layers);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Nincs behelyezhető fotó');
    });

    it('meghívja az electron placePhotos API-t', async () => {
      const placePhotosMock = vi.fn().mockResolvedValue({ success: true });
      (window as any).electronAPI = { photoshop: { placePhotos: placePhotosMock } };

      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'done', photoUrl: 'https://example.com/photo.jpg' },
      ];

      const result = await service.placePhotosInPs(layers, true, '/tmp/test.psd');

      expect(placePhotosMock).toHaveBeenCalledWith({
        layers: [{ layerName: 'test---1', photoUrl: 'https://example.com/photo.jpg' }],
        syncBorder: true,
        psdFilePath: '/tmp/test.psd',
      });
      expect(result.success).toBe(true);
    });

    it('hiba esetén gracefully kezeli', async () => {
      (window as any).electronAPI = {
        photoshop: { placePhotos: vi.fn().mockRejectedValue(new Error('PS error')) },
      };

      const layers: PsLayerPerson[] = [
        { personId: 1, layerName: 'test---1', slug: 'test', uploadStatus: 'done', photoUrl: 'url' },
      ];

      const result = await service.placePhotosInPs(layers);
      expect(result.success).toBe(false);
      expect(result.error).toBe('PS kommunikációs hiba');
    });
  });
});
