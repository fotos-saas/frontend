import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VotingService, Poll, PollMedia } from '../../../core/services/voting.service';
import { VoteParticipantsService } from '../../../core/services/vote-participants.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { LoggerService } from '../../../core/services/logger.service';
import { LightboxMediaItem } from '../../../shared/components/media-lightbox';
import { GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ClassSizeResult } from '../../../shared/components/class-size-dialog/class-size-dialog.component';
import { ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VotingCreateResult } from '../voting-create-dialog/voting-create-dialog.component';
import { VotingEditResult } from '../voting-edit-dialog/voting-edit-dialog.component';
import { VotingListState } from './voting-list.state';

/**
 * Voting List Facade Service
 *
 * Üzleti logika a voting-list komponenshez.
 * Kezeli: adatlekérés, szavazás CRUD, vendég regisztráció,
 * jelenlévők kezelés, lightbox állapot.
 *
 * providedIn: null → komponens providers tömbjébe regisztrálandó.
 */
@Injectable()
export class VotingListFacadeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly votingService = inject(VotingService);
  private readonly voteParticipantsService = inject(VoteParticipantsService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly logger = inject(LoggerService);

  /** Központi state */
  readonly state = new VotingListState();

  /** Lightbox állapot */
  readonly lightboxMedia = signal<LightboxMediaItem[]>([]);
  readonly lightboxCurrentIndex = signal(0);
  readonly isLightboxOpen = signal(false);

  /** Teljes hozzáférés (kapcsolattartó) */
  get hasFullAccess(): boolean {
    return this.authService.hasFullAccess();
  }

  /** Vendég felhasználó */
  get isGuest(): boolean {
    return this.authService.isGuest();
  }

  // === INICIALIZÁLÁS ===

  /** Komponens inicializálás */
  init(): void {
    this.initGuestCheck();
    this.initProjectSubscription();
    this.loadPolls();
  }

  /**
   * Vendég névbekérés ellenőrzése
   * - Code token: automatikus regisztráció a kapcsolattartó nevével
   * - Share token: dialógussal kérjük be a nevet
   */
  private initGuestCheck(): void {
    if (this.guestService.hasRegisteredSession()) {
      return;
    }

    if (this.authService.getTokenType() === 'code') {
      this.autoRegisterContact();
      return;
    }

    this.state.guestDialog.open();
  }

  /** Automatikus regisztráció kapcsolattartó adataival (code token) */
  private autoRegisterContact(): void {
    const project = this.authService.getProject();
    const contact = project?.contacts?.[0];

    if (!contact?.name) {
      this.state.guestDialog.open();
      return;
    }

    this.guestService.register(contact.name, contact.email || undefined).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadPolls(),
      error: (err) => {
        this.logger.error('Automatikus regisztráció hiba', err);
        this.state.guestDialog.open();
      }
    });
  }

  /** Projekt változások figyelése */
  private initProjectSubscription(): void {
    this.state.updateProject(this.authService.getProject());

    this.authService.project$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => this.state.updateProject(proj));
  }

  // === SZAVAZÁSOK ===

  /** Szavazások betöltése */
  loadPolls(): void {
    this.state.startLoading();

    this.votingService.loadPolls().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (polls) => this.state.finishLoading(polls),
      error: (err) => {
        this.logger.error('Szavazások betöltési hiba', err);
        this.state.loadingError();
      }
    });
  }

  /** Szavazás kártya kattintás - navigáció */
  navigateToPoll(poll: Poll): void {
    if (!poll.isOpen) {
      this.router.navigate(['/voting', poll.id, 'results']);
    } else {
      this.router.navigate(['/voting', poll.id]);
    }
  }

  /** Eredmények megtekintése */
  navigateToResults(poll: Poll): void {
    this.router.navigate(['/voting', poll.id, 'results']);
  }

  /** Szavazás lezárása */
  closePoll(poll: Poll): void {
    this.votingService.closePoll(poll.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadPolls(),
      error: (err) => this.logger.error('Szavazás lezárási hiba', err)
    });
  }

  /** Szavazás újranyitása (7 napos határidővel) */
  reopenPoll(poll: Poll): void {
    const closeAt = new Date();
    closeAt.setDate(closeAt.getDate() + 7);

    this.votingService.reopenPoll(poll.id, closeAt.toISOString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadPolls(),
      error: (err) => this.logger.error('Szavazás újranyitási hiba', err)
    });
  }

  // === DIALÓGUS KEZELŐK ===

  /** Osztálylétszám dialógus eredmény */
  handleClassSizeResult(result: ClassSizeResult): void {
    if (result.action === 'cancel') {
      this.state.classSizeDialog.close();
      return;
    }

    this.state.classSizeDialog.startSubmit();

    this.votingService.setClassSize(result.classSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.authService.updateProjectClassSize(data.expected_class_size);
        this.state.classSizeSuccess();
      },
      error: (err) => {
        this.logger.error('Osztálylétszám beállítási hiba', err);
        this.state.classSizeDialog.submitError(err.message || 'Hiba az osztálylétszám beállításakor');
      }
    });
  }

  /** Szavazás létrehozás dialógus eredmény */
  handleCreateResult(result: VotingCreateResult): void {
    if (result.action === 'cancel' || !result.data) {
      this.state.createDialog.close();
      return;
    }

    this.state.createDialog.startSubmit();

    const request = {
      title: result.data.title,
      description: result.data.description,
      type: result.data.type,
      is_multiple_choice: result.data.isMultipleChoice,
      max_votes_per_guest: result.data.maxVotesPerGuest,
      show_results_before_vote: result.data.showResultsBeforeVote,
      close_at: result.data.closeAt,
      options: result.data.options.map(label => ({ label }))
    };

    const coverImage = result.data.coverImage;
    const mediaFiles = result.data.mediaFiles;

    this.votingService.createPoll(request, coverImage, mediaFiles).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.state.createDialog.submitSuccess();
        this.loadPolls();
      },
      error: (err) => {
        this.logger.error('Szavazás létrehozási hiba', err);
        this.state.createDialog.submitError(err.message || 'Hiba a szavazás létrehozásakor');
      }
    });
  }

  /** Vendég név dialógus eredmény */
  handleGuestNameResult(result: GuestNameResult): void {
    if (result.action === 'close') {
      return;
    }

    this.state.guestDialog.startSubmit();

    this.guestService.register(result.name, result.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.state.guestDialog.submitSuccess();
        this.loadPolls();
      },
      error: (err) => {
        this.state.guestDialog.submitError(err.message || 'Hiba a regisztráció során');
      }
    });
  }

  /** Szavazás szerkesztés dialógus eredmény */
  handleEditResult(result: VotingEditResult): void {
    if (result.action === 'cancel' || !result.data) {
      this.state.closeEditDialog();
      return;
    }

    const poll = this.state.selectedPollForEdit();
    if (!poll) return;

    this.state.editDialog.startSubmit();

    const request = {
      title: result.data.title,
      description: result.data.description,
      is_multiple_choice: result.data.isMultipleChoice,
      max_votes_per_guest: result.data.maxVotesPerGuest,
      show_results_before_vote: result.data.showResultsBeforeVote,
      close_at: result.data.closeAt ?? undefined
    };

    const mediaFiles = result.data.mediaFiles;
    const deleteMediaIds = result.data.deleteMediaIds;

    this.votingService.updatePoll(poll.id, request, mediaFiles, deleteMediaIds).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.state.editSuccess();
        this.loadPolls();
      },
      error: (err) => {
        this.logger.error('Szavazás szerkesztési hiba', err);
        this.state.editDialog.submitError(err.message || 'Hiba a szavazás szerkesztésekor');
      }
    });
  }

  /** Törlés megerősítő dialógus eredmény */
  handleDeleteResult(result: ConfirmDialogResult): void {
    if (result.action === 'cancel') {
      this.state.closeDeleteDialog();
      return;
    }

    const poll = this.state.selectedPollForDelete();
    if (!poll) return;

    this.state.deleteDialog.startSubmit();

    this.votingService.deletePoll(poll.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.state.deleteSuccess(),
      error: (err) => {
        this.logger.error('Szavazás törlési hiba', err);
        this.state.deleteDialog.submitError(err.message || 'Hiba a szavazás törlésekor');
      }
    });
  }

  // === JELENLÉVŐK ===

  /** Jelenlévők betöltése */
  loadParticipants(): void {
    this.state.participantsDialog.startSubmit();

    this.voteParticipantsService.getParticipants().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.state.setParticipantsData(
          response.data,
          response.statistics,
          response.currentGuestId
        );
        this.state.participantsDialog.isSubmitting.set(false);
      },
      error: (err) => {
        this.logger.error('Jelenlévők betöltési hiba', err);
        this.state.participantsDialog.submitError(err.message || 'Hiba a jelenlévők betöltésekor');
      }
    });
  }

  /** Extra jelölés toggle */
  toggleExtra(guestId: number): void {
    this.state.startToggleExtra(guestId);

    this.voteParticipantsService.toggleExtra(guestId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: { isExtra: boolean }) => {
        this.state.toggleExtraSuccess(guestId, response.isExtra);
      },
      error: (err: Error) => {
        this.logger.error('Extra toggle hiba', err);
        this.state.toggleExtraError();
      }
    });
  }

  // === LIGHTBOX ===

  /** Lightbox megnyitása */
  openLightbox(event: { media: PollMedia[]; index: number }): void {
    const items: LightboxMediaItem[] = event.media.map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName
    }));

    this.lightboxMedia.set(items);
    this.lightboxCurrentIndex.set(event.index);
    this.isLightboxOpen.set(true);
  }

  /** Lightbox bezárása */
  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }

  /** Lightbox navigáció */
  navigateLightbox(index: number): void {
    this.lightboxCurrentIndex.set(index);
  }
}
