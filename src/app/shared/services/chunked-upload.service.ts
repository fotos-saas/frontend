import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, EMPTY, timer, Subject, merge } from 'rxjs';
import { concatMap, map, catchError, retry, tap, toArray } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Types ───

export interface ChunkedUploadProgress {
  phase: 'init' | 'uploading' | 'completing' | 'completed' | 'error';
  chunkIndex: number;
  totalChunks: number;
  percent: number;
  uploadId: string | null;
  errorMessage?: string;
}

interface InitResponse {
  success: boolean;
  data: {
    upload_id: string;
    chunk_size: number;
    total_chunks: number;
    expires_at: string;
  };
}

interface ChunkResponse {
  success: boolean;
  data: {
    chunk_index: number;
    received_chunks: number[];
    remaining: number;
  };
}

interface CompleteResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
}

interface StatusResponse {
  success: boolean;
  data: {
    upload_id: string;
    total_chunks: number;
    received_chunks: number[];
    remaining: number;
    is_complete: boolean;
    is_expired: boolean;
  };
}

// ─── Küszöb: fájlok ennél nagyobb méret felett chunked módban mennek ───
const CHUNKED_THRESHOLD = 8 * 1024 * 1024; // 8MB

/**
 * Generikus chunked upload service — automatikusan darabolja a nagy fájlokat.
 *
 * Használat:
 * ```ts
 * this.chunkedUpload.uploadFile(file, { context: 'finalization', project_id: 123, collection: 'print_flat' })
 *   .subscribe(progress => console.log(progress.percent));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ChunkedUploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/partner/chunked-upload`;
  private readonly MAX_RETRIES = 3;
  private readonly CONCURRENCY = 5; // Párhuzamos chunk feltöltések száma

  /**
   * Fájl feltöltése — automatikusan chunked ha >8MB.
   * @returns Observable<ChunkedUploadProgress> a progress állapottal
   */
  uploadFile(
    file: File,
    metadata: Record<string, unknown>,
  ): Observable<ChunkedUploadProgress> {
    if (file.size < CHUNKED_THRESHOLD) {
      return EMPTY; // Kis fájlok a hagyományos úton mennek
    }

    return new Observable<ChunkedUploadProgress>(subscriber => {
      let uploadId: string | null = null;
      let innerSub: { unsubscribe(): void } | null = null;

      // 1. Init
      subscriber.next({ phase: 'init', chunkIndex: 0, totalChunks: 0, percent: 0, uploadId: null });

      innerSub = this.initUpload(file, metadata).pipe(
        concatMap(initData => {
          uploadId = initData.upload_id;
          const chunkSize = initData.chunk_size;
          const totalChunks = initData.total_chunks;

          // 2. Párhuzamos chunk feltöltés (CONCURRENCY darab egyszerre)
          let completedCount = 0;
          const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);

          // Chunk-ok CONCURRENCY darabos csoportokra bontása
          const batches: number[][] = [];
          for (let i = 0; i < chunkIndices.length; i += this.CONCURRENCY) {
            batches.push(chunkIndices.slice(i, i + this.CONCURRENCY));
          }

          // Batch-ek szekvenciálisan, batch-en belül párhuzamosan
          return from(batches).pipe(
            concatMap(batch => {
              const chunkUploads$ = batch.map(index =>
                this.uploadChunk(uploadId!, file, index, chunkSize).pipe(
                  retry({
                    count: this.MAX_RETRIES,
                    delay: (_, attempt) => timer(Math.pow(2, attempt) * 1000),
                  }),
                  tap(() => {
                    completedCount++;
                    subscriber.next({
                      phase: 'uploading',
                      chunkIndex: completedCount,
                      totalChunks,
                      percent: Math.round((completedCount / totalChunks) * 95),
                      uploadId,
                    });
                  }),
                ),
              );
              // Párhuzamos futtatás a batch-en belül, megvárjuk mindet
              return merge(...chunkUploads$).pipe(toArray());
            }),
            toArray(),
            // 3. Complete — minden chunk kész
            concatMap(() => {
              subscriber.next({
                phase: 'completing', chunkIndex: totalChunks, totalChunks, percent: 96, uploadId,
              });
              return this.completeUpload(uploadId!).pipe(
                map(() => ({
                  phase: 'completed' as const,
                  chunkIndex: totalChunks,
                  totalChunks,
                  percent: 100,
                  uploadId,
                })),
              );
            }),
          );
        }),
      ).subscribe({
        next: progress => subscriber.next(progress),
        error: err => {
          subscriber.next({
            phase: 'error',
            chunkIndex: 0,
            totalChunks: 0,
            percent: 0,
            uploadId,
            errorMessage: err?.error?.message || err?.message || 'Feltöltési hiba',
          });
          if (uploadId) {
            this.abortUpload(uploadId).subscribe();
          }
          subscriber.complete();
        },
        complete: () => subscriber.complete(),
      });

      // Teardown: ha a subscriber unsubscribe-ol, leállítjuk + abort
      return () => {
        innerSub?.unsubscribe();
        if (uploadId) {
          this.abortUpload(uploadId).subscribe();
        }
      };
    });
  }

  /**
   * Ellenőrzi, hogy a fájl elég nagy-e chunked upload-hoz.
   */
  needsChunkedUpload(file: File): boolean {
    return file.size >= CHUNKED_THRESHOLD;
  }

  // ─── Privát HTTP hívások ───

  private initUpload(file: File, metadata: Record<string, unknown>): Observable<InitResponse['data']> {
    return from(this.computeFileHash(file)).pipe(
      concatMap(fileHash =>
        this.http.post<InitResponse>(`${this.baseUrl}/init`, {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          file_hash: fileHash,
          metadata,
        }).pipe(map(r => r.data)),
      ),
    );
  }

  private async computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private uploadChunk(
    uploadId: string,
    file: File,
    chunkIndex: number,
    chunkSize: number,
  ): Observable<ChunkResponse['data']> {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('chunk', blob, `chunk_${chunkIndex}`);

    return this.http.post<ChunkResponse>(`${this.baseUrl}/${uploadId}/chunk`, formData)
      .pipe(map(r => r.data));
  }

  private completeUpload(uploadId: string): Observable<CompleteResponse['data']> {
    return this.http.post<CompleteResponse>(`${this.baseUrl}/${uploadId}/complete`, {})
      .pipe(map(r => r.data));
  }

  private abortUpload(uploadId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uploadId}`).pipe(
      catchError(() => of(void 0 as void)),
    );
  }

  getStatus(uploadId: string): Observable<StatusResponse['data']> {
    return this.http.get<StatusResponse>(`${this.baseUrl}/${uploadId}/status`)
      .pipe(map(r => r.data));
  }
}
