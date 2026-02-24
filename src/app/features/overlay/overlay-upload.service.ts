import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, from, of, concat } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { matchFilesToPersons, FileMatchResult } from '../../shared/utils/filename-matcher.util';

export interface PsLayerPerson {
  personId: number;
  layerName: string;
  slug: string;
  personName?: string;
  photoThumbUrl?: string | null;
  file?: File;
  uploadStatus: 'pending' | 'uploading' | 'done' | 'error';
  photoUrl?: string;
  errorMsg?: string;
  matchType?: 'exact' | 'smart' | 'ambiguous' | 'manual';
  matchConfidence?: number;
}

export interface BatchProgress {
  done: number;
  total: number;
  currentLayer?: string;
}

interface UploadResponse {
  success: boolean;
  message?: string;
  photo?: {
    mediaId: number;
    thumbUrl: string;
    url: string;
    version: number;
  };
}

interface PersonItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  photoThumbUrl: string | null;
}

@Injectable()
export class OverlayUploadService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  /**
   * Layer nevekbol parse-olja a slug---personId formatumot.
   * Nem megfelelo formatumu layereket kihagyja.
   */
  parseLayerNames(names: string[]): PsLayerPerson[] {
    const result: PsLayerPerson[] = [];
    for (const name of names) {
      const sepIdx = name.indexOf('---');
      if (sepIdx === -1) continue;
      const slug = name.substring(0, sepIdx);
      const idStr = name.substring(sepIdx + 3);
      const personId = parseInt(idStr, 10);
      if (isNaN(personId) || personId <= 0) continue;
      result.push({
        personId,
        layerName: name,
        slug,
        uploadStatus: 'pending',
      });
    }
    return result;
  }

  /**
   * Persons lista alapjan kitolti a personName mezot.
   */
  enrichWithPersons(layers: PsLayerPerson[], persons: PersonItem[]): PsLayerPerson[] {
    const personMap = new Map(persons.map(p => [p.id, p]));
    return layers.map(l => {
      const person = personMap.get(l.personId);
      return {
        ...l,
        personName: person?.name ?? l.slug,
        photoThumbUrl: person?.photoThumbUrl ?? l.photoThumbUrl ?? null,
      };
    });
  }

  /**
   * Fajlneveket parosit a layerekhez 2 lepcsős matching-gel:
   * 1. Gyors slug match (meglevo logika)
   * 2. Intelligens nev match (filename-matcher.util.ts Levenshtein + szo-atrendezes)
   */
  matchFilesToLayers(files: File[], layers: PsLayerPerson[], persons?: PersonItem[]): {
    matched: PsLayerPerson[];
    unmatched: File[];
  } {
    const updatedLayers = layers.map(l => ({ ...l }));
    const usedFiles = new Set<File>();

    // 1. lepcso: slug-based matching
    for (const file of files) {
      const fileSlug = this.normalizeSlug(this.removeExtension(file.name));
      let bestMatch: PsLayerPerson | null = null;
      let bestScore = 0;

      for (const layer of updatedLayers) {
        if (layer.file) continue;
        const layerSlug = this.normalizeSlug(layer.personName || layer.slug);
        const score = this.matchScore(fileSlug, layerSlug);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = layer;
        }
      }

      if (bestMatch && bestScore >= 0.8) {
        bestMatch.file = file;
        bestMatch.matchType = bestScore === 1 ? 'exact' : 'smart';
        bestMatch.matchConfidence = Math.round(bestScore * 100);
        usedFiles.add(file);
      }
    }

    // 2. lepcso: intelligens nev matching a maradek fajlokra
    const remainingFiles = files.filter(f => !usedFiles.has(f));
    if (remainingFiles.length > 0 && persons && persons.length > 0) {
      // Csak azok a personok, akiknek van szabad layere
      const assignedPersonIds = new Set(
        updatedLayers.filter(l => l.file).map(l => l.personId)
      );
      const availablePersons = persons
        .filter(p => !assignedPersonIds.has(p.id))
        .map(p => ({ id: p.id, name: p.name }));

      if (availablePersons.length > 0) {
        const smartResults = matchFilesToPersons(remainingFiles, availablePersons);

        for (const result of smartResults) {
          if (result.personId === null) continue;

          const layer = updatedLayers.find(
            l => l.personId === result.personId && !l.file
          );
          if (!layer) continue;

          layer.file = result.file;
          layer.matchType = result.matchType === 'ambiguous' ? 'ambiguous' : 'smart';
          layer.matchConfidence = result.confidence;
          usedFiles.add(result.file);
        }
      }
    }

    const unmatched = files.filter(f => !usedFiles.has(f));
    return { matched: updatedLayers, unmatched };
  }

  /**
   * Batch feltoltes: sorban feltolti az osszes parosított fajlt.
   */
  uploadBatch(
    projectId: number,
    layers: PsLayerPerson[],
    onProgress: (progress: BatchProgress) => void,
    onLayerUpdate: (index: number, update: Partial<PsLayerPerson>) => void,
  ): Observable<PsLayerPerson[]> {
    const toUpload = layers
      .map((l, i) => ({ layer: l, index: i }))
      .filter(({ layer }) => layer.file && layer.uploadStatus !== 'done');

    const total = toUpload.length;
    let done = 0;

    if (total === 0) return of(layers);

    const result$ = new Subject<PsLayerPerson[]>();
    const updatedLayers = layers.map(l => ({ ...l }));

    const uploadNext = (idx: number) => {
      if (idx >= toUpload.length) {
        result$.next(updatedLayers);
        result$.complete();
        return;
      }

      const { layer, index } = toUpload[idx];
      onLayerUpdate(index, { uploadStatus: 'uploading' });
      onProgress({ done, total, currentLayer: layer.personName || layer.slug });

      const formData = new FormData();
      formData.append('photo', layer.file!);
      const url = `${environment.apiUrl}/partner/projects/${projectId}/persons/${layer.personId}/photo`;

      this.http.post<UploadResponse>(url, formData).subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            done++;
            updatedLayers[index] = {
              ...updatedLayers[index],
              uploadStatus: 'done',
              photoUrl: res.photo?.url,
              photoThumbUrl: res.photo?.thumbUrl ?? updatedLayers[index].photoThumbUrl,
            };
            onLayerUpdate(index, { uploadStatus: 'done', photoUrl: res.photo?.url, photoThumbUrl: res.photo?.thumbUrl });
            onProgress({ done, total });
            uploadNext(idx + 1);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            done++;
            const msg = err.error?.message || 'Feltöltési hiba';
            updatedLayers[index] = {
              ...updatedLayers[index],
              uploadStatus: 'error',
              errorMsg: msg,
            };
            onLayerUpdate(index, { uploadStatus: 'error', errorMsg: msg });
            onProgress({ done, total });
            uploadNext(idx + 1);
          });
        },
      });
    };

    uploadNext(0);
    return result$.asObservable();
  }

  /**
   * PS Smart Object frissites — placePhotos IPC hivas.
   */
  async placePhotosInPs(layers: PsLayerPerson[]): Promise<{ success: boolean; error?: string }> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API nem elérhető' };
    }

    const photosToPlace = layers
      .filter(l => l.uploadStatus === 'done' && l.photoUrl)
      .map(l => ({ layerName: l.layerName, photoUrl: l.photoUrl! }));

    if (photosToPlace.length === 0) {
      return { success: false, error: 'Nincs behelyezhető fotó' };
    }

    try {
      return await window.electronAPI.photoshop.placePhotos({ layers: photosToPlace });
    } catch (e) {
      return { success: false, error: 'PS kommunikációs hiba' };
    }
  }

  // ============ Slug normalizálás ============

  /**
   * Ékezet eltávolítás, lowercase, kötőjel normalizálás.
   */
  normalizeSlug(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // ekezetmentesites
      .toLowerCase()
      .replace(/[_\s]+/g, '-')         // szokoz/underscore → kotojel
      .replace(/[^a-z0-9-]/g, '')      // nem alfanumerikus torlese
      .replace(/-+/g, '-')             // tobbszoros kotojel
      .replace(/^-|-$/g, '');          // szeli kotojel
  }

  private removeExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  }

  /**
   * Matching score 0-1 kozott.
   * 1 = pontos match, 0.9 = egyik tartalmazza a masikat, 0 = nem parosithato.
   */
  private matchScore(fileSlug: string, layerSlug: string): number {
    if (fileSlug === layerSlug) return 1;
    if (fileSlug.includes(layerSlug) || layerSlug.includes(fileSlug)) return 0.9;
    // Levenshtein-jellegű ellenőrzés rövid nevek esetén
    if (Math.abs(fileSlug.length - layerSlug.length) <= 2) {
      const longer = fileSlug.length >= layerSlug.length ? fileSlug : layerSlug;
      const shorter = fileSlug.length < layerSlug.length ? fileSlug : layerSlug;
      let matches = 0;
      for (let i = 0; i < shorter.length; i++) {
        if (shorter[i] === longer[i]) matches++;
      }
      const ratio = matches / longer.length;
      if (ratio >= 0.8) return ratio;
    }
    return 0;
  }
}
