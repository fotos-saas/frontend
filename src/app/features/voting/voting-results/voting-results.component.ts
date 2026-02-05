import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VotingService, PollResults, PollOption } from '../../../core/services/voting.service';

/**
 * Voting Results Component
 *
 * Szavazás eredményeinek dedikált megjelenítése.
 * - Progress bar minden opcióhoz
 * - Százalékos és szám szerinti eredmények
 * - Összesített statisztikák
 *
 * Csak kapcsolattartók (code token) számára elérhető.
 */
@Component({
  selector: 'app-voting-results',
  imports: [RouterModule],
  templateUrl: './voting-results.component.html',
  styleUrls: ['./voting-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingResultsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Eredmények */
  readonly results = signal<PollResults | null>(null);

  /** Betöltés folyamatban */
  readonly isLoading = signal<boolean>(true);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Van-e eredmény */
  readonly hasResults = computed(() => this.results() !== null);

  /** Nyertes opció(k) - a legtöbb szavazattal */
  readonly winners = computed(() => {
    const res = this.results();
    if (!res || !res.options.length) return [];

    const maxVotes = Math.max(...res.options.map(o => o.votesCount ?? 0));
    if (maxVotes === 0) return [];

    return res.options.filter(o => o.votesCount === maxVotes);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private votingService: VotingService
  ) {}

  ngOnInit(): void {
    this.loadResultsFromRoute();
  }

  /** Eredmények betöltése route paraméterből */
  private loadResultsFromRoute(): void {
    const pollId = Number(this.route.snapshot.paramMap.get('id'));
    if (!pollId || isNaN(pollId) || pollId < 1) {
      this.errorMessage.set('Érvénytelen szavazás azonosító');
      this.isLoading.set(false);
      return;
    }
    this.loadResults(pollId);
  }

  /** Eredmények betöltése */
  loadResults(pollId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.votingService.getResults(pollId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Hiba az eredmények betöltésekor');
        this.isLoading.set(false);
      }
    });
  }

  /** Vissza a listához */
  goBack(): void {
    this.router.navigate(['/voting']);
  }

  /** Nyertes-e az opció */
  isWinner(option: PollOption): boolean {
    return this.winners().some(w => w.id === option.id);
  }

  /** TrackBy függvény az opció listához */
  trackByOptionId(_index: number, option: PollOption): number {
    return option.id;
  }
}
