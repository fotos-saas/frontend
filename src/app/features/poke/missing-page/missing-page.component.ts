import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef, computed, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PokeService } from '../../../core/services/poke.service';
import { ToastService } from '../../../core/services/toast.service';
import { MissingUserCardComponent } from '../missing-user-card/missing-user-card.component';
import { PokeComposerComponent } from '../poke-composer/poke-composer.component';
import { DailyLimitBadgeComponent } from '../daily-limit-badge/daily-limit-badge.component';
import { ReceivedPokesDialogComponent } from '../received-pokes-dialog/received-pokes-dialog.component';
import { trackById } from '../../../shared/utils/track-by.utils';
import { MissingFilterService, CategoryTab, PersonTab } from '../services/missing-filter.service';
import { PokeCategory, MissingUser, Poke } from '../../../core/models/poke.models';
import { StaggerAnimationDirective } from '../../../shared/directives';
import { PsInputComponent } from '@shared/components/form';

/**
 * Missing Page Component
 *
 * Hiányzók oldal - fő oldal a bökés rendszerhez.
 * Kategóriák: szavazás, fotózás, képválasztás
 */
@Component({
  selector: 'app-missing-page',
  imports: [
    FormsModule,
    MissingUserCardComponent,
    PokeComposerComponent,
    DailyLimitBadgeComponent,
    ReceivedPokesDialogComponent,
    StaggerAnimationDirective,
    PsInputComponent,
  ],
  providers: [MissingFilterService],
  templateUrl: './missing-page.component.html',
  styleUrls: ['./missing-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingPageComponent implements OnInit {
  private readonly pokeService = inject(PokeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly filterService = inject(MissingFilterService);

  /** User card komponensek referenciái */
  private readonly userCards = viewChildren(MissingUserCardComponent);

  /** Töltés állapot */
  readonly isLoading = signal<boolean>(true);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Kapott bökések dialógus */
  readonly showReceivedDialog = signal<boolean>(false);

  /** Composer dialógus */
  readonly showComposer = signal<boolean>(false);
  readonly composerUser = signal<MissingUser | null>(null);

  // Poke service kapcsolat
  readonly categories = this.pokeService.missingCategories;
  readonly summary = this.pokeService.missingSummary;
  readonly dailyLimit = this.pokeService.dailyLimit;
  readonly unreadCount = this.pokeService.unreadCount;
  readonly receivedPokes = this.pokeService.receivedPokes;

  // Filter service delegálás
  readonly searchQuery = this.filterService.searchQuery;
  readonly personTab = this.filterService.personTab;
  readonly activeCategory = this.filterService.activeCategory;
  readonly hasActiveFilters = this.filterService.hasActiveFilters;
  readonly showPersonTabs = this.filterService.showPersonTabs;

  // Computed értékek
  readonly hasVotingMissing = computed(() => (this.categories().voting?.count ?? 0) > 0);
  readonly hasPhotoshootMissing = computed(() => (this.categories().photoshoot?.count ?? 0) > 0);
  readonly hasImageSelectionMissing = computed(() => (this.categories().image_selection?.count ?? 0) > 0);
  readonly noMissing = computed(() => !this.hasVotingMissing() && !this.hasPhotoshootMissing() && !this.hasImageSelectionMissing());

  readonly photoshootCount = computed(() => this.categories().photoshoot?.count ?? 0);
  readonly votingCount = computed(() => this.categories().voting?.count ?? 0);
  readonly imageSelectionCount = computed(() => this.categories().image_selection?.count ?? 0);

  readonly activeCategoryData = computed(() => this.filterService.getActiveCategoryData(this.categories()));
  readonly filteredUsers = computed(() => this.filterService.filterUsers(this.activeCategoryData()));
  readonly filteredCount = computed(() => this.filteredUsers().length);
  readonly studentCount = computed(() => this.filterService.getStudentCount(this.categories().photoshoot));
  readonly teacherCount = computed(() => this.filterService.getTeacherCount(this.categories().photoshoot));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pokeService.initialize()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoading.set(false),
        error: () => {
          this.errorMessage.set('Hiba történt az adatok betöltése során.');
          this.isLoading.set(false);
        }
      });
  }

  // Dialog műveletek
  openReceivedDialog(): void { this.showReceivedDialog.set(true); }
  closeReceivedDialog(): void { this.showReceivedDialog.set(false); }

  onReactionAdded(event: { poke: Poke; reaction: string }): void {
    this.pokeService.addReaction(event.poke.id, event.reaction as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.toastService.success('reakció', `${event.reaction} elküldve!`) });
  }

  markAllAsRead(): void {
    this.pokeService.markAllAsRead().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  refresh(): void { this.loadData(); }

  // Szűrő delegálás
  setCategory(category: CategoryTab): void { this.filterService.setCategory(category); }
  setPersonTab(tab: PersonTab): void { this.filterService.setPersonTab(tab); }
  clearSearch(): void { this.filterService.clearSearch(); }
  clearAllFilters(): void { this.filterService.clearAllFilters(); }

  // Composer műveletek
  onPokeClick(user: MissingUser): void {
    this.composerUser.set(user);
    this.showComposer.set(true);
  }

  onComposerResult(result: { action: 'send' | 'cancel'; presetKey?: string; customMessage?: string }): void {
    this.showComposer.set(false);
    if (result.action === 'send') {
      const user = this.composerUser();
      if (user) this.sendPokeToUser(user, result.presetKey, result.customMessage);
    }
    this.composerUser.set(null);
  }

  private sendPokeToUser(user: MissingUser, presetKey?: string, customMessage?: string): void {
    // Fotózásnál guestSessionId kell (MissingPerson-ből jön), szavazásnál a user.id már a guestSession.id
    const targetId = user.guestSessionId ?? user.id;
    this.pokeService.sendPoke(targetId, this.activeCategory() as PokeCategory, presetKey, customMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result) {
            this.toastService.success('bökés elküldve', `${result.poke.emoji || '👉'} ${user.name}`);
            this.markCardAsPoked(user.id);
            this.pokeService.loadMissingUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          }
        },
        error: () => this.toastService.error('hiba', 'nem sikerült elküldeni a bökést')
      });
  }

  /** Kártya jelölése sikeresen böködöttként */
  private markCardAsPoked(userId: number): void {
    const card = this.userCards().find(c => c.user().id === userId);
    card?.markAsPoked();
  }

  /** TrackBy function */
  readonly trackByUserId = trackById;
}
