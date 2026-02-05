import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { TabloStorageService } from './tablo-storage.service';

/**
 * Token típus (belépési mód)
 */
export type TokenType = 'code' | 'share' | 'preview' | 'unknown';

/**
 * Token Service - Token kezelés és tárolás
 *
 * Felelősségek:
 * - Token CRUD műveletek (set, get, clear)
 * - Token típus kezelése (code, share, preview)
 * - Token validáció
 * - canFinalize flag kezelése
 *
 * A tokenek projekt-specifikusan tárolódnak: `tablo:{projectId}:{sessionType}:*`
 * Ez lehetővé teszi több projekt párhuzamos használatát különböző tab-okban.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly storage = inject(TabloStorageService);

  /** Véglegesíthet-e (csak kódos belépés esetén true) */
  private readonly _canFinalize = signal<boolean>(false);
  readonly canFinalizeSignal = this._canFinalize.asReadonly();
  /** @deprecated Használj canFinalizeSignal-t helyette */
  readonly canFinalize$: Observable<boolean> = toObservable(this._canFinalize);

  /** Token típus */
  private readonly _tokenType = signal<TokenType>('unknown');
  readonly tokenTypeSignal = this._tokenType.asReadonly();
  /** @deprecated Használj tokenTypeSignal-t helyette */
  readonly tokenType$: Observable<TokenType> = toObservable(this._tokenType);

  constructor() {
    const initialState = this.initializeFromStorage();
    this._canFinalize.set(initialState.canFinalize);
    this._tokenType.set(initialState.tokenType);
  }

  /**
   * Inicializálás localStorage-ból
   */
  private initializeFromStorage(): {
    canFinalize: boolean;
    tokenType: TokenType;
  } {
    const activeSession = this.storage.getActiveSession();
    if (!activeSession) {
      return { canFinalize: false, tokenType: 'unknown' };
    }

    const { projectId, sessionType } = activeSession;
    return {
      canFinalize: this.storage.getCanFinalize(projectId, sessionType),
      tokenType: sessionType
    };
  }

  /**
   * Van-e érvényes token
   *
   * Share session esetén a guest_session token is elegendő az autentikációhoz,
   * nem szükséges normál auth token.
   */
  hasToken(): boolean {
    // Normál auth token ellenőrzés
    if (this.getToken()) {
      return true;
    }

    // Share session esetén guest_session is elég
    const activeSession = this.storage.getActiveSession();
    if (activeSession?.sessionType === 'share') {
      return !!this.storage.getGuestSession(activeSession.projectId, 'share');
    }

    return false;
  }

  /**
   * Token lekérése (aktív session-höz)
   */
  getToken(): string | null {
    const activeSession = this.storage.getActiveSession();
    if (!activeSession) return null;
    return this.storage.getAuthToken(activeSession.projectId, activeSession.sessionType);
  }

  /**
   * Token tárolása
   */
  setToken(projectId: number, sessionType: TokenType, token: string): void {
    this.storage.setAuthToken(projectId, sessionType, token);
  }

  /**
   * Token törlése
   */
  clearToken(): void {
    this.storage.clearCurrentSessionAuth();
    this._canFinalize.set(false);
    this._tokenType.set('unknown');
  }

  /**
   * Véglegesíthet-e flag tárolása
   */
  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.storage.setCanFinalize(projectId, sessionType, canFinalize);
    this._canFinalize.set(canFinalize);
  }

  /**
   * Véglegesíthet-e szinkron lekérése
   */
  canFinalize(): boolean {
    return this._canFinalize();
  }

  /**
   * Token típus tárolása
   */
  setTokenType(tokenType: TokenType): void {
    this._tokenType.set(tokenType);
  }

  /**
   * Token típus szinkron lekérése
   */
  getTokenType(): TokenType {
    return this._tokenType();
  }

  /**
   * Token típus frissítése canFinalize-zel együtt
   */
  updateTokenMetadata(
    projectId: number,
    sessionType: TokenType,
    canFinalize: boolean
  ): void {
    this.setCanFinalize(projectId, sessionType, canFinalize);
    this.setTokenType(sessionType);
  }

  /**
   * Újrainicializálás localStorage-ból (session váltáshoz)
   */
  reinitialize(): void {
    const state = this.initializeFromStorage();
    this._canFinalize.set(state.canFinalize);
    this._tokenType.set(state.tokenType);
  }
}
