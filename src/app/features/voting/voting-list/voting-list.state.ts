import { signal, computed } from '@angular/core';
import { Poll, Participant, ParticipantStatistics } from '../../../core/services/voting.service';
import { TabloProject } from '../../../core/services/auth.service';
import { DialogStateHelper } from '../../../shared/helpers/dialog-state.helper';

/**
 * Voting List State
 *
 * Csoportosított state a voting-list komponenshez.
 * Csökkenti a komponens signal számát és javítja az olvashatóságot.
 */
export class VotingListState {
  // === LIST STATE ===

  /** Betöltés folyamatban */
  readonly isLoading = signal<boolean>(true);

  /** Szavazások listája */
  readonly polls = signal<Poll[]>([]);

  /** Aktuális projekt */
  readonly project = signal<TabloProject | null>(null);

  // === DIALOGS ===

  /** Guest név dialógus állapota */
  readonly guestDialog = new DialogStateHelper();

  /** Szavazás létrehozás dialógus állapota */
  readonly createDialog = new DialogStateHelper();

  /** Osztálylétszám dialógus állapota */
  readonly classSizeDialog = new DialogStateHelper();

  /** Szavazás szerkesztés dialógus állapota */
  readonly editDialog = new DialogStateHelper();

  /** Szavazás törlés dialógus állapota */
  readonly deleteDialog = new DialogStateHelper();

  /** Jelenlévők dialógus állapota */
  readonly participantsDialog = new DialogStateHelper();

  /** Jelenlévők listája */
  readonly participants = signal<Participant[]>([]);

  /** Jelenlévők statisztikái */
  readonly participantStats = signal<ParticipantStatistics | null>(null);

  /** Aktuális vendég ID (az "Én" jelöléshez) */
  readonly currentGuestId = signal<number | null>(null);

  /** Extra toggle folyamatban (guestId) */
  readonly togglingExtraId = signal<number | null>(null);

  /** Kiválasztott szavazás szerkesztéshez */
  readonly selectedPollForEdit = signal<Poll | null>(null);

  /** Kiválasztott szavazás törléshez */
  readonly selectedPollForDelete = signal<Poll | null>(null);

  /** Flag: létszám beállítás után nyíljon-e a create dialog */
  readonly openCreateAfterClassSize = signal<boolean>(false);

  // === COMPUTED VALUES ===

  /** Aktív szavazások száma */
  readonly activeCount = computed(() =>
    this.polls().filter(p => p.isOpen).length
  );

  /** Aktív szavazások */
  readonly activePolls = computed(() =>
    this.polls().filter(p => p.isOpen)
  );

  /** Lezárt szavazások */
  readonly closedPolls = computed(() =>
    this.polls().filter(p => !p.isOpen)
  );

  /** Van-e legalább egy szavazás */
  readonly hasPolls = computed(() =>
    this.polls().length > 0
  );

  /** Szükséges-e osztálylétszám beállítás az első szavazás előtt */
  readonly needsClassSizeForFirstPoll = computed(() => {
    const proj = this.project();
    return !proj?.expectedClassSize && this.polls().length === 0;
  });

  // === METHODS ===

  /**
   * Betöltés befejezése
   */
  finishLoading(loadedPolls: Poll[]): void {
    this.polls.set(loadedPolls);
    this.isLoading.set(false);
  }

  /**
   * Betöltés indítása
   */
  startLoading(): void {
    this.isLoading.set(true);
  }

  /**
   * Betöltési hiba
   */
  loadingError(): void {
    this.isLoading.set(false);
  }

  /**
   * Szavazás létrehozás folyamat indítása
   * Ha szükséges, először a class size dialógust nyitja meg
   */
  startCreatePoll(): void {
    this.createDialog.clearError();

    if (this.needsClassSizeForFirstPoll()) {
      this.classSizeDialog.clearError();
      this.openCreateAfterClassSize.set(true);
      this.classSizeDialog.open();
    } else {
      this.createDialog.open();
    }
  }

  /**
   * Osztálylétszám szerkesztése (külön, nem szavazás létrehozáshoz)
   */
  startEditClassSize(): void {
    this.classSizeDialog.clearError();
    this.openCreateAfterClassSize.set(false);
    this.classSizeDialog.open();
  }

  /**
   * Osztálylétszám beállítás sikeres
   */
  classSizeSuccess(): void {
    this.classSizeDialog.close();

    // Ha a create folyamatból jöttünk, nyissuk meg a create dialogot
    if (this.openCreateAfterClassSize()) {
      this.openCreateAfterClassSize.set(false);
      this.createDialog.open();
    }
  }

  /**
   * Projekt frissítése
   */
  updateProject(project: TabloProject | null): void {
    this.project.set(project);
  }

  /**
   * Szavazás szerkesztés indítása
   */
  startEditPoll(poll: Poll): void {
    this.editDialog.clearError();
    this.selectedPollForEdit.set(poll);
    this.editDialog.open();
  }

  /**
   * Szavazás szerkesztés sikeres
   */
  editSuccess(): void {
    this.editDialog.submitSuccess();
    this.selectedPollForEdit.set(null);
  }

  /**
   * Szavazás szerkesztés bezárása
   */
  closeEditDialog(): void {
    this.editDialog.close();
    this.selectedPollForEdit.set(null);
  }

  /**
   * Szavazás törlés indítása
   */
  startDeletePoll(poll: Poll): void {
    this.deleteDialog.clearError();
    this.selectedPollForDelete.set(poll);
    this.deleteDialog.open();
  }

  /**
   * Szavazás törlés sikeres
   */
  deleteSuccess(): void {
    this.deleteDialog.submitSuccess();
    this.selectedPollForDelete.set(null);
  }

  /**
   * Szavazás törlés bezárása
   */
  closeDeleteDialog(): void {
    this.deleteDialog.close();
    this.selectedPollForDelete.set(null);
  }

  // === PARTICIPANTS METHODS ===

  /**
   * Jelenlévők dialógus megnyitása
   */
  openParticipantsDialog(): void {
    this.participantsDialog.clearError();
    this.participantsDialog.open();
  }

  /**
   * Jelenlévők adatok betöltése sikeres
   */
  setParticipantsData(
    participants: Participant[],
    statistics: ParticipantStatistics,
    currentGuestId: number | null = null
  ): void {
    this.participants.set(participants);
    this.participantStats.set(statistics);
    this.currentGuestId.set(currentGuestId);
  }

  /**
   * Extra toggle kezdése
   */
  startToggleExtra(guestId: number): void {
    this.togglingExtraId.set(guestId);
  }

  /**
   * Extra toggle sikeres
   */
  toggleExtraSuccess(guestId: number, isExtra: boolean): void {
    this.participants.update(list =>
      list.map(p => p.id === guestId ? { ...p, isExtra } : p)
    );

    // Update statistics
    const stats = this.participantStats();
    if (stats) {
      this.participantStats.set({
        ...stats,
        extraCount: isExtra ? stats.extraCount + 1 : stats.extraCount - 1,
        regularCount: isExtra ? stats.regularCount - 1 : stats.regularCount + 1
      });
    }

    this.togglingExtraId.set(null);
  }

  /**
   * Extra toggle hiba
   */
  toggleExtraError(): void {
    this.togglingExtraId.set(null);
  }

  /**
   * Jelenlévők dialógus bezárása
   */
  closeParticipantsDialog(): void {
    this.participantsDialog.close();
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.isLoading.set(true);
    this.polls.set([]);
    this.project.set(null);
    this.guestDialog.reset();
    this.createDialog.reset();
    this.classSizeDialog.reset();
    this.editDialog.reset();
    this.deleteDialog.reset();
    this.participantsDialog.reset();
    this.selectedPollForEdit.set(null);
    this.selectedPollForDelete.set(null);
    this.openCreateAfterClassSize.set(false);
    this.participants.set([]);
    this.participantStats.set(null);
    this.currentGuestId.set(null);
    this.togglingExtraId.set(null);
  }
}
