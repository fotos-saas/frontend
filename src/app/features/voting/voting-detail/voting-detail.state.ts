import { signal, computed } from '@angular/core';
import { Poll, PollOption } from '../../../core/services/voting.service';
import { DialogStateHelper } from '../../../shared/helpers/dialog-state.helper';

/**
 * Voting Detail State
 *
 * Csoportosított state a voting-detail komponenshez.
 * Csökkenti a komponens signal számát és javítja az olvashatóságot.
 */
export class VotingDetailState {
  // === POLL STATE ===

  /** Szavazás adatok */
  readonly poll = signal<Poll | null>(null);

  /** Betöltés folyamatban */
  readonly isLoading = signal<boolean>(true);

  /** Szavazat küldés folyamatban */
  readonly isVoting = signal<boolean>(false);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Sikeres szavazás üzenet */
  readonly successMessage = signal<string | null>(null);

  /** Teljes hozzáférés (kapcsolattartó) - mindig látja az eredményeket */
  readonly hasFullAccess = signal<boolean>(false);

  // === DIALOGS ===

  /** Guest név dialógus állapota */
  readonly guestDialog = new DialogStateHelper();

  // === COMPUTED VALUES ===

  /** Van-e szavazás betöltve */
  readonly hasPoll = computed(() => this.poll() !== null);

  /** Aktív szavazás-e */
  readonly isOpen = computed(() => this.poll()?.isOpen ?? false);

  /** Eredmények láthatók-e */
  readonly showResults = computed(() => {
    const currentPoll = this.poll();
    if (!currentPoll) return false;

    // Kapcsolattartó MINDIG látja az eredményeket
    if (this.hasFullAccess()) return true;

    return (
      currentPoll.myVotes.length > 0 ||
      currentPoll.showResultsBeforeVote ||
      !currentPoll.isOpen
    );
  });

  /** Multiple choice szavazás */
  readonly isMultipleChoice = computed(() =>
    this.poll()?.isMultipleChoice ?? false
  );

  // === METHODS ===

  /**
   * Teljes hozzáférés beállítása (kapcsolattartó)
   */
  setFullAccess(value: boolean): void {
    this.hasFullAccess.set(value);
  }

  /**
   * Betöltés indítása
   */
  startLoading(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
  }

  /**
   * Betöltés befejezése
   */
  finishLoading(loadedPoll: Poll): void {
    this.poll.set(loadedPoll);
    this.isLoading.set(false);
  }

  /**
   * Betöltési hiba
   */
  loadingError(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  /**
   * Szavazás indítása
   */
  startVoting(): void {
    this.isVoting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Szavazás sikeres
   */
  voteSuccess(message: string): void {
    this.successMessage.set(message);
    this.isVoting.set(false);
  }

  /**
   * Szavazás hiba
   */
  voteError(message: string): void {
    this.errorMessage.set(message);
    this.isVoting.set(false);
  }

  /**
   * Szavazott-e erre az opcióra
   */
  hasVotedFor(option: PollOption): boolean {
    return this.poll()?.myVotes.includes(option.id) ?? false;
  }

  /**
   * Szavazhat-e az adott opcióra
   */
  canVoteForOption(option: PollOption): boolean {
    const currentPoll = this.poll();
    if (!currentPoll || !currentPoll.isOpen || this.isVoting()) {
      return false;
    }

    // Ha már szavazott erre és nem multiple choice
    if (this.hasVotedFor(option) && !currentPoll.isMultipleChoice) {
      return false;
    }

    // Ha elérte a max szavazatot és nem szavazott erre
    if (!currentPoll.canVote && currentPoll.myVotes.length > 0 && !this.hasVotedFor(option)) {
      return false;
    }

    return true;
  }

  /**
   * Aria label generálás az opcióhoz
   */
  getOptionAriaLabel(option: PollOption): string {
    const currentPoll = this.poll();
    if (!currentPoll) return option.label;

    const voted = this.hasVotedFor(option) ? ', kiválasztva' : '';
    const percentage = option.percentage !== undefined ? `, ${option.percentage}%` : '';

    if (!currentPoll.isOpen) {
      return `${option.label}${percentage} - a szavazás lezárult`;
    }

    if (!currentPoll.canVote && !this.hasVotedFor(option)) {
      return `${option.label}${percentage} - elérted a maximális szavazatszámot`;
    }

    return `${option.label}${voted}${percentage}. Nyomj Entert vagy Space-t a szavazáshoz.`;
  }

  /**
   * Hibaüzenet beállítása (pl. limit elérés)
   */
  setError(message: string): void {
    this.errorMessage.set(message);
  }

  /**
   * Hibaüzenet törlése
   */
  clearError(): void {
    this.errorMessage.set(null);
  }

  /**
   * Sikeres üzenet törlése
   */
  clearSuccess(): void {
    this.successMessage.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.poll.set(null);
    this.isLoading.set(true);
    this.isVoting.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.guestDialog.reset();
  }
}
