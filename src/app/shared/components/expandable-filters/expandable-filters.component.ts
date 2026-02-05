import {
  Component,
  input,
  output,
  signal,
  computed,
  HostListener,
  ElementRef,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants';

/**
 * Szűrő opció interface
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Szűrő konfiguráció interface
 */
export interface FilterConfig {
  /** Egyedi azonosító */
  id: string;
  /** Placeholder/default szöveg */
  label: string;
  /** Elérhető opciók */
  options: FilterOption[];
  /** Opcionális Lucide ikon neve */
  icon?: string;
}

/**
 * Szűrő változás event interface
 */
export interface FilterChangeEvent {
  id: string;
  value: string;
}

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
  imports: [LucideAngularModule],
  template: `
    <div class="expandable-filters">
      <!-- Látható szűrők (első N db) - inline -->
      @for (filter of visibleFilters(); track filter.id) {
        <div class="filter-item" [class.filter-item--with-icon]="filter.icon">
          @if (filter.icon) {
            <lucide-icon [name]="filter.icon" [size]="14" class="filter-icon" />
          }
          <select
            (change)="onFilterSelectChange(filter.id, $event)"
            class="filter-select"
            [class.filter-select--with-icon]="filter.icon"
          >
            <option value="" [selected]="!getFilterValue(filter.id)">{{ filter.label }}</option>
            @for (opt of filter.options; track opt.value) {
              <option [value]="opt.value" [selected]="getFilterValue(filter.id) === opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>
      }

      <!-- "További szűrők" gomb + dropdown (ha van rejtett) -->
      @if (hasHiddenFilters()) {
        <div class="more-filters-wrapper">
          <button
            type="button"
            class="more-filters-btn"
            [class.more-filters-btn--active]="expanded() || activeHiddenCount() > 0"
            (click)="toggleExpanded($event)"
          >
            <lucide-icon [name]="ICONS.FILTER" [size]="14" />
            <span class="more-filters-btn__text">További</span>
            @if (activeHiddenCount() > 0) {
              <span class="active-dot"></span>
            }
            <lucide-icon
              [name]="expanded() ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN"
              [size]="12"
              class="more-filters-btn__chevron"
            />
          </button>

          <!-- Dropdown panel - gomb alatt jelenik meg -->
          @if (expanded()) {
            <div class="filters-dropdown" (click)="$event.stopPropagation()">
              @for (filter of hiddenFilters(); track filter.id) {
                <div class="dropdown-filter">
                  <label class="dropdown-label">{{ filter.label }}</label>
                  <select
                    (change)="onFilterSelectChange(filter.id, $event)"
                    class="dropdown-select"
                  >
                    <option value="" [selected]="!getFilterValue(filter.id)">Mind</option>
                    @for (opt of filter.options; track opt.value) {
                      <option [value]="opt.value" [selected]="getFilterValue(filter.id) === opt.value">{{ opt.label }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Szűrők törlése gomb -->
              @if (activeHiddenCount() > 0) {
                <button
                  type="button"
                  class="clear-filters-btn"
                  (click)="clearHiddenFilters()"
                >
                  <lucide-icon [name]="ICONS.X" [size]="12" />
                  Szűrők törlése
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Összes szűrő törlése gomb (ha van bármelyik aktív) -->
      @if (hasAnyActiveFilter()) {
        <button
          type="button"
          class="clear-all-btn"
          (click)="clearAllFilters($event)"
          data-tooltip="Szűrők törlése"
        >
          <lucide-icon [name]="ICONS.X" [size]="14" />
        </button>
      }
    </div>
  `,
  styles: [`
    .expandable-filters {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-item {
      position: relative;
      display: flex;
      align-items: center;
    }

    .filter-item--with-icon {
      /* Nincs extra stílus, a filter-icon pozicionálja */
    }

    .filter-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
      z-index: 1;
    }

    .filter-select {
      padding: 10px 32px 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }

    .filter-select--with-icon {
      padding-left: 34px;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .filter-select:hover {
      border-color: #cbd5e1;
    }

    /* További szűrők gomb */
    .more-filters-wrapper {
      position: relative;
    }

    .more-filters-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #475569;
    }

    .more-filters-btn:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .more-filters-btn--active {
      border-color: var(--color-primary, #1e3a5f);
      background: #e0f2fe;
      color: var(--color-primary, #1e3a5f);
    }

    .more-filters-btn__text {
      font-weight: 500;
    }

    .more-filters-btn__chevron {
      margin-left: 2px;
      opacity: 0.7;
    }

    .active-dot {
      width: 8px;
      height: 8px;
      background: var(--color-primary, #1e3a5f);
      border-radius: 50%;
    }

    /* Összes szűrő törlése gomb */
    .clear-all-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-all-btn:hover {
      border-color: #fecaca;
      background: #fef2f2;
      color: #dc2626;
    }

    /* Dropdown panel */
    .filters-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 280px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      padding: 16px;
      z-index: 100;
      animation: dropdownFadeIn 0.15s ease;

      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-filter {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dropdown-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .dropdown-select {
      padding: 10px 32px 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }

    .dropdown-select:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .dropdown-select:hover {
      border-color: #cbd5e1;
    }

    /* Szűrők törlése gomb */
    .clear-filters-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: #dc2626;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s ease;
      margin-top: 4px;
    }

    .clear-filters-btn:hover {
      background: #fef2f2;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .filters-dropdown {
        animation: none;
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .expandable-filters {
        flex-wrap: wrap;
      }

      .more-filters-btn__text {
        display: none;
      }

      .more-filters-btn {
        padding: 10px 12px;
      }

      .filters-dropdown {
        right: auto;
        left: 0;
        min-width: 260px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  readonly visibleFilters = computed(() => {
    return this.filters().slice(0, this.visibleCount());
  });

  /** Rejtett szűrők (N után) */
  readonly hiddenFilters = computed(() => {
    return this.filters().slice(this.visibleCount());
  });

  /** Van-e rejtett szűrő */
  readonly hasHiddenFilters = computed(() => {
    return this.filters().length > this.visibleCount();
  });

  /** Aktív rejtett szűrők száma */
  readonly activeHiddenCount = computed(() => {
    const hidden = this.hiddenFilters();
    const vals = this.values();
    return hidden.filter(f => vals[f.id] && vals[f.id] !== '').length;
  });

  /** Van-e bármelyik aktív szűrő (összes törlés gombhoz) */
  readonly hasAnyActiveFilter = computed(() => {
    const vals = this.values();
    return this.filters().some(f => vals[f.id] && vals[f.id] !== '');
  });

  /** Dokumentum kattintás - dropdown bezárása ha kívülre kattintunk */
  @HostListener('document:click', ['$event'])
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
    const hidden = this.hiddenFilters();
    hidden.forEach(filter => {
      if (this.values()[filter.id]) {
        this.filterChange.emit({ id: filter.id, value: '' });
      }
    });
    this.expanded.set(false);
  }

  /** Összes szűrő törlése */
  clearAllFilters(event: MouseEvent): void {
    event.stopPropagation();
    this.filters().forEach(filter => {
      if (this.values()[filter.id]) {
        this.filterChange.emit({ id: filter.id, value: '' });
      }
    });
    this.expanded.set(false);
  }
}
