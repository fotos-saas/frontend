import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabloStorageService, StoredSession } from '../core/services/tablo-storage.service';
import { TokenType } from '../core/services/token.service';
import { AuthService } from '../core/services/auth.service';

/**
 * Session Chooser Component
 *
 * Fullscreen fiók választó - Netflix/Google minta alapján.
 * Megjelenik, ha több tárolt session van és nincs aktív.
 */
@Component({
  selector: 'app-session-chooser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-chooser.component.html',
  styleUrl: './session-chooser.component.scss',
})
export class SessionChooserComponent implements OnInit {
  private readonly storage = inject(TabloStorageService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /** Tárolt session-ök */
  readonly sessions = signal<StoredSession[]>([]);

  /** Session törlés megerősítés */
  readonly confirmDelete = signal<StoredSession | null>(null);

  ngOnInit(): void {
    this.loadSessions();
  }

  /**
   * Session-ök betöltése és rendezése
   */
  private loadSessions(): void {
    const stored = this.storage.getStoredSessions();

    // Rendezés típus szerint: code → share → preview
    const typeOrder: Record<string, number> = {
      'code': 1,      // Kapcsolattartó
      'share': 2,     // Vendég
      'preview': 3    // Előnézet
    };

    const sorted = [...stored].sort((a, b) => {
      const orderA = typeOrder[a.sessionType] ?? 99;
      const orderB = typeOrder[b.sessionType] ?? 99;
      return orderA - orderB;
    });

    this.sessions.set(sorted);

    // Ha nincs session, irányítsuk a login-ra
    if (stored.length === 0) {
      this.router.navigate(['/login']);
      return;
    }

    // Ha csak egy session van, automatikusan aktiváljuk
    if (stored.length === 1) {
      this.selectSession(stored[0]);
    }
  }

  /**
   * Session kiválasztása
   */
  selectSession(session: StoredSession): void {
    // Auth állapot visszaállítása a tárolt session-ből
    const restored = this.authService.restoreSession(session.projectId, session.sessionType);

    if (restored) {
      // Sikeres - navigálás a főoldalra
      this.router.navigate(['/home']);
    } else {
      // Nem sikerült - töröljük a hibás session-t és frissítjük a listát
      this.storage.removeSession(session.projectId, session.sessionType);
      this.loadSessions();
    }
  }

  /**
   * Új belépés - navigálás a login oldalra
   * A ?newLogin=true query param lehetővé teszi a login oldal elérését
   * akkor is, ha van aktív session (NoAuthGuard ezt kezeli).
   */
  newLogin(): void {
    this.router.navigate(['/login'], { queryParams: { newLogin: 'true' } });
  }

  /**
   * Session törlés indítása (megerősítés kérés)
   */
  startDeleteSession(event: Event, session: StoredSession): void {
    event.stopPropagation();
    this.confirmDelete.set(session);
  }

  /**
   * Session törlés megerősítése
   */
  confirmDeleteSession(): void {
    const session = this.confirmDelete();
    if (!session) return;

    // Session eltávolítása a registry-ből
    this.storage.removeSession(session.projectId, session.sessionType);

    // Session adatok törlése
    this.storage.clearSessionAuth(session.projectId, session.sessionType);

    // Lista frissítése
    this.confirmDelete.set(null);
    this.loadSessions();
  }

  /**
   * Törlés mégse
   */
  cancelDelete(): void {
    this.confirmDelete.set(null);
  }

  /**
   * Session típus label
   */
  getSessionTypeLabel(sessionType: TokenType): string {
    switch (sessionType) {
      case 'code':
        return 'Kapcsolattartó';
      case 'share':
        return 'Vendég';
      case 'preview':
        return 'Előnézet';
      default:
        return '';
    }
  }

  /**
   * Icon container CSS class (gradient backgrounds)
   */
  getIconContainerClass(sessionType: TokenType): string {
    switch (sessionType) {
      case 'code':
        return 'session-chooser__icon-container--code';
      case 'share':
        return 'session-chooser__icon-container--share';
      case 'preview':
        return 'session-chooser__icon-container--preview';
      default:
        return '';
    }
  }

  /**
   * Badge CSS class (session type colors)
   */
  getBadgeClass(sessionType: TokenType): string {
    switch (sessionType) {
      case 'code':
        return 'session-chooser__badge--code';
      case 'share':
        return 'session-chooser__badge--share';
      case 'preview':
        return 'session-chooser__badge--preview';
      default:
        return '';
    }
  }

  /**
   * Projekt név rövidítése (hosszú nevek kezelése)
   * Pl: "Árpád Gimnázium/Tatabánya - 12 C 2022-2026" → "Árpád Gimn. 12.C '26"
   */
  formatProjectName(name: string): string {
    // Rövidítések
    const abbreviations: Record<string, string> = {
      'Gimnázium': 'Gimn.',
      'Általános Iskola': 'Ált.',
      'Szakgimnázium': 'Szakg.',
      'Szakközépiskola': 'Szakk.',
      'Technikum': 'Tech.',
      'Középiskola': 'Köz.',
    };

    let shortened = name;

    // Város eltávolítása (/ után, - előtt)
    shortened = shortened.replace(/\/[^-]+(?=\s*-)/, '');

    // Rövidítések alkalmazása
    for (const [full, abbrev] of Object.entries(abbreviations)) {
      shortened = shortened.replace(full, abbrev);
    }

    // Osztály formázás: "12 C" → "12.C" vagy "12C" → "12.C"
    shortened = shortened.replace(/(\d{1,2})\s*([A-Za-z])(?=\s|$|-)/g, '$1.$2');

    // Évszám rövidítése (2022-2026 → '26)
    shortened = shortened.replace(/(\d{4})-(\d{4})/, (_, start, end) => "'" + end.slice(-2));

    // Felesleges kötőjelek és szóközök tisztítása
    shortened = shortened.replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();

    return shortened;
  }

  /**
   * Utolsó használat formázása
   */
  formatLastUsed(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Ma';
    } else if (diffDays === 1) {
      return 'Tegnap';
    } else if (diffDays < 7) {
      return `${diffDays} napja`;
    } else {
      return date.toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * Keyboard navigation - Enter/Space aktiválja a kártyát
   */
  onCardKeydown(event: KeyboardEvent, session: StoredSession): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectSession(session);
    }
  }
}
