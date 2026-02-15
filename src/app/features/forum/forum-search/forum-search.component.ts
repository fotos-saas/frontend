import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PsInputComponent, PsSelectComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';

/**
 * Szűrési opciók
 */
export interface ForumFilters {
  search?: string;
  templateId?: number;
  sortBy?: 'latest' | 'oldest' | 'most_posts' | 'most_views';
}

/**
 * Sablon opció (dropdown-hoz)
 */
export interface TemplateOption {
  id: number;
  name: string;
}

/**
 * Forum Search Component
 *
 * Keresés és szűrés a fórum témák között.
 * - Szabad szöveges keresés
 * - Sablon szűrés (dropdown)
 * - Rendezés
 */
@Component({
  selector: 'app-forum-search',
  imports: [FormsModule, PsInputComponent, PsSelectComponent],
  templateUrl: './forum-search.component.html',
  styleUrls: ['./forum-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumSearchComponent {
  /** Elérhető sablonok szűréshez */
  readonly templates = input<TemplateOption[]>([]);

  /** Szűrés változás */
  readonly filtersChange = output<ForumFilters>();

  /** Keresési szöveg */
  searchText = '';

  /** Kiválasztott sablon ID */
  selectedTemplateId: number | null = null;

  /** Rendezés */
  sortBy: ForumFilters['sortBy'] = 'latest';

  /** Szűrők panel láthatóság */
  readonly showFilters = signal<boolean>(false);

  /** Rendezési opciók */
  readonly sortOptions: { value: ForumFilters['sortBy']; label: string }[] = [
    { value: 'latest', label: 'Legújabb' },
    { value: 'oldest', label: 'Legrégebbi' },
    { value: 'most_posts', label: 'Legtöbb hozzászólás' },
    { value: 'most_views', label: 'Legtöbb megtekintés' }
  ];

  /** PsSelect opciók */
  readonly sortSelectOptions: PsSelectOption[] = this.sortOptions.map(o => ({ id: o.value!, label: o.label }));

  readonly templateSelectOptions = computed<PsSelectOption[]>(() =>
    this.templates().map(t => ({ id: t.id, label: t.name }))
  );

  /**
   * Keresés indítása
   */
  onSearch(): void {
    this.emitFilters();
  }

  /**
   * Keresés törlése
   */
  clearSearch(): void {
    this.searchText = '';
    this.emitFilters();
  }

  /**
   * Sablon szűrés változás
   */
  onTemplateChange(): void {
    this.emitFilters();
  }

  /**
   * Rendezés változás
   */
  onSortChange(): void {
    this.emitFilters();
  }

  /**
   * Szűrők toggle
   */
  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  /**
   * Összes szűrő törlése
   */
  clearAllFilters(): void {
    this.searchText = '';
    this.selectedTemplateId = null;
    this.sortBy = 'latest';
    this.emitFilters();
  }

  /**
   * Van-e aktív szűrő?
   */
  get hasActiveFilters(): boolean {
    return !!this.searchText || this.selectedTemplateId !== null || this.sortBy !== 'latest';
  }

  /**
   * Szűrők kiküldése
   */
  private emitFilters(): void {
    const filters: ForumFilters = {};

    if (this.searchText.trim()) {
      filters.search = this.searchText.trim();
    }

    if (this.selectedTemplateId !== null) {
      filters.templateId = this.selectedTemplateId;
    }

    if (this.sortBy && this.sortBy !== 'latest') {
      filters.sortBy = this.sortBy;
    }

    this.filtersChange.emit(filters);
  }
}
