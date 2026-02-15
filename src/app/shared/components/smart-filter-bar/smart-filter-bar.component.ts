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
import { PsSearchableSelectComponent } from '../form';
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
  readonly showSearchHelp = signal(false);
  readonly mobileSortOpen = signal(false);

  /** Mutatja-e a search help tooltipet */
  readonly hasSearchFeatures = computed(() => {
    const features = this.searchConfig().features;
    return features && (features.id || features.assignee || features.exact);
  });

  /** Aktuális rendezés label-je (mobil sort-hoz) */
  readonly currentSortLabel = computed(() => {
    const config = this.sortConfig();
    if (!config) return '';
    const opt = config.options.find(o => o.value === this.filterState().sortBy());
    return opt?.label || 'Rendezés';
  });

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

  /** Mobil sort dropdown toggle */
  toggleMobileSortDropdown(): void {
    this.mobileSortOpen.update(v => !v);
  }

  /** Search help toggle */
  toggleSearchHelp(event: MouseEvent): void {
    event.stopPropagation();
    this.showSearchHelp.update(v => !v);
  }

  /** Dokumentum kattintás - dropdown-ok bezárása */
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSearchHelp.set(false);
      this.mobileSortOpen.set(false);
    }
  }
}
