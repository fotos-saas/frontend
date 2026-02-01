import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VotingService, PollOption, PollMedia } from '../../../core/services/voting.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { MediaLightboxComponent, LightboxMediaItem } from '../../../shared/components/media-lightbox';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { VotingDetailState } from './voting-detail.state';

/**
 * Voting Detail Component
 *
 * Egy szavazás részletes nézete:
 * - Opciók megjelenítése (kártyák vagy lista)
 * - Szavazat leadás
 * - Eredmények megjelenítése
 */
@Component({
  selector: 'app-voting-detail',
  imports: [
    CommonModule,
    RouterModule,
    GuestNameDialogComponent,
    MediaLightboxComponent,
    SafeHtmlPipe
  ],
  templateUrl: './voting-detail.component.html',
  styleUrls: ['./voting-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingDetailComponent implements OnInit {
  /** Centralized state */
  readonly state = new VotingDetailState();

  private readonly destroyRef = inject(DestroyRef);

  /** Lightbox state */
  lightboxMedia = signal<LightboxMediaItem[]>([]);
  lightboxCurrentIndex = signal(0);
  isLightboxOpen = signal(false);

  /** Vendég felhasználó */
  get isGuest(): boolean {
    return this.authService.isGuest();
  }

  /** Teljes hozzáférés */
  get hasFullAccess(): boolean {
    return this.authService.hasFullAccess();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private votingService: VotingService,
    private authService: AuthService,
    private guestService: GuestService
  ) {}

  ngOnInit(): void {
    // Kapcsolattartó státusz átadása a state-nek
    // Ez biztosítja, hogy full access esetén az eredmények mindig látszanak
    this.state.setFullAccess(this.hasFullAccess);

    this.initGuestCheck();
    this.loadPollFromRoute();
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
        // Újratöltjük a poll-t a friss session-nel
        const currentPoll = this.state.poll();
        if (currentPoll) {
          this.loadPoll(currentPoll.id);
        }
      },
      error: () => {
        // Hiba esetén dialógust nyitunk
        this.state.guestDialog.open();
      }
    });
  }

  /** Szavazás betöltése route paraméterből */
  private loadPollFromRoute(): void {
    const pollId = Number(this.route.snapshot.paramMap.get('id'));
    if (!pollId || isNaN(pollId) || pollId < 1) {
      this.state.setError('Érvénytelen szavazás azonosító');
      return;
    }
    this.loadPoll(pollId);
  }

  /** Szavazás betöltése */
  loadPoll(id: number): void {
    this.state.startLoading();

    this.votingService.getPoll(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (poll) => this.state.finishLoading(poll),
      error: (err) => this.state.loadingError(err.message)
    });
  }

  /** Opció kattintás kezelése */
  onOptionClick(option: PollOption): void {
    const currentPoll = this.state.poll();
    if (!currentPoll || !currentPoll.isOpen) return;

    if (this.state.hasVotedFor(option)) {
      this.removeVote(option);
    } else {
      this.vote(option);
    }
  }

  /** Space billentyű kezelése (prevent scroll) */
  onOptionKeySpace(event: Event, option: PollOption): void {
    event.preventDefault();
    this.onOptionClick(option);
  }

  /** Szavazat leadása */
  private vote(option: PollOption): void {
    const currentPoll = this.state.poll();
    if (!currentPoll || !this.state.canVoteForOption(option)) {
      if (currentPoll && !currentPoll.canVote && currentPoll.myVotes.length > 0) {
        this.state.setError('Elérted a maximális szavazatszámot!');
      }
      return;
    }

    this.state.startVoting();

    this.votingService.vote(currentPoll.id, option.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.state.voteSuccess(response.message);
        this.loadPoll(currentPoll.id);
      },
      error: (err) => this.state.voteError(err.message)
    });
  }

  /** Szavazat visszavonása */
  private removeVote(option: PollOption): void {
    const currentPoll = this.state.poll();
    if (!currentPoll || !currentPoll.isOpen || this.state.isVoting()) {
      return;
    }

    this.state.startVoting();

    this.votingService.removeVote(currentPoll.id, option.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.state.voteSuccess(response.message);
        this.loadPoll(currentPoll.id);
      },
      error: (err) => this.state.voteError(err.message)
    });
  }

  /** Vissza a listához */
  goBack(): void {
    this.router.navigate(['/voting']);
  }

  /** Guest név dialógus eredmény */
  onGuestNameResult(result: GuestNameResult): void {
    if (result.action === 'close') return;

    this.state.guestDialog.startSubmit();

    this.guestService.register(result.name, result.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.state.guestDialog.submitSuccess();
        const currentPoll = this.state.poll();
        if (currentPoll) {
          this.loadPoll(currentPoll.id);
        }
      },
      error: (err) => {
        this.state.guestDialog.submitError(err.message || 'Hiba a regisztráció során');
      }
    });
  }

  /** TrackBy függvény az opció listához */
  trackByOptionId(_index: number, option: PollOption): number {
    return option.id;
  }

  /** TrackBy függvény a média listához */
  trackByMediaId(_index: number, media: PollMedia): number {
    return media.id;
  }

  /** Van-e média a szavazáshoz */
  get hasMedia(): boolean {
    const poll = this.state.poll();
    return !!(poll?.media && poll.media.length > 0);
  }

  /** Média elemek */
  get mediaItems(): PollMedia[] {
    return this.state.poll()?.media ?? [];
  }

  /** Kép kattintás - lightbox megnyitása */
  onMediaClick(index: number): void {
    const poll = this.state.poll();
    if (!poll?.media || poll.media.length === 0) return;

    // PollMedia → LightboxMediaItem konverzió
    const lightboxItems: LightboxMediaItem[] = poll.media.map(m => ({
      id: m.id,
      url: m.url,
      fileName: m.fileName
    }));

    this.lightboxMedia.set(lightboxItems);
    this.lightboxCurrentIndex.set(index);
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
}
