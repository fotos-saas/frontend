import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Poll, PollMedia } from '../../../core/services/voting.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ClassSizeDialogComponent, ClassSizeResult } from '../../../shared/components/class-size-dialog/class-size-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ParticipantsDialogComponent } from '../../../shared/components/participants-dialog/participants-dialog.component';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox';
import { VotingCardComponent } from '../voting-card/voting-card.component';
import { VotingCreateDialogComponent, VotingCreateResult } from '../voting-create-dialog/voting-create-dialog.component';
import { VotingEditDialogComponent, VotingEditResult } from '../voting-edit-dialog/voting-edit-dialog.component';
import { VotingListFacadeService } from './voting-list-facade.service';

/**
 * Voting List Component
 *
 * Szavazások listázása és kezelése.
 * - Aktív szavazások grid nézetben
 * - Kapcsolattartó: új szavazás létrehozás
 * - Vendég: névbekérés dialógus
 *
 * Az üzleti logikát a VotingListFacadeService kezeli.
 */
@Component({
  selector: 'app-voting-list',
  imports: [
    VotingCardComponent,
    GuestNameDialogComponent,
    ClassSizeDialogComponent,
    VotingCreateDialogComponent,
    VotingEditDialogComponent,
    ConfirmDialogComponent,
    ParticipantsDialogComponent,
    MediaLightboxComponent,
  ],
  providers: [VotingListFacadeService],
  templateUrl: './voting-list.component.html',
  styleUrls: ['./voting-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingListComponent implements OnInit {
  private readonly facade = inject(VotingListFacadeService);

  /** Centralized state */
  readonly state = this.facade.state;

  /** Lightbox state */
  readonly lightboxMedia = this.facade.lightboxMedia;
  readonly lightboxCurrentIndex = this.facade.lightboxCurrentIndex;
  readonly isLightboxOpen = this.facade.isLightboxOpen;

  /** Teljes hozzáférés (kapcsolattartó) */
  get hasFullAccess(): boolean {
    return this.facade.hasFullAccess;
  }

  /** Vendég felhasználó */
  get isGuest(): boolean {
    return this.facade.isGuest;
  }

  ngOnInit(): void {
    this.facade.init();
  }

  // === SZAVAZÁS NAVIGÁCIÓ ===

  /** Szavazás kártya kattintás */
  onPollClick(poll: Poll): void {
    this.facade.navigateToPoll(poll);
  }

  /** Eredmények megtekintése (kapcsolattartónak) */
  onViewResults(poll: Poll): void {
    this.facade.navigateToResults(poll);
  }

  // === SZAVAZÁS MŰVELETEK ===

  /** Új szavazás gomb (kapcsolattartó) */
  onCreatePoll(): void {
    this.state.startCreatePoll();
  }

  /** Létszám módosítása gomb (kapcsolattartó) */
  onEditClassSize(): void {
    this.state.startEditClassSize();
  }

  /** Szavazás szerkesztés gomb (kapcsolattartó) */
  onEditPoll(poll: Poll): void {
    this.state.startEditPoll(poll);
  }

  /** Szavazás törlés gomb (kapcsolattartó) */
  onDeletePoll(poll: Poll): void {
    this.state.startDeletePoll(poll);
  }

  /** Szavazás lezárása (kapcsolattartó) */
  onClosePoll(poll: Poll): void {
    this.facade.closePoll(poll);
  }

  /** Szavazás újranyitása (kapcsolattartó) */
  onReopenPoll(poll: Poll): void {
    this.facade.reopenPoll(poll);
  }

  // === DIALÓGUS EREDMÉNYEK ===

  /** Osztálylétszám dialógus eredmény */
  onClassSizeResult(result: ClassSizeResult): void {
    this.facade.handleClassSizeResult(result);
  }

  /** Szavazás létrehozás dialógus eredmény */
  onCreateDialogResult(result: VotingCreateResult): void {
    this.facade.handleCreateResult(result);
  }

  /** Guest név dialógus eredmény */
  onGuestNameResult(result: GuestNameResult): void {
    this.facade.handleGuestNameResult(result);
  }

  /** Szavazás szerkesztés dialógus eredmény */
  onEditDialogResult(result: VotingEditResult): void {
    this.facade.handleEditResult(result);
  }

  /** Törlés megerősítő dialógus eredmény */
  onDeleteDialogResult(result: ConfirmDialogResult): void {
    this.facade.handleDeleteResult(result);
  }

  // === LIGHTBOX ===

  /** Lightbox megnyitása (voting-card-ból) */
  onLightboxOpen(event: { media: PollMedia[]; index: number }): void {
    this.facade.openLightbox(event);
  }

  /** Lightbox bezárása */
  onLightboxClose(): void {
    this.facade.closeLightbox();
  }

  /** Lightbox navigáció */
  onLightboxNavigate(index: number): void {
    this.facade.navigateLightbox(index);
  }

  // === JELENLÉVŐK ===

  /** Jelenlévők gomb kattintás */
  onParticipantsClick(): void {
    this.state.openParticipantsDialog();
    this.facade.loadParticipants();
  }

  /** Extra jelölés toggle */
  onToggleExtra(guestId: number): void {
    this.facade.toggleExtra(guestId);
  }

  /** Jelenlévők dialógus bezárása */
  onParticipantsClose(): void {
    this.state.closeParticipantsDialog();
  }

  /** Jelenlévők frissítése */
  onRefreshParticipants(): void {
    this.facade.loadParticipants();
  }

  /** TrackBy függvény a poll listához */
  trackByPollId(_index: number, poll: Poll): number {
    return poll.id;
  }
}
