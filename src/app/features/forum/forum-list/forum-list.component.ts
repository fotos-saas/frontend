import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '../../../core/services/logger.service';
import { Router, RouterModule } from '@angular/router';
import { ForumService, Discussion, DiscussionFilters } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { GuestService } from '../../../core/services/guest.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ForumCardComponent } from '../forum-card/forum-card.component';
import { CreateDiscussionDialogComponent, CreateDiscussionResult } from '../create-discussion-dialog/create-discussion-dialog.component';
import { ForumSearchComponent, ForumFilters, TemplateOption } from '../forum-search/forum-search.component';

/**
 * Forum List Component
 *
 * Beszélgetések listája:
 * - Kitűzött témák felül
 * - Legfrissebb hozzászólás szerint rendezve
 * - Új téma létrehozás gomb (kapcsolattartó)
 */
@Component({
    selector: 'app-forum-list',
    imports: [
        RouterModule,
        GuestNameDialogComponent,
        ForumCardComponent,
        CreateDiscussionDialogComponent,
        ForumSearchComponent,
  ],
    templateUrl: './forum-list.component.html',
    styleUrls: ['./forum-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumListComponent implements OnInit {
  /** Beszélgetések */
  readonly discussions = signal<Discussion[]>([]);

  /** Betöltés */
  readonly isLoading = signal<boolean>(true);

  /** Hiba üzenet */
  readonly errorMessage = signal<string | null>(null);

  /** Guest név dialógus */
  readonly showGuestNameDialog = signal<boolean>(false);
  readonly isGuestRegistering = signal<boolean>(false);
  readonly guestError = signal<string | null>(null);

  /** Új téma dialógus */
  readonly showCreateDialog = signal<boolean>(false);

  /** Elérhető sablonok (szűréshez) */
  readonly templates = signal<TemplateOption[]>([]);

  /** Aktuális szűrők */
  private currentFilters: DiscussionFilters = {};

  /** DestroyRef for takeUntilDestroyed */
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  constructor(
    private router: Router,
    private forumService: ForumService,
    private authService: AuthService,
    private guestService: GuestService
  ) {}

  ngOnInit(): void {
    // Vendég névbekérés ellenőrzése - csak 'share' session esetén
    // A 'code' session kapcsolattartóként működik (van contact_id a token-ben)
    if (this.authService.isGuest() && !this.guestService.hasRegisteredSession()) {
      this.showGuestNameDialog.set(true);
    }

    this.loadDiscussions();
  }

  /**
   * Beszélgetések betöltése (opcionális szűréssel)
   */
  loadDiscussions(filters?: DiscussionFilters): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.forumService.loadDiscussions(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (discussions) => {
          // Rendezés: kitűzöttek felül, aztán dátum szerint
          const sorted = [...discussions].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const dateA = a.lastPostAt || a.createdAt;
            const dateB = b.lastPostAt || b.createdAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          this.discussions.set(sorted);

          // Sablonok kinyerése a beszélgetésekből (unique)
          this.extractTemplates(discussions);

          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Szűrők változás kezelése
   */
  onFiltersChange(filters: ForumFilters): void {
    this.currentFilters = {
      search: filters.search,
      templateId: filters.templateId,
      sortBy: filters.sortBy
    };
    this.loadDiscussions(this.currentFilters);
  }

  /**
   * Sablonok kinyerése (unique lista a dropdownhoz)
   */
  private extractTemplates(discussions: Discussion[]): void {
    const templateMap = new Map<number, TemplateOption>();
    discussions.forEach(d => {
      if (d.templateId && d.templateName) {
        templateMap.set(d.templateId, { id: d.templateId, name: d.templateName });
      }
    });
    this.templates.set(Array.from(templateMap.values()));
  }

  /**
   * Beszélgetés megnyitása
   */
  openDiscussion(discussion: Discussion): void {
    this.router.navigate(['/forum', discussion.slug]);
  }

  /**
   * Új beszélgetés létrehozása (kapcsolattartó)
   */
  createDiscussion(): void {
    this.showCreateDialog.set(true);
  }

  /**
   * Új téma dialógus eredmény
   */
  onCreateDiscussionResult(result: CreateDiscussionResult): void {
    this.showCreateDialog.set(false);

    if (result.action === 'created') {
      this.logger.info('Új beszélgetés létrehozva', { slug: result.slug });
      // Navigálás az új beszélgetéshez
      this.router.navigate(['/forum', result.slug]);
    }
  }

  /**
   * Guest név dialógus eredmény
   */
  onGuestNameResult(result: GuestNameResult): void {
    if (result.action === 'close') return;

    this.isGuestRegistering.set(true);
    this.guestError.set(null);

    this.guestService.register(result.name, result.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showGuestNameDialog.set(false);
          this.isGuestRegistering.set(false);
          this.loadDiscussions();
        },
        error: (err) => {
          this.guestError.set(err.message);
          this.isGuestRegistering.set(false);
        }
      });
  }

  /**
   * Kitűzött beszélgetések (computed signal - csak discussions() változáskor fut)
   */
  readonly pinnedDiscussions = computed(() =>
    this.discussions().filter(d => d.isPinned)
  );

  /**
   * Nem kitűzött beszélgetések (computed signal)
   */
  readonly regularDiscussions = computed(() =>
    this.discussions().filter(d => !d.isPinned)
  );

  /**
   * Teljes hozzáférés (kapcsolattartó) (computed signal)
   */
  readonly hasFullAccess = computed(() => this.authService.hasFullAccess());

  /**
   * TrackBy discussion id alapján (readonly arrow function)
   */
  readonly trackByDiscussionId = (_: number, discussion: Discussion) => discussion.id;
}
