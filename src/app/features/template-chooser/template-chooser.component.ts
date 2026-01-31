import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  TemplateChooserService,
  Template,
  TemplateCategory,
  SelectedTemplate
} from './services/template-chooser.service';
import { ToastService } from '../../core/services/toast.service';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Template Chooser Component - Minta Választó oldal
 *
 * Marketplace-stílusú template böngésző:
 * - Kategória szűrés (chips)
 * - Keresés
 * - Grid elrendezés
 * - Lightbox előnézet (child komponens)
 * - Load more pagination
 * - Auto-save kiválasztás
 *
 * Refactored: Lightbox logika kiemelve LightboxComponent-be
 */
@Component({
  selector: 'app-template-chooser',
  standalone: true,
  imports: [FormsModule, LightboxComponent],
  templateUrl: './template-chooser.component.html',
  styleUrls: ['./template-chooser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateChooserComponent implements OnInit {
  /** Categories */
  readonly categories = signal<TemplateCategory[]>([]);

  /** Templates */
  readonly templates = signal<Template[]>([]);

  /** Selected templates */
  readonly selections = signal<SelectedTemplate[]>([]);

  /** Active category filter */
  readonly activeCategory = signal<string | null>(null);

  /** Search query */
  readonly searchQuery = signal<string>('');

  /** Loading state */
  readonly loading = signal<boolean>(false);

  /** Has more templates to load */
  readonly hasMore = signal<boolean>(false);

  /** Max selections allowed */
  readonly maxSelections = signal<number>(3);

  /** Lightbox state */
  readonly lightboxOpen = signal<boolean>(false);
  readonly lightboxTemplate = signal<Template | null>(null);

  /** Computed: can select more */
  readonly canSelectMore = computed(() => this.selections().length < this.maxSelections());

  /** Computed: selection count text */
  readonly selectionCountText = computed(() => `${this.selections().length}/${this.maxSelections()}`);

  /** Computed: selection lookup map (O(1) lookup) */
  private readonly selectionMap = computed(() => {
    const map = new Map<number, boolean>();
    this.selections().forEach(s => map.set(s.id, true));
    return map;
  });

  /** DI - Angular 19+ inject() pattern */
  private readonly templateService = inject(TemplateChooserService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /** Subject for search debounce */
  private readonly searchSubject = new Subject<string>();

  /** Bound function for isSelected check (passed to lightbox) */
  readonly isSelectedFn = (id: number): boolean => this.selectionMap().has(id);

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSearchDebounce();
  }

  /**
   * Betölti a kezdeti adatokat
   */
  private loadInitialData(): void {
    this.loading.set(true);

    // Load categories
    this.templateService.loadCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toastService.error('Hiba', 'Nem sikerült betölteni a kategóriákat');
          this.logger.error('Categories load error', err);
        }
      });

    // Load templates
    this.templateService.loadTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült betölteni a mintákat');
          this.logger.error('Templates load error', err);
        }
      });

    // Load selections
    this.templateService.loadSelections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selections) => {
          this.selections.set(selections);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.logger.error('Selections load error', err);
        }
      });

    // Subscribe to service state
    this.templateService.hasMore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hasMore => {
        this.hasMore.set(hasMore);
        this.cdr.markForCheck();
      });

    this.templateService.maxSelections$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(max => {
        this.maxSelections.set(max);
        this.cdr.markForCheck();
      });
  }

  /**
   * Search debounce beállítása
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  /**
   * Search input változás (sanitized)
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Sanitize: max 100 karakter, veszélyes karakterek eltávolítása
    const sanitized = input.value.slice(0, 100).replace(/[<>'";&]/g, '');
    this.searchQuery.set(sanitized);
    this.searchSubject.next(sanitized);
  }

  /**
   * Keresés végrehajtása
   */
  private performSearch(query: string): void {
    this.loading.set(true);
    this.templateService.loadTemplates(this.activeCategory() || undefined, query || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error('Hiba', 'Keresési hiba');
          this.logger.error('Search error', err);
        }
      });
  }

  /**
   * Kategória kiválasztása
   */
  selectCategory(slug: string | null): void {
    this.activeCategory.set(slug);
    this.loading.set(true);

    this.templateService.loadTemplates(slug || undefined, this.searchQuery() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült betölteni a mintákat');
          this.logger.error('Filter error', err);
        }
      });
  }

  /**
   * Load more templates
   */
  loadMore(): void {
    if (this.loading() || !this.hasMore()) return;

    this.loading.set(true);

    this.templateService.loadMoreTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error('Hiba', 'Nem sikerült több mintát betölteni');
          this.logger.error('Load more error', err);
        }
      });
  }

  // ==================== LIGHTBOX ====================

  /**
   * Template kattintás (lightbox megnyitás)
   */
  openLightbox(template: Template): void {
    this.lightboxTemplate.set(template);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Kiválasztott minta chip-re kattintás - lightbox megnyitása
   */
  openLightboxForSelection(selection: SelectedTemplate): void {
    const template = this.templates().find(t => t.id === selection.id);
    if (template) {
      this.openLightbox(template);
    } else {
      this.openLightbox(selection);
    }
  }

  /**
   * Lightbox bezárása
   */
  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lightboxTemplate.set(null);
    document.body.style.overflow = '';
  }

  /**
   * Lightbox navigálás handler
   */
  onLightboxNavigate(direction: 'prev' | 'next'): void {
    const templates = this.templates();
    const currentIndex = templates.findIndex(t => t.id === this.lightboxTemplate()?.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : templates.length - 1;
    } else {
      newIndex = currentIndex < templates.length - 1 ? currentIndex + 1 : 0;
    }

    this.lightboxTemplate.set(templates[newIndex]);
  }

  /**
   * Lightbox index selection handler
   */
  onLightboxSelectByIndex(index: number): void {
    const templates = this.templates();
    if (index >= 0 && index < templates.length) {
      this.lightboxTemplate.set(templates[index]);
    }
  }

  // ==================== SELECTION ====================

  /**
   * Minta eltávolítása a kiválasztásból (X gomb)
   */
  removeSelection(selection: SelectedTemplate, event: Event): void {
    event.stopPropagation();
    this.toggleSelection(selection);
  }

  /**
   * Template kiválasztása/eltávolítása (checkbox)
   * OPTIMISTIC UI UPDATE: Az UI azonnal frissül, backend hiba esetén rollback
   */
  toggleSelection(template: Template, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const isSelected = this.isSelected(template.id);

    if (isSelected) {
      // === ELTÁVOLÍTÁS (Optimistic) ===
      const previousSelections = [...this.selections()];

      this.selections.update(sel => sel.filter(t => t.id !== template.id));
      this.cdr.markForCheck();

      this.templateService.deselectTemplate(template.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => {
            this.selections.set(previousSelections);
            this.cdr.markForCheck();
            this.toastService.error('Hiba', err.message || 'Nem sikerült eltávolítani');
          }
        });
    } else {
      // === KIVÁLASZTÁS (Optimistic) ===
      if (!this.canSelectMore()) {
        this.toastService.error('Maximum elérve', `Maximum ${this.maxSelections()} minta választható`);
        return;
      }

      const previousSelections = [...this.selections()];

      const newSelection: SelectedTemplate = {
        ...template,
        priority: this.selections().length + 1,
        selectedAt: new Date().toISOString()
      };
      this.selections.update(sel => [...sel, newSelection]);
      this.cdr.markForCheck();

      this.templateService.selectTemplate(template.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => {
            this.selections.set(previousSelections);
            this.cdr.markForCheck();
            this.toastService.error('Hiba', err.message || 'Nem sikerült kiválasztani');
          }
        });
    }
  }

  /**
   * Ellenőrzi, hogy a template ki van-e választva (O(1) lookup)
   */
  isSelected(templateId: number): boolean {
    return this.selectionMap().has(templateId);
  }

  // ==================== TRACKBY ====================

  trackByTemplate(index: number, template: Template): number {
    return template.id;
  }

  trackByCategory(index: number, category: TemplateCategory): number {
    return category.id;
  }
}
