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
  templateUrl: './booking-list.component.html',
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
        next: (res) => {
          this.bookings.set(res.data ?? []);
          this.totalPages.set((res.meta?.['last_page'] as number) ?? 1);
          this.filterState.loading.set(false);
        },
        error: () => this.filterState.loading.set(false),
      });
  }
}
