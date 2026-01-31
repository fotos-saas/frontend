import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Participant,
  ParticipantStatistics
} from '../../../core/services/voting.service';
import { createBackdropHandler } from '../../utils/dialog.util';

/**
 * Participants Dialog
 *
 * Jelenlévők listája popup.
 * Mindenki láthatja a résztvevőket,
 * de csak a kapcsolattartó módosíthatja az "extra" jelölést.
 *
 * Használat:
 * ```html
 * <app-participants-dialog
 *   @if (showParticipantsDialog())
 *   [participants]="participants()"
 *   [statistics]="participantStats()"
 *   [hasFullAccess]="hasFullAccess()"
 *   [isLoading]="isLoadingParticipants()"
 *   (closeEvent)="onParticipantsClose()"
 *   (toggleExtraEvent)="onToggleExtra($event)"
 *   (refreshEvent)="onRefreshParticipants()"
 * />
 * ```
 */
@Component({
    selector: 'app-participants-dialog',
    imports: [CommonModule],
    templateUrl: './participants-dialog.component.html',
    styleUrls: ['./participants-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantsDialogComponent implements AfterViewInit {
  /** Signal-based inputs */
  readonly participants = input<Participant[]>([]);
  readonly statistics = input<ParticipantStatistics | null>(null);
  readonly hasFullAccess = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly togglingExtraId = input<number | null>(null);
  readonly currentGuestId = input<number | null>(null);

  /** Signal-based outputs */
  readonly closeEvent = output<void>();
  readonly toggleExtraEvent = output<number>();
  readonly refreshEvent = output<void>();

  /** Előző focus mentése */
  private previousActiveElement?: HTMLElement;

  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.onClose());

  ngAfterViewInit(): void {
    // Focus management - mentjük az előző fókuszált elemet
    this.previousActiveElement = document.activeElement as HTMLElement;
  }

  /**
   * Összesített létszám szöveg
   */
  readonly summaryText = computed(() => {
    const stats = this.statistics();
    if (!stats) {
      return 'Betöltés...';
    }

    const active = stats.active;
    const expected = stats.expectedClassSize;
    const extra = stats.extraCount;

    let text = `${active} aktív`;
    if (expected) {
      text += ` / ${expected} fő`;
    }
    if (extra > 0) {
      text += ` (+${extra} vendég)`;
    }
    return text;
  });

  /**
   * Résztvevő státusz osztálya
   */
  getStatusClass(participant: Participant): string {
    if (participant.isBanned) {
      return 'participant--banned';
    }
    if (participant.isExtra) {
      return 'participant--extra';
    }
    return 'participant--active';
  }

  /**
   * Résztvevő státusz badge
   */
  getStatusBadge(participant: Participant): string {
    if (participant.isBanned) {
      return 'Tiltva';
    }
    if (participant.isExtra) {
      return 'Nem osztálytárs';
    }
    return '';
  }

  /**
   * Aktuális felhasználó-e (az "Én" jelöléshez)
   */
  isCurrentUser(participant: Participant): boolean {
    const guestId = this.currentGuestId();
    return guestId !== null && participant.id === guestId;
  }

  /**
   * Utolsó aktivitás formázás
   */
  formatLastActivity(dateStr: string | null): string {
    if (!dateStr) {
      return 'Nincs aktivitás';
    }

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Most aktív';
    }
    if (diffMins < 60) {
      return `${diffMins} perce`;
    }
    if (diffHours < 24) {
      return `${diffHours} órája`;
    }
    if (diffDays < 7) {
      return `${diffDays} napja`;
    }

    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Extra toggle kattintás
   */
  onToggleExtra(guestId: number): void {
    if (!this.hasFullAccess() || this.togglingExtraId() === guestId) {
      return;
    }
    this.toggleExtraEvent.emit(guestId);
  }

  /**
   * Frissítés kattintás
   */
  onRefresh(): void {
    if (!this.isLoading()) {
      this.refreshEvent.emit();
    }
  }

  /**
   * Bezárás
   */
  onClose(): void {
    this.restoreFocus();
    this.closeEvent.emit();
  }

  /**
   * Focus visszaállítása
   */
  private restoreFocus(): void {
    if (this.previousActiveElement?.focus) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
      }, 100);
    }
  }

  /**
   * TrackBy for ngFor
   */
  trackById(_index: number, participant: Participant): number {
    return participant.id;
  }

  /**
   * ESC billentyű kezelés
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
    }
  }

}
