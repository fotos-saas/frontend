import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';
import { VOTING_API } from '../../features/voting/voting.constants';
import {
  Poll,
  CreatePollRequest,
  ApiPollResponse
} from '../models/voting.models';
import { mapPollFromApi } from '../helpers/vote-mappers';

/**
 * Vote CRUD Service
 *
 * Szavazás létrehozás, módosítás, törlés (kapcsolattartó funkciók).
 * FormData összeállítás média fájlokkal.
 */
@Injectable({
  providedIn: 'root'
})
export class VoteCrudService {
  constructor(
    private http: HttpClient,
    private guestService: GuestService
  ) {}

  /**
   * Új szavazás létrehozása (csak kapcsolattartó)
   * FormData-t használ ha van kép
   */
  createPoll(request: CreatePollRequest, coverImage?: File, mediaFiles?: File[]): Observable<Poll> {
    const formData = this.buildCreateFormData(request, coverImage, mediaFiles);

    return this.http.post<{ success: boolean; message: string; data: ApiPollResponse }>(
      `${environment.apiUrl}${VOTING_API.POLLS}`,
      formData
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        return mapPollFromApi(response.data);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás módosítása (csak kapcsolattartó)
   */
  updatePoll(id: number, data: Partial<CreatePollRequest>, mediaFiles?: File[], deleteMediaIds?: number[]): Observable<void> {
    const formData = this.buildUpdateFormData(data, mediaFiles, deleteMediaIds);

    // Laravel PUT method spoofing
    formData.append('_method', 'PUT');

    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.poll(id)}`,
      formData
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Szavazás törlése (csak kapcsolattartó)
   */
  deletePoll(id: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.apiUrl}${VOTING_API.poll(id)}`
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // === PRIVATE HELPERS ===

  private buildCreateFormData(request: CreatePollRequest, coverImage?: File, mediaFiles?: File[]): FormData {
    const formData = new FormData();

    formData.append('title', request.title);
    formData.append('type', request.type);

    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.is_multiple_choice !== undefined) {
      formData.append('is_multiple_choice', request.is_multiple_choice ? '1' : '0');
    }
    if (request.max_votes_per_guest !== undefined) {
      formData.append('max_votes_per_guest', request.max_votes_per_guest.toString());
    }
    if (request.show_results_before_vote !== undefined) {
      formData.append('show_results_before_vote', request.show_results_before_vote ? '1' : '0');
    }
    if (request.close_at) {
      formData.append('close_at', request.close_at);
    }

    // Opciók
    if (request.options) {
      request.options.forEach((option, index) => {
        formData.append(`options[${index}][label]`, option.label);
        if (option.description) {
          formData.append(`options[${index}][description]`, option.description);
        }
      });
    }

    // Borítókép (legacy support)
    if (coverImage) {
      formData.append('cover_image', coverImage, coverImage.name);
    }

    // Média fájlok (max 5, 10MB/kép)
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file, file.name);
      });
    }

    return formData;
  }

  private buildUpdateFormData(data: Partial<CreatePollRequest>, mediaFiles?: File[], deleteMediaIds?: number[]): FormData {
    const formData = new FormData();

    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description || '');
    }
    if (data.is_multiple_choice !== undefined) {
      formData.append('is_multiple_choice', data.is_multiple_choice ? '1' : '0');
    }
    if (data.max_votes_per_guest !== undefined) {
      formData.append('max_votes_per_guest', data.max_votes_per_guest.toString());
    }
    if (data.show_results_before_vote !== undefined) {
      formData.append('show_results_before_vote', data.show_results_before_vote ? '1' : '0');
    }
    if (data.close_at !== undefined) {
      formData.append('close_at', data.close_at || '');
    }

    // Média fájlok törlése
    if (deleteMediaIds && deleteMediaIds.length > 0) {
      deleteMediaIds.forEach((mediaId, index) => {
        formData.append(`delete_media_ids[${index}]`, mediaId.toString());
      });
    }

    // Új média fájlok
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file, file.name);
      });
    }

    return formData;
  }

  private handleError(error: { error?: { message?: string; requires_class_size?: boolean }; status?: number }): Observable<never> {
    let message = 'Hiba történt. Próbáld újra!';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Nincs internetkapcsolat.';
    }

    return throwError(() => new Error(message));
  }
}
