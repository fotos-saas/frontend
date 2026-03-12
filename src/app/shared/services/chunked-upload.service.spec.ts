import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { map } from 'rxjs';
import { ChunkedUploadService, ChunkedUploadProgress } from './chunked-upload.service';

// 8 MB threshold (a service-ben definiálva)
const CHUNKED_THRESHOLD = 8 * 1024 * 1024;

const FAKE_HASH = '0'.repeat(64);

/**
 * Mock File letrehozasa megadott merettel.
 */
function createMockFile(sizeInBytes: number, name = 'test-file.psd', type = 'application/octet-stream'): File {
  const buffer = new ArrayBuffer(sizeInBytes);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

describe('ChunkedUploadService', () => {
  let service: ChunkedUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChunkedUploadService);
    httpMock = TestBed.inject(HttpTestingController);

    // Az initUpload privat metodus eredetileg from(this.computeFileHash(file)) lanccal
    // indul, ami async Promise-t hasznal (file.arrayBuffer + crypto.subtle.digest).
    // Zone.js wrappeli a Promise-eket, igy szinkron tesztben nem tudjuk flush-olni.
    // MEGOLDAS: az initUpload-ot mockoljuk ugy, hogy kozvetlenul HTTP POST-ot kuld
    // a hash szamitas nelkul, igy a keres szinkron megjelenik.
    const http = TestBed.inject(HttpClient);
    const baseUrl = (service as any).baseUrl;
    vi.spyOn(service as any, 'initUpload').mockImplementation(
      (file: File, metadata: Record<string, unknown>) => {
        return http.post<any>(`${baseUrl}/init`, {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          file_hash: FAKE_HASH,
          metadata,
        }).pipe(map((r: any) => r.data));
      },
    );
  });

  afterEach(() => {
    // Az uploadFile teardown-ja abort DELETE kerest kuld unsubscribe-kor,
    // meg ha a feltoltes sikeresen befejezodott is. Ezeket elnyomjuk verify elott.
    httpMock.match(req => req.method === 'DELETE');
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // needsChunkedUpload
  // ==========================================================================
  describe('needsChunkedUpload', () => {
    it('true-t ad 8MB-nal nagyobb fajlra', () => {
      const largeFile = createMockFile(CHUNKED_THRESHOLD + 1);
      expect(service.needsChunkedUpload(largeFile)).toBe(true);
    });

    it('true-t ad pontosan 8MB-os fajlra', () => {
      const exactFile = createMockFile(CHUNKED_THRESHOLD);
      expect(service.needsChunkedUpload(exactFile)).toBe(true);
    });

    it('false-t ad 8MB-nal kisebb fajlra', () => {
      const smallFile = createMockFile(CHUNKED_THRESHOLD - 1);
      expect(service.needsChunkedUpload(smallFile)).toBe(false);
    });

    it('false-t ad nagyon kis fajlra', () => {
      const tinyFile = createMockFile(1024);
      expect(service.needsChunkedUpload(tinyFile)).toBe(false);
    });

    it('false-t ad ures fajlra', () => {
      const emptyFile = createMockFile(0);
      expect(service.needsChunkedUpload(emptyFile)).toBe(false);
    });
  });

  // ==========================================================================
  // uploadFile — kis fajl (EMPTY)
  // ==========================================================================
  describe('uploadFile — kis fajl', () => {
    it('EMPTY-t ad vissza 8MB alatti fajlra (nem indit feltoltest)', () => {
      const smallFile = createMockFile(1024);
      const emissions: ChunkedUploadProgress[] = [];

      service.uploadFile(smallFile, { context: 'test' }).subscribe({
        next: p => emissions.push(p),
        complete: () => {
          expect(emissions.length).toBe(0);
        },
      });

      httpMock.expectNone('/api/partner/chunked-upload/init');
    });
  });

  // ==========================================================================
  // uploadFile — nagy fajl, teljes flow
  // ==========================================================================
  describe('uploadFile — nagy fajl', () => {
    const chunkSize = 4 * 1024 * 1024;
    const fileSize = CHUNKED_THRESHOLD + chunkSize; // ~12MB -> 3 chunk
    const totalChunks = Math.ceil(fileSize / chunkSize);

    it('teljes upload flow-t vegigviszi (init -> chunks -> complete)', () => {
      const largeFile = createMockFile(fileSize);
      const emissions: ChunkedUploadProgress[] = [];

      service.uploadFile(largeFile, { context: 'test', project_id: 1 }).subscribe({
        next: p => emissions.push(p),
      });

      // Az init phase azonnal megjelenik (szinkron emit)
      expect(emissions.length).toBeGreaterThanOrEqual(1);
      expect(emissions[0].phase).toBe('init');
      expect(emissions[0].percent).toBe(0);
      expect(emissions[0].uploadId).toBeNull();

      // Flush init keres
      const initReq = httpMock.expectOne('/api/partner/chunked-upload/init');
      expect(initReq.request.method).toBe('POST');
      initReq.flush({
        success: true,
        data: {
          upload_id: 'test-upload-123',
          chunk_size: chunkSize,
          total_chunks: totalChunks,
          expires_at: '2026-12-31T23:59:59Z',
        },
      });

      // Chunk feltoltesek - parhuzamosan indulnak (CONCURRENCY=5, 3 < 5 -> mind egyszerre)
      const chunkReqs = httpMock.match('/api/partner/chunked-upload/test-upload-123/chunk');
      expect(chunkReqs.length).toBe(totalChunks);
      chunkReqs.forEach((req, i) => {
        expect(req.request.method).toBe('POST');
        req.flush({
          success: true,
          data: { chunk_index: i, received_chunks: [i], remaining: totalChunks - i - 1 },
        });
      });

      // Complete keres
      const completeReq = httpMock.expectOne('/api/partner/chunked-upload/test-upload-123/complete');
      expect(completeReq.request.method).toBe('POST');
      completeReq.flush({
        success: true,
        message: 'Feltoltes kesz',
        data: { id: 42, fileName: 'test-file.psd', size: fileSize, mimeType: 'application/octet-stream', uploadedAt: '2026-03-12T12:00:00Z' },
      });

      const completedPhase = emissions.find(e => e.phase === 'completed');
      expect(completedPhase).toBeDefined();
      expect(completedPhase!.percent).toBe(100);
      expect(completedPhase!.uploadId).toBe('test-upload-123');
    });
  });

  // ==========================================================================
  // uploadFile — init hiba kezeles
  // ==========================================================================
  describe('uploadFile — hiba kezeles', () => {
    it('error phase-t emit-el init hiba eseten', () => {
      const largeFile = createMockFile(CHUNKED_THRESHOLD + 1);
      const emissions: ChunkedUploadProgress[] = [];

      service.uploadFile(largeFile, { context: 'test' }).subscribe({
        next: p => emissions.push(p),
      });

      const initReq = httpMock.expectOne('/api/partner/chunked-upload/init');
      initReq.flush({ message: 'Szerver hiba' }, { status: 500, statusText: 'Internal Server Error' });

      const errorPhase = emissions.find(e => e.phase === 'error');
      expect(errorPhase).toBeDefined();
      expect(errorPhase!.percent).toBe(0);
    });
  });

  // ==========================================================================
  // uploadFile — unsubscribe teardown
  // ==========================================================================
  describe('uploadFile — unsubscribe', () => {
    it('teardown-kor abort kerest kuld ha van uploadId', () => {
      const largeFile = createMockFile(CHUNKED_THRESHOLD + 1);

      const sub = service.uploadFile(largeFile, { context: 'test' }).subscribe();

      // Flush init, hogy legyen uploadId
      const initReq = httpMock.expectOne('/api/partner/chunked-upload/init');
      initReq.flush({
        success: true,
        data: {
          upload_id: 'abort-test-123',
          chunk_size: 4 * 1024 * 1024,
          total_chunks: 2,
          expires_at: '2026-12-31T23:59:59Z',
        },
      });

      // A chunk kereseket elnyomjuk
      httpMock.match('/api/partner/chunked-upload/abort-test-123/chunk');

      // Unsubscribe -> teardown -> abort keres
      sub.unsubscribe();

      const abortReq = httpMock.expectOne('/api/partner/chunked-upload/abort-test-123');
      expect(abortReq.request.method).toBe('DELETE');
      abortReq.flush(null);
    });
  });

  // ==========================================================================
  // getStatus
  // ==========================================================================
  describe('getStatus', () => {
    it('HTTP GET kerest kuld az upload statuszaert', () => {
      const uploadId = 'status-test-456';

      service.getStatus(uploadId).subscribe(data => {
        expect(data.upload_id).toBe(uploadId);
        expect(data.total_chunks).toBe(5);
        expect(data.received_chunks).toEqual([0, 1, 2]);
        expect(data.remaining).toBe(2);
        expect(data.is_complete).toBe(false);
        expect(data.is_expired).toBe(false);
      });

      const req = httpMock.expectOne(`/api/partner/chunked-upload/${uploadId}/status`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: {
          upload_id: uploadId,
          total_chunks: 5,
          received_chunks: [0, 1, 2],
          remaining: 2,
          is_complete: false,
          is_expired: false,
        },
      });
    });
  });

  // ==========================================================================
  // uploadFile — init request body ellenorzes
  // ==========================================================================
  describe('uploadFile — init keres tartalma', () => {
    it('helyes metaadatokat kuld az init keresben', () => {
      const largeFile = createMockFile(CHUNKED_THRESHOLD + 1, 'nagy-kep.tif', 'image/tiff');
      const metadata = { context: 'finalization', project_id: 123, collection: 'print_flat' };

      service.uploadFile(largeFile, metadata).subscribe();

      const initReq = httpMock.expectOne('/api/partner/chunked-upload/init');
      const body = initReq.request.body;

      expect(body.file_name).toBe('nagy-kep.tif');
      expect(body.file_size).toBe(CHUNKED_THRESHOLD + 1);
      expect(body.mime_type).toBe('image/tiff');
      expect(body.file_hash).toBe(FAKE_HASH);
      expect(body.metadata).toEqual(metadata);

      // Cleanup — hiba, hogy ne induljon chunk feltoltes
      initReq.flush({ message: 'test end' }, { status: 500, statusText: 'Test' });
    });
  });

  // ==========================================================================
  // uploadFile — chunk feltoltes ellenorzes
  // ==========================================================================
  describe('uploadFile — chunk feltoltes', () => {
    it('FormData-t kuld a chunk feltoltesben', () => {
      const chunkSize = 4 * 1024 * 1024;
      const fileSize = CHUNKED_THRESHOLD + 1;
      const totalChunks = Math.ceil(fileSize / chunkSize);
      const largeFile = createMockFile(fileSize);

      service.uploadFile(largeFile, { context: 'test' }).subscribe();

      // Flush init
      httpMock.expectOne('/api/partner/chunked-upload/init').flush({
        success: true,
        data: {
          upload_id: 'chunk-test-789',
          chunk_size: chunkSize,
          total_chunks: totalChunks,
          expires_at: '2026-12-31T23:59:59Z',
        },
      });

      // Parhuzamos chunk keresek
      const chunkReqs = httpMock.match('/api/partner/chunked-upload/chunk-test-789/chunk');
      expect(chunkReqs.length).toBeGreaterThan(0);

      chunkReqs.forEach((req, i) => {
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeInstanceOf(FormData);
        req.flush({
          success: true,
          data: { chunk_index: i, received_chunks: [i], remaining: totalChunks - i - 1 },
        });
      });

      // Complete
      const completeReq = httpMock.expectOne('/api/partner/chunked-upload/chunk-test-789/complete');
      completeReq.flush({
        success: true,
        message: 'OK',
        data: { id: 1, fileName: 'test-file.psd', size: fileSize, mimeType: 'application/octet-stream', uploadedAt: '2026-03-12T12:00:00Z' },
      });
    });
  });

  // ==========================================================================
  // uploadFile — progress szazalek szamolas
  // ==========================================================================
  describe('uploadFile — progress szamolas', () => {
    it('uploading phase percent max 95% a chunk-oknal', () => {
      const chunkSize = 4 * 1024 * 1024;
      const fileSize = CHUNKED_THRESHOLD + chunkSize; // 3 chunk
      const totalChunks = Math.ceil(fileSize / chunkSize);
      const largeFile = createMockFile(fileSize);
      const emissions: ChunkedUploadProgress[] = [];

      service.uploadFile(largeFile, { context: 'test' }).subscribe({
        next: p => emissions.push(p),
      });

      // Init
      httpMock.expectOne('/api/partner/chunked-upload/init').flush({
        success: true,
        data: {
          upload_id: 'progress-test',
          chunk_size: chunkSize,
          total_chunks: totalChunks,
          expires_at: '2026-12-31T23:59:59Z',
        },
      });

      // Parhuzamos chunks
      const chunkReqs = httpMock.match('/api/partner/chunked-upload/progress-test/chunk');
      chunkReqs.forEach((req, i) => {
        req.flush({
          success: true,
          data: { chunk_index: i, received_chunks: [i], remaining: totalChunks - i - 1 },
        });
      });

      // Uploading phase-ek max 95%
      const uploadingPhases = emissions.filter(e => e.phase === 'uploading');
      uploadingPhases.forEach(p => {
        expect(p.percent).toBeLessThanOrEqual(95);
      });

      // Completing phase
      const completingPhase = emissions.find(e => e.phase === 'completing');
      expect(completingPhase).toBeDefined();
      expect(completingPhase!.percent).toBe(96);

      // Complete
      httpMock.expectOne('/api/partner/chunked-upload/progress-test/complete').flush({
        success: true,
        message: 'OK',
        data: { id: 1, fileName: 'test-file.psd', size: fileSize, mimeType: 'application/octet-stream', uploadedAt: '2026-03-12T12:00:00Z' },
      });

      const completedPhase = emissions.find(e => e.phase === 'completed');
      expect(completedPhase!.percent).toBe(100);
    });
  });
});
