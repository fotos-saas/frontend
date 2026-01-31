import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  /** Véglegesíthet-e (csak kódos belépés esetén true) */
  private canFinalizeSubject: BehaviorSubject<boolean>;
  public canFinalize$: Observable<boolean>;

  /** Token típus */
  private tokenTypeSubject: BehaviorSubject<TokenType>;
  public tokenType$: Observable<TokenType>;

  constructor(private storage: TabloStorageService) {
    const initialState = this.initializeFromStorage();

    this.canFinalizeSubject = new BehaviorSubject<boolean>(initialState.canFinalize);
    this.canFinalize$ = this.canFinalizeSubject.asObservable();

    this.tokenTypeSubject = new BehaviorSubject<TokenType>(initialState.tokenType);
    this.tokenType$ = this.tokenTypeSubject.asObservable();
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
    this.canFinalizeSubject.next(false);
    this.tokenTypeSubject.next('unknown');
  }

  /**
   * Véglegesíthet-e flag tárolása
   */
  setCanFinalize(projectId: number, sessionType: TokenType, canFinalize: boolean): void {
    this.storage.setCanFinalize(projectId, sessionType, canFinalize);
    this.canFinalizeSubject.next(canFinalize);
  }

  /**
   * Véglegesíthet-e szinkron lekérése
   */
  canFinalize(): boolean {
    return this.canFinalizeSubject.getValue();
  }

  /**
   * Token típus tárolása
   */
  setTokenType(tokenType: TokenType): void {
    this.tokenTypeSubject.next(tokenType);
  }

  /**
   * Token típus szinkron lekérése
   */
  getTokenType(): TokenType {
    return this.tokenTypeSubject.getValue();
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
    this.canFinalizeSubject.next(state.canFinalize);
    this.tokenTypeSubject.next(state.tokenType);
  }
}
