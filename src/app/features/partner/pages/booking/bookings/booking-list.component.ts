import {
  Component, OnInit, inject, signal, computed, output,
  DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import {
  Booking, BookingStatus, BookingSource,
  BOOKING_STATUS_CONFIG,
} from '../../../models/booking.models';
import { useFilterState } from '../../../../../shared/utils/use-filter-state';
import { ListPaginationComponent } from '../../../../../shared/components/list-pagination/list-pagination.component';
import { SmartFilterBarComponent } from '../../../../../shared/components/smart-filter-bar';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    FormsModule, LucideAngularModule, MatTooltipModule, DecimalPipe,
    ListPaginationComponent, SmartFilterBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="booking-list page-card">
      <div class="page-header">
        <div class="header-content">
          <h1>Foglalások</h1>
          <p class="subtitle">Foglalások kezelése és áttekintése</p>
        </div>
        <button class="btn btn--primary" (click)="newBooking.emit()">
          <lucide-icon [name]="ICONS.PLUS" [size]="16" />
          Új foglalás
        </button>
      </div>

      <!-- Szűrők -->
      <div class="filters">
        <div class="search-box">
          <lucide-icon [name]="ICONS.SEARCH" [size]="18" class="search-icon" />
          <input type="text" class="search-input"
            placeholder="Keresés név, iskola, azonosító..."
            [ngModel]="filterState.search()"
            (ngModelChange)="filterState.setSearch($event)" />
          @if (filterState.search()) {
            <button class="clear-btn" (click)="filterState.clearSearch()">
              <lucide-icon [name]="ICONS.X" [size]="16" />
            </button>
          }
        </div>
        <select class="filter-select" [ngModel]="filterState.filters().status"
          (ngModelChange)="filterState.setFilter('status', $event)">
          <option value="">Minden státusz</option>
          @for (s of statusOptions; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
        <select class="filter-select" [ngModel]="filterState.filters().source"
          (ngModelChange)="filterState.setFilter('source', $event)">
          <option value="">Minden forrás</option>
          @for (s of sourceOptions; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
      </div>

      @if (filterState.loading()) {
        <div class="loading-state">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row skeleton-shimmer"></div>
          }
        </div>
      } @else if (bookings().length === 0) {
        <div class="empty-state">
          <lucide-icon [name]="ICONS.CALENDAR" [size]="48" class="empty-icon" />
          <h3>Nincs foglalás</h3>
          <p>A szűrési feltételeknek megfelelő foglalás nem található.</p>
        </div>
      } @else {
        <div class="table-header" [style.--table-cols]="gridTemplate">
          <span class="th">Azonosító</span>
          <span class="th">Típus</span>
          <span class="th">Dátum</span>
          <span class="th">Időpont</span>
          <span class="th">Kapcsolattartó</span>
          <span class="th">Iskola</span>
          <span class="th">Státusz</span>
        </div>
        <div class="row-grid">
          @for (booking of bookings(); track booking.id; let i = $index) {
            <div class="list-row" [style.animation-delay]="i * 0.03 + 's'"
              [style.--table-cols]="gridTemplate"
              (click)="selectBooking.emit(booking)">
              <span class="cell cell--id">{{ booking.booking_number }}</span>
              <span class="cell">
                <span class="type-dot" [style.background]="booking.session_type.color"></span>
                {{ booking.session_type.name }}
              </span>
              <span class="cell">{{ booking.date }}</span>
              <span class="cell">{{ booking.start_time }}</span>
              <span class="cell cell--name">{{ booking.contact_name }}</span>
              <span class="cell cell--school">{{ booking.school_name ?? '-' }}</span>
              <span class="cell">
                <span class="status-badge status-badge--{{ BOOKING_STATUS_CONFIG[booking.status].color }}">
                  {{ BOOKING_STATUS_CONFIG[booking.status].label }}
                </span>
              </span>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="filterState.page() <= 1"
              (click)="filterState.setPage(filterState.page() - 1)">
              <lucide-icon [name]="ICONS.CHEVRON_LEFT" [size]="16" /> Előző
            </button>
            <span class="page-info">{{ filterState.page() }} / {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="filterState.page() >= totalPages()"
              (click)="filterState.setPage(filterState.page() + 1)">
              Következő <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
            </button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent implements OnInit {
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly BOOKING_STATUS_CONFIG = BOOKING_STATUS_CONFIG;

  readonly newBooking = output<void>();
  readonly selectBooking = output<Booking>();

  readonly gridTemplate = '100px 1fr 100px 80px 1fr 1fr 120px';

  readonly statusOptions: { value: BookingStatus; label: string }[] = [
    { value: 'requested', label: 'Kérelem' },
    { value: 'confirmed', label: 'Visszaigazolt' },
    { value: 'completed', label: 'Teljesített' },
    { value: 'canceled', label: 'Lemondott' },
    { value: 'no_show', label: 'Nem jelent meg' },
  ];

  readonly sourceOptions: { value: BookingSource; label: string }[] = [
    { value: 'manual', label: 'Kézi' },
    { value: 'public_link', label: 'Foglalási link' },
    { value: 'csv_import', label: 'CSV import' },
    { value: 'widget', label: 'Widget' },
  ];

  readonly filterState = useFilterState({
    context: { type: 'partner', page: 'bookings' },
    defaultFilters: { status: '', source: '' },
    defaultSortBy: 'date',
    defaultSortDir: 'desc',
    onStateChange: () => this.loadBookings(),
  });

  bookings = signal<Booking[]>([]);
  totalPages = signal(1);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.filterState.loading.set(true);

    const params: Record<string, string | number | undefined> = {
      page: this.filterState.page(),
      per_page: 20,
      search: this.filterState.search() || undefined,
      status: this.filterState.filters().status || undefined,
      source: this.filterState.filters().source || undefined,
      sort_by: this.filterState.sortBy(),
      sort_dir: this.filterState.sortDir(),
    };

    this.bookingService.getBookings(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.bookings.set(res.data?.items ?? res.data ?? []);
          this.totalPages.set(res.data?.pagination?.last_page ?? 1);
          this.filterState.loading.set(false);
        },
        error: () => this.filterState.loading.set(false),
      });
  }
}
