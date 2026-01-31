import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GuestService } from './guest.service';

/**
 * Mention participant (keresési találat)
 */
export interface MentionParticipant {
  id: string;
  type: 'guest' | 'contact';
  name: string;
  display: string;
}

/**
 * Mention Service
 *
 * @mention autocomplete kezelés.
 * Participants keresése a backend-en.
 */
@Injectable({
  providedIn: 'root'
})
export class MentionService {
  private readonly http = inject(HttpClient);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  /**
   * Résztvevők keresése
   * @param query Keresési kifejezés
   * @param limit Maximum találatok száma
   */
  searchParticipants(query: string, limit = 10): Observable<MentionParticipant[]> {
    if (!query || query.length < 1) {
      return of([]);
    }

    const headers = this.guestService.getGuestSessionHeader();
    return this.http.get<{ success: boolean; data: MentionParticipant[] }>(
      `${this.apiUrl}/participants/search`,
      {
        headers,
        params: { q: query, limit: limit.toString() }
      }
    ).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Autocomplete keresés debounce-szal
   * @param input$ Observable keresési kifejezés
   */
  createAutocomplete(input$: Observable<string>): Observable<MentionParticipant[]> {
    return input$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(query => this.searchParticipants(query))
    );
  }

  /**
   * Mention szöveg formázása a tartalomban
   * A @név-eket linkké alakítja
   */
  formatMentions(content: string, mentions: string[]): string {
    if (!mentions || mentions.length === 0) return content;

    let formatted = content;
    for (const mention of mentions) {
      const regex = new RegExp(`@${this.escapeRegex(mention)}`, 'g');
      formatted = formatted.replace(
        regex,
        `<span class="mention">@${mention}</span>`
      );
    }
    return formatted;
  }

  /**
   * Regex speciális karakterek escape-elése
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
