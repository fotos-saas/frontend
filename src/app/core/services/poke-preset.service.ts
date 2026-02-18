import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { GuestService } from './guest.service';
import {
  PokePreset,
  PokeCategory,
  MissingCategory,
  MissingSummary,
  ApiPokePresetResponse,
  ApiMissingUserResponse,
  ApiMissingCategoryResponse,
  MissingUser,
  UserPokeStatus,
} from '../models/poke.models';

/**
 * Poke Preset Service
 *
 * Preset üzenetek és hiányzó felhasználók kezelése.
 */
@Injectable({
  providedIn: 'root'
})
export class PokePresetService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly guestService = inject(GuestService);
  private readonly apiUrl = `${environment.apiUrl}/tablo-frontend`;

  // === SIGNALS ===

  /** Preset üzenetek */
  readonly presets = signal<PokePreset[]>([]);

  /** Hiányzók kategóriánként */
  readonly missingCategories = signal<{
    voting: MissingCategory | null;
    photoshoot: MissingCategory | null;
    image_selection: MissingCategory | null;
  }>({
    voting: null,
    photoshoot: null,
    image_selection: null
  });

  /** Hiányzók összesítés */
  readonly missingSummary = signal<MissingSummary | null>(null);

  /** Töltés állapot */
  readonly loading = signal<boolean>(false);

  // === COMPUTED HELPERS ===

  /** Preset-ek kategória szerint */
  presetsForCategory(category: PokeCategory | null): PokePreset[] {
    const all = this.presets();
    if (!category) return all.filter(p => !p.category);
    return all.filter(p => !p.category || p.category === category);
  }

  // === API CALLS ===

  /**
   * Preset üzenetek betöltése
   */
  loadPresets(category?: PokeCategory): Observable<PokePreset[]> {
    const options: { headers: HttpHeaders; params?: { category: PokeCategory } } = {
      headers: this.guestService.getGuestSessionHeader(),
      ...(category && { params: { category } })
    };

    return this.http.get<{ success: boolean; data: { presets: ApiPokePresetResponse[] } }>(
      `${this.apiUrl}/pokes/presets`, options
    ).pipe(
      map(response => response.data.presets.map(this.mapPreset)),
      tap(presets => this.presets.set(presets)),
      catchError(error => {
        this.logger.error('[Poke] Load presets error:', error);
        return of([]);
      })
    );
  }

  /**
   * Hiányzók betöltése összes kategóriában
   */
  loadMissingUsers(): Observable<boolean> {
    this.loading.set(true);

    return this.http.get<{
      success: boolean;
      data: {
        categories: {
          voting: ApiMissingCategoryResponse;
          photoshoot: ApiMissingCategoryResponse;
          image_selection: ApiMissingCategoryResponse;
        };
        summary: MissingSummary;
      };
    }>(`${this.apiUrl}/missing`, { headers: this.guestService.getGuestSessionHeader() }).pipe(
      tap(response => {
        if (response.success) {
          this.missingCategories.set({
            voting: this.mapMissingCategory(response.data.categories.voting),
            photoshoot: this.mapMissingCategory(response.data.categories.photoshoot),
            image_selection: this.mapMissingCategory(response.data.categories.image_selection)
          });
          this.missingSummary.set(response.data.summary);
        }
        this.loading.set(false);
      }),
      map(response => response.success),
      catchError(error => {
        this.logger.error('[Poke] Load missing users error:', error);
        this.loading.set(false);
        return of(false);
      })
    );
  }

  // === RESET ===

  clearPresets(): void {
    this.presets.set([]);
    this.missingCategories.set({
      voting: null,
      photoshoot: null,
      image_selection: null
    });
    this.missingSummary.set(null);
  }

  // === PRIVATE ===

  private mapPreset = (api: ApiPokePresetResponse): PokePreset => ({
    key: api.key,
    emoji: api.emoji,
    text: api.text,
    category: api.category
  });

  private mapMissingUser = (api: ApiMissingUserResponse): MissingUser => ({
    id: api.id,
    name: api.name,
    email: api.email,
    isExtra: api.is_extra,
    type: api.type,
    hasGuestSession: api.has_guest_session ?? false,
    guestSessionId: api.guest_session_id ?? null,
    lastActivityAt: api.last_activity_at,
    hasActivity: api.has_activity,
    createdAt: api.created_at,
    pokeStatus: {
      canPoke: api.poke_status.can_poke,
      reason: api.poke_status.reason ?? null,
      reasonHu: api.poke_status.reason_hu ?? null,
      totalPokesSent: api.poke_status.total_pokes_sent ?? 0,
      maxPokes: api.poke_status.max_pokes ?? 3
    } as UserPokeStatus
  });

  private mapMissingCategory = (api: ApiMissingCategoryResponse): MissingCategory => ({
    count: api.count,
    users: api.users.map(this.mapMissingUser),
    hasActivePoll: api.has_active_poll,
    activePollsCount: api.active_polls_count,
    totalMissingPhotos: api.total_missing_photos,
    message: api.message
  });
}
