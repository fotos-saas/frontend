import { NgClass } from '@angular/common';
import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import {
  Participant,
  ParticipantStatistics
} from '../../../core/services/voting.service';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';

@Component({
    selector: 'app-participants-dialog',
    imports: [NgClass, LucideAngularModule, DialogWrapperComponent],
    templateUrl: './participants-dialog.component.html',
    styleUrls: ['./participants-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantsDialogComponent {
  readonly ICONS = ICONS;

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

  /**
   * Összesített letszam szoveg
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
   * Resztvevo statusz osztalya
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
   * Resztvevo statusz badge
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
   * Aktualis felhasznalo-e (az "En" jeloleshez)
   */
  isCurrentUser(participant: Participant): boolean {
    const guestId = this.currentGuestId();
    return guestId !== null && participant.id === guestId;
  }

  /**
   * Utolso aktivitas formazas
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
   * Extra toggle kattintas
   */
  onToggleExtra(guestId: number): void {
    if (!this.hasFullAccess() || this.togglingExtraId() === guestId) {
      return;
    }
    this.toggleExtraEvent.emit(guestId);
  }

  /**
   * Frissites kattintas
   */
  onRefresh(): void {
    if (!this.isLoading()) {
      this.refreshEvent.emit();
    }
  }
}
