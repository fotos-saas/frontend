import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  ElementRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants';
import { FilterStateApi } from '../../utils/use-filter-state';
import { ExpandableFiltersComponent, FilterChangeEvent } from '../expandable-filters';
import { PsSearchableSelectComponent, PsInputComponent, PsHelpItem } from '../form';
import { SearchConfig, SearchableFilterDef, SortDef, FilterConfig } from './smart-filter-bar.types';

@Component({
  selector: 'app-smart-filter-bar',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    ExpandableFiltersComponent,
    PsSearchableSelectComponent,
    PsInputComponent,
  ],
  templateUrl: './smart-filter-bar.component.html',
  styleUrl: './smart-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SmartFilterBarComponent {
  private readonly elementRef = inject(ElementRef);

  readonly ICONS = ICONS;

  // === REQUIRED ===
  readonly filterState = input.required<FilterStateApi<any>>();
  readonly searchConfig = input.required<SearchConfig>();

  // === OPTIONAL ===
  readonly filterConfigs = input<FilterConfig[]>([]);
  readonly visibleFilterCount = input<number>(3);
  readonly searchableFilters = input<SearchableFilterDef[]>([]);
  readonly sortConfig = input<SortDef | null>(null);

  // === INTERNAL STATE ===
  readonly mobileSortOpen = signal(false);
  readonly mobileFiltersOpen = signal(false);
  readonly desktopSortOpen = signal(false);

  /** Van-e aktív keresési szöveg */
  readonly hasSearchText = computed(() => !!this.filterState().search());

  /** Aktív szűrők száma (nem üres értékek) */
  readonly activeFilterCount = computed(() => {
    const filters = this.filterState().filters();
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  });

  /** Van-e aktív szűrő */
  readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  /** Mutatja-e a search help tooltipet */
  readonly hasSearchFeatures = computed(() => {
    const features = this.searchConfig().features;
    return features && (features.id || features.assignee || features.exact);
  });

  /** Keresési szintaxis help items ps-input-hoz */
  readonly searchHelpItems = computed<PsHelpItem[]>(() => {
    const features = this.searchConfig().features;
    if (!features) return [];
    const items: PsHelpItem[] = [];
    if (features.id) items.push({ syntax: '#123', description: 'Projekt ID keresése' });
    if (features.assignee) items.push({ syntax: '@név', description: 'Ügyintéző keresése' });
    if (features.exact) items.push({ syntax: '"szöveg"', description: 'Pontos egyezés' });
    return items;
  });

  /** Aktuális rendezés label-je (mobil sort-hoz) */
  readonly currentSortLabel = computed(() => {
    const config = this.sortConfig();
    if (!config) return '';
    const opt = config.options.find(o => o.value === this.filterState().sortBy());
    return opt?.label || 'Rendezés';
  });

  /** Keresés törlése */
  clearSearch(): void {
    this.filterState().clearSearch();
  }

  /** ExpandableFilters filterChange kezelése */
  onFilterChange(event: FilterChangeEvent): void {
    this.filterState().setFilter(event.id, event.value);
  }

  /** SearchableSelect változás kezelése */
  onSearchableFilterChange(filterId: string, value: string): void {
    this.filterState().setFilter(filterId, value);
  }

  /** Mobil rendezés: opció kiválasztása */
  selectMobileSortOption(value: string): void {
    this.mobileSortOpen.set(false);
    this.filterState().setSortBy(value);
  }

  /** Mobil rendezés: irány váltás */
  toggleMobileSortDir(): void {
    this.filterState().toggleSortDir();
  }

  /** Mobil szűrők toggle */
  toggleMobileFilters(): void {
    this.mobileFiltersOpen.update(v => !v);
  }

  /** Mobil sort dropdown toggle */
  toggleMobileSortDropdown(): void {
    this.mobileSortOpen.update(v => !v);
  }

  /** Desktop sort dropdown toggle */
  toggleDesktopSortDropdown(): void {
    this.desktopSortOpen.update(v => !v);
  }

  /** Desktop sort: opció kiválasztása */
  selectDesktopSortOption(value: string): void {
    this.desktopSortOpen.set(false);
    this.filterState().setSortBy(value);
  }

  /** Desktop sort: irány váltás (stopPropagation, hogy ne záródjon a dropdown) */
  toggleDesktopSortDir(event: MouseEvent): void {
    event.stopPropagation();
    this.filterState().toggleSortDir();
  }

  /** Dokumentum kattintás - dropdown-ok bezárása */
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.mobileSortOpen.set(false);
      this.mobileFiltersOpen.set(false);
      this.desktopSortOpen.set(false);
    }
  }
}
