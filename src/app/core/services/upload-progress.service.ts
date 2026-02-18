import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, from, of, interval, EMPTY } from 'rxjs';
import {
  concatMap,
  scan,
  map,
  catchError,
  switchMap,
  takeWhile,
  startWith,
  take,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  FileUploadProgress,
  UploadedPhotoResult,
  ZipProcessingStatus,
} from '../models/upload-progress.models';

/**
 * Közös feltöltési progress service.
 *
 * Két fő módszer:
 * 1. uploadFilesWithProgress() - Egyedi képek chunked feltöltése HTTP progress-szel
 * 2. uploadZipWithProgress() - ZIP feltöltés + backend polling a feldolgozáshoz
 */
@Injectable({ providedIn: 'root' })
export class UploadProgressService {
  private readonly http = inject(HttpClient);
  private readonly CHUNK_SIZE = 10;

  /**
   * Egyedi képek feltöltése chunk-olva, valós idejű progress-szel.
   * Minden chunk-nál byte-szintű HTTP progress + összesített állapot.
   */
  uploadFilesWithProgress(
    url: string,
    files: File[],
    fieldName = 'photos[]',
  ): Observable<FileUploadProgress> {
    const totalCount = files.length;
    const chunks = this.chunkArray(files, this.CHUNK_SIZE);
    const totalChunks = chunks.length;

    if (files.length === 0) {
      return of(this.createCompletedState(totalCount));
    }

    return from(chunks.map((chunk, index) => ({ chunk, index }))).pipe(
      concatMap(({ chunk, index }) =>
        this.uploadChunkWithProgress(url, chunk, fieldName, index, totalChunks),
      ),
      scan(
        (acc: FileUploadProgress, event: ChunkEvent) => {
          if (event.type === 'progress') {
            // Byte-szintű progress az aktuális chunk-on belül
            const completedChunksProgress = (event.chunkIndex / totalChunks) * 100;
            const currentChunkProgress = (event.loaded / event.total) * (1 / totalChunks) * 100;
            const overallProgress = Math.round(completedChunksProgress + currentChunkProgress);

            return {
              ...acc,
              phase: 'uploading' as const,
              transferProgress: Math.round((event.loaded / event.total) * 100),
              overallProgress: Math.min(overallProgress, 99), // 100 csak completed-nél
              currentChunk: event.chunkIndex + 1,
            };
          }

          // Chunk kész
          const newUploadedCount = acc.uploadedCount + event.uploadedCount;
          const newPhotos = [...acc.photos, ...event.photos];
          const newErrorCount = acc.errorCount + (event.error ? this.CHUNK_SIZE : 0);
          const currentChunk = event.chunkIndex + 1;
          const isCompleted = currentChunk === totalChunks;

          return {
            ...acc,
            phase: isCompleted ? 'completed' as const : 'uploading' as const,
            transferProgress: 100,
            overallProgress: isCompleted ? 100 : Math.round((currentChunk / totalChunks) * 100),
            currentChunk,
            uploadedCount: newUploadedCount,
            totalCount,
            errorCount: newErrorCount,
            completed: isCompleted,
            photos: newPhotos,
          };
        },
        this.createInitialState(totalCount, totalChunks),
      ),
    );
  }

  /**
   * ZIP fájl feltöltése HTTP progress-szel + backend polling.
   * 1. fázis (0-40%): ZIP feltöltés byte-szintű progress
   * 2. fázis (40-100%): Backend feldolgozás polling
   */
  uploadZipWithProgress(
    uploadUrl: string,
    zipFile: File,
    statusUrl: string,
  ): Observable<FileUploadProgress> {
    return new Observable<FileUploadProgress>((subscriber) => {
      const state = this.createInitialState(0, 1);
      subscriber.next(state);

      const formData = new FormData();
      formData.append('zip', zipFile);

      const req = new HttpRequest('POST', uploadUrl, formData, {
        reportProgress: true,
      });

      this.http.request(req).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const transferPct = Math.round((event.loaded / event.total) * 100);
            subscriber.next({
              ...state,
              phase: 'uploading',
              transferProgress: transferPct,
              overallProgress: Math.round(transferPct * 0.4), // 0-40% sáv
            });
          } else if (event.type === HttpEventType.Response) {
            const body = event.body as {
              success: boolean;
              async?: boolean;
              batchId?: string;
              uploadedCount?: number;
              photos?: UploadedPhotoResult[];
            };

            if (body?.async && body.batchId) {
              // Async feldolgozás → polling indítás
              this.pollZipStatus(statusUrl.replace('{batchId}', body.batchId))
                .subscribe({
                  next: (pollState) => subscriber.next(pollState),
                  error: (err) => subscriber.error(err),
                  complete: () => subscriber.complete(),
                });
            } else {
              // Szinkron feldolgozás (régi mód, backward compat)
              subscriber.next({
                ...state,
                phase: 'completed',
                transferProgress: 100,
                processingProgress: 100,
                overallProgress: 100,
                uploadedCount: body?.uploadedCount ?? 0,
                totalCount: body?.uploadedCount ?? 0,
                completed: true,
                photos: (body?.photos ?? []) as UploadedPhotoResult[],
              });
              subscriber.complete();
            }
          }
        },
        error: (err) => {
          subscriber.next({
            ...state,
            phase: 'error',
            errorMessage: err.error?.message ?? 'Hiba történt a feltöltés során',
          });
          subscriber.error(err);
        },
      });
    });
  }

  // === PRIVATE ===

  /** Egy chunk feltöltése HTTP progress event-ekkel */
  private uploadChunkWithProgress(
    url: string,
    files: File[],
    fieldName: string,
    chunkIndex: number,
    _totalChunks: number,
  ): Observable<ChunkEvent> {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));

    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true,
    });

    return this.http.request(req).pipe(
      concatMap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          return of({
            type: 'progress' as const,
            chunkIndex,
            loaded: event.loaded,
            total: event.total,
          });
        }
        if (event.type === HttpEventType.Response) {
          const body = event.body as {
            uploadedCount?: number;
            photos?: UploadedPhotoResult[];
          };
          return of({
            type: 'complete' as const,
            chunkIndex,
            uploadedCount: body?.uploadedCount ?? 0,
            photos: (body?.photos ?? []) as UploadedPhotoResult[],
            error: false,
          });
        }
        return EMPTY;
      }),
      catchError(() =>
        of({
          type: 'complete' as const,
          chunkIndex,
          uploadedCount: 0,
          photos: [] as UploadedPhotoResult[],
          error: true,
        }),
      ),
    );
  }

  /** Backend ZIP feldolgozás polling (max 200 poll = ~5 perc) */
  private pollZipStatus(statusUrl: string): Observable<FileUploadProgress> {
    let pollCount = 0;
    const MAX_POLLS = 200;

    return interval(1500).pipe(
      startWith(0),
      take(MAX_POLLS),
      switchMap(() => {
        pollCount++;
        return this.http.get<ZipProcessingStatus>(statusUrl).pipe(
          catchError(() =>
            of({
              status: 'processing' as const,
              totalFiles: 0,
              processedFiles: 0,
              uploadedPhotos: [],
              errorMessage: undefined,
            } as ZipProcessingStatus),
          ),
        );
      }),
      map((status) => {
        const processingPct =
          status.totalFiles > 0
            ? Math.round((status.processedFiles / status.totalFiles) * 100)
            : 0;
        const overallProgress = 40 + Math.round(processingPct * 0.6); // 40-100% sáv
        const isCompleted = status.status === 'completed';
        const isError = status.status === 'error';
        const isTimeout = pollCount >= MAX_POLLS && !isCompleted;

        return {
          phase: isError || isTimeout ? 'error' : isCompleted ? 'completed' : 'processing',
          transferProgress: 100,
          processingProgress: processingPct,
          overallProgress: isCompleted ? 100 : overallProgress,
          currentChunk: 1,
          totalChunks: 1,
          uploadedCount: status.processedFiles,
          totalCount: status.totalFiles,
          errorCount: 0,
          completed: isCompleted,
          errorMessage: isTimeout ? 'A feldolgozás túl sokáig tart. Frissítsd az oldalt.' : status.errorMessage,
          photos: status.uploadedPhotos ?? [],
        } as FileUploadProgress;
      }),
      takeWhile((state) => !state.completed && state.phase !== 'error', true),
    );
  }

  private createInitialState(totalCount: number, totalChunks: number): FileUploadProgress {
    return {
      phase: 'uploading',
      transferProgress: 0,
      processingProgress: 0,
      overallProgress: 0,
      currentChunk: 0,
      totalChunks,
      uploadedCount: 0,
      totalCount,
      errorCount: 0,
      completed: false,
      photos: [],
    };
  }

  private createCompletedState(totalCount: number): FileUploadProgress {
    return {
      phase: 'completed',
      transferProgress: 100,
      processingProgress: 100,
      overallProgress: 100,
      currentChunk: 0,
      totalChunks: 0,
      uploadedCount: 0,
      totalCount,
      errorCount: 0,
      completed: true,
      photos: [],
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// === Internal Types ===

type ChunkEvent =
  | { type: 'progress'; chunkIndex: number; loaded: number; total: number }
  | { type: 'complete'; chunkIndex: number; uploadedCount: number; photos: UploadedPhotoResult[]; error: boolean };
