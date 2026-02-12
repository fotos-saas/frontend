import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants';
import { FilterConfig, FilterChangeEvent } from './expandable-filters.model';

/**
 * ExpandableFilters Component
 *
 * Újrahasználható szűrő komponens "További szűrők" funkcióval.
 * - Megjeleníti az első N szűrőt közvetlenül (inline)
 * - Ha több szűrő van, egy "További" gomb jelenik meg dropdown panellel
 *
 * @example
 * <app-expandable-filters
 *   [filters]="filterConfigs"
 *   [values]="filterValues()"
 *   [visibleCount]="3"
 *   (filterChange)="onFilterChange($event)"
 * />
 */
@Component({
  selector: 'app-expandable-filters',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './expandable-filters.component.html',
  styleUrl: './expandable-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class ExpandableFiltersComponent {
  private readonly elementRef = inject(ElementRef);

  /** ICONS konstansok */
  readonly ICONS = ICONS;

  /** Signal-based inputs */
  readonly filters = input<FilterConfig[]>([]);
  readonly values = input<Record<string, string>>({});
  readonly visibleCount = input<number>(3);

  /** Signal-based output */
  readonly filterChange = output<FilterChangeEvent>();

  /** Dropdown nyitva-e */
  readonly expanded = signal(false);

  /** Látható szűrők (első N db) */
  readonly visibleFilters = computed(() =>
    this.filters().slice(0, this.visibleCount())
  );

  /** Rejtett szűrők (N után) */
  readonly hiddenFilters = computed(() =>
    this.filters().slice(this.visibleCount())
  );

  /** Van-e rejtett szűrő */
  readonly hasHiddenFilters = computed(() =>
    this.filters().length > this.visibleCount()
  );

  /** Aktív rejtett szűrők száma */
  readonly activeHiddenCount = computed(() => {
    const vals = this.values();
    return this.hiddenFilters().filter(f => vals[f.id] && vals[f.id] !== '').length;
  });

  /** Van-e bármelyik aktív szűrő (összes törlés gombhoz) */
  readonly hasAnyActiveFilter = computed(() => {
    const vals = this.values();
    return this.filters().some(f => vals[f.id] && vals[f.id] !== '');
  });

  /** Dokumentum kattintás - dropdown bezárása ha kívülre kattintunk */
  onDocumentClick(event: MouseEvent): void {
    if (this.expanded() && !this.elementRef.nativeElement.contains(event.target)) {
      this.expanded.set(false);
    }
  }

  /** Szűrő érték lekérése */
  getFilterValue(filterId: string): string {
    return this.values()[filterId] || '';
  }

  /** Dropdown toggle */
  toggleExpanded(event: MouseEvent): void {
    event.stopPropagation();
    this.expanded.update(v => !v);
  }

  /** Szűrő select változás */
  onFilterSelectChange(filterId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterChange.emit({ id: filterId, value: select.value });
  }

  /** Rejtett szűrők törlése */
  clearHiddenFilters(): void {
    for (const filter of this.hiddenFilters()) {
      if (this.values()[filter.id]) {
        this.filterChange.emit({ id: filter.id, value: '' });
      }
    }
    this.expanded.set(false);
  }

  /** Összes szűrő törlése */
  clearAllFilters(event: MouseEvent): void {
    event.stopPropagation();
    for (const filter of this.filters()) {
      if (this.values()[filter.id]) {
        this.filterChange.emit({ id: filter.id, value: '' });
      }
    }
    this.expanded.set(false);
  }
}
