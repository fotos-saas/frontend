import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VotingService, Poll, PollMedia } from '../../../core/services/voting.service';
import { VoteParticipantsService } from '../../../core/services/vote-participants.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { LoggerService } from '../../../core/services/logger.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ClassSizeDialogComponent, ClassSizeResult } from '../../../shared/components/class-size-dialog/class-size-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ParticipantsDialogComponent } from '../../../shared/components/participants-dialog/participants-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../shared/components/media-lightbox';
import { VotingCardComponent } from '../voting-card/voting-card.component';
import { VotingCreateDialogComponent, VotingCreateResult } from '../voting-create-dialog/voting-create-dialog.component';
import { VotingEditDialogComponent, VotingEditResult } from '../voting-edit-dialog/voting-edit-dialog.component';
import { VotingListState } from './voting-list.state';

/**
 * Voting List Component
 *
 * Szavazások listázása és kezelése.
 * - Aktív szavazások grid nézetben
 * - Kapcsolattartó: új szavazás létrehozás
 * - Vendég: névbekérés dialógus
 */
@Component({
  selector: 'app-voting-list',
  imports: [
    CommonModule,
    VotingCardComponent,
    GuestNameDialogComponent,
    ClassSizeDialogComponent,
    VotingCreateDialogComponent,
    VotingEditDialogComponent,
    ConfirmDialogComponent,
    ParticipantsDialogComponent,
    MediaLightboxComponent
  ],
  templateUrl: './voting-list.component.html',
  styleUrls: ['./voting-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingListComponent implements OnInit {
  /** Centralized state */
  readonly state = new VotingListState();

  private readonly destroyRef = inject(DestroyRef);

  /** Lightbox state */
  lightboxMedia = signal<LightboxMediaItem[]>([]);
  lightboxCurrentIndex = signal(0);
  isLightboxOpen = signal(false);

  /** Teljes hozzáférés (kapcsolattartó) */
  get hasFullAccess(): boolean {
    return this.authService.hasFullAccess();
  }

  /** Vendég felhasználó */
  get isGuest(): boolean {
    return this.authService.isGuest();
  }

  private readonly logger = inject(LoggerService);

  constructor(
    private votingService: VotingService,
    private voteParticipantsService: VoteParticipantsService,
    private authService: AuthService,
    private guestService: GuestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initGuestCheck();
    this.initProjectSubscription();
    this.loadPolls();
  }

  /**
   * Vendég névbekérés ellenőrzése
   *
   * - Code token: automatikusan regisztráljuk a kapcsolattartó nevével
   * - Share token: dialógussal kérjük be a nevet
   */
  private initGuestCheck(): void {
    if (this.guestService.hasRegisteredSession()) {
      return; // Már van session
    }

    // Code token esetén automatikus regisztráció a kapcsolattartó nevével
    if (this.authService.getTokenType() === 'code') {
      this.autoRegisterContact();
      return;
    }

    // Share token esetén dialógus megjelenítése
    this.state.guestDialog.open();
  }

  /**
   * Automatikus regisztráció kapcsolattartó adataival (code token esetén)
   */
  private autoRegisterContact(): void {
    const project = this.authService.getProject();
    const contact = project?.contacts?.[0];

    if (!contact?.name) {
      // Ha nincs kapcsolattartó név, dialógust nyitunk (fallback)
      this.state.guestDialog.open();
      return;
    }

    // Automatikus regisztráció a kapcsolattartó nevével és email-jével
    this.guestService.register(contact.name, contact.email || undefined).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadPolls();
      },
      error: (err) => {
        this.logger.error('Automatikus regisztráció hiba', err);
        // Hiba esetén dialógust nyitunk
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

  /** Szavazás kártya kattintás */
  onPollClick(poll: Poll): void {
    // Lezárt szavazásnál mindenkinek az eredményeket mutatjuk
    if (!poll.isOpen) {
      this.router.navigate(['/voting', poll.id, 'results']);
    } else {
      this.router.navigate(['/voting', poll.id]);
    }
  }

  /** Eredmények megtekintése (kapcsolattartónak) */
  onViewResults(poll: Poll): void {
    this.router.navigate(['/voting', poll.id, 'results']);
  }

  /** Új szavazás gomb (kapcsolattartó) */
  onCreatePoll(): void {
    this.state.startCreatePoll();
  }

  /** Létszám módosítása gomb (kapcsolattartó) */
  onEditClassSize(): void {
    this.state.startEditClassSize();
  }

  /** Osztálylétszám dialógus eredmény */
  onClassSizeResult(result: ClassSizeResult): void {
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
  onCreateDialogResult(result: VotingCreateResult): void {
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

    // Borítókép (opcionális) - legacy support
    const coverImage = result.data.coverImage;
    // Média fájlok (max 5, 10MB/kép)
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

  /** Guest név dialógus eredmény */
  onGuestNameResult(result: GuestNameResult): void {
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

  /** Szavazás szerkesztés gomb (kapcsolattartó) */
  onEditPoll(poll: Poll): void {
    this.state.startEditPoll(poll);
  }

  /** Szavazás szerkesztés dialógus eredmény */
  onEditDialogResult(result: VotingEditResult): void {
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

    // Média fájlok és törlendő ID-k
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

  /** Szavazás lezárása (kapcsolattartó) */
  onClosePoll(poll: Poll): void {
    this.votingService.closePoll(poll.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadPolls();
      },
      error: (err) => {
        this.logger.error('Szavazás lezárási hiba', err);
      }
    });
  }

  /** Szavazás újranyitása (kapcsolattartó) */
  onReopenPoll(poll: Poll): void {
    // 7 napos határidővel nyitjuk újra alapból
    const closeAt = new Date();
    closeAt.setDate(closeAt.getDate() + 7);

    this.votingService.reopenPoll(poll.id, closeAt.toISOString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadPolls();
      },
      error: (err) => {
        this.logger.error('Szavazás újranyitási hiba', err);
      }
    });
  }

  /** Szavazás törlés gomb (kapcsolattartó) */
  onDeletePoll(poll: Poll): void {
    this.state.startDeletePoll(poll);
  }

  /** Törlés megerősítő dialógus eredmény */
  onDeleteDialogResult(result: ConfirmDialogResult): void {
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
      next: () => {
        this.state.deleteSuccess();
      },
      error: (err) => {
        this.logger.error('Szavazás törlési hiba', err);
        this.state.deleteDialog.submitError(err.message || 'Hiba a szavazás törlésekor');
      }
    });
  }

  /** TrackBy függvény a poll listához */
  trackByPollId(_index: number, poll: Poll): number {
    return poll.id;
  }

  // === LIGHTBOX METHODS ===

  /** Lightbox megnyitása (voting-card-ból) */
  onLightboxOpen(event: { media: PollMedia[], index: number }): void {
    const lightboxItems: LightboxMediaItem[] = event.media.map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName
    }));

    this.lightboxMedia.set(lightboxItems);
    this.lightboxCurrentIndex.set(event.index);
    this.isLightboxOpen.set(true);
  }

  /** Lightbox bezárása */
  onLightboxClose(): void {
    this.isLightboxOpen.set(false);
  }

  /** Lightbox navigáció */
  onLightboxNavigate(index: number): void {
    this.lightboxCurrentIndex.set(index);
  }

  // === PARTICIPANTS METHODS ===

  /** Jelenlévők gomb kattintás */
  onParticipantsClick(): void {
    this.state.openParticipantsDialog();
    this.loadParticipants();
  }

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
        // Csak a loading állapotot állítjuk le, a dialógust nyitva hagyjuk
        this.state.participantsDialog.isSubmitting.set(false);
      },
      error: (err) => {
        this.logger.error('Jelenlévők betöltési hiba', err);
        this.state.participantsDialog.submitError(err.message || 'Hiba a jelenlévők betöltésekor');
      }
    });
  }

  /** Extra jelölés toggle */
  onToggleExtra(guestId: number): void {
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

  /** Jelenlévők dialógus bezárása */
  onParticipantsClose(): void {
    this.state.closeParticipantsDialog();
  }

  /** Jelenlévők frissítése */
  onRefreshParticipants(): void {
    this.loadParticipants();
  }
}
