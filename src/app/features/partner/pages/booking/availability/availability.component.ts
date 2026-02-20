import {
  Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import {
  AvailabilityPattern, AvailabilitySettings, AvailabilityOverride, BlockedDate,
} from '../../../models/booking.models';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BlockedDateDialogComponent } from './blocked-date-dialog.component';
import { OverrideDialogComponent } from './override-dialog.component';

const DAY_NAMES = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    FormsModule, LucideAngularModule, MatTooltipModule,
    ConfirmDialogComponent, BlockedDateDialogComponent, OverrideDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
})
export class AvailabilityComponent implements OnInit {
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly DAY_NAMES = DAY_NAMES;

  patterns = signal<AvailabilityPattern[]>([]);
  settings = signal<AvailabilitySettings>({ buffer_minutes: 15, max_daily: 8, min_notice_hours: 24, max_advance_days: 90 });
  overrides = signal<AvailabilityOverride[]>([]);
  blockedDates = signal<BlockedDate[]>([]);
  loading = signal(true);
  saving = signal(false);
  showBlockedDialog = signal(false);
  showOverrideDialog = signal(false);
  deletingBlocked = signal<BlockedDate | null>(null);
  deletingOverride = signal<AvailabilityOverride | null>(null);

  ngOnInit(): void { this.loadAvailability(); }

  loadAvailability(): void {
    this.loading.set(true);
    this.bookingService.getAvailability().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.patterns.set(res.data.patterns); this.settings.set(res.data.settings);
        this.overrides.set(res.data.overrides); this.blockedDates.set(res.data.blocked_dates);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveAll(): void {
    this.saving.set(true);
    this.bookingService.updatePatterns(this.patterns()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.bookingService.updateSettings(this.settings()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.saving.set(false), error: () => this.saving.set(false),
        });
      },
      error: () => this.saving.set(false),
    });
  }

  onBlockedDateSaved(data: { start_date: string; end_date: string; reason?: string }): void {
    this.showBlockedDialog.set(false);
    this.bookingService.createBlockedDate(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.blockedDates.update(list => [...list, res.data]),
    });
  }

  confirmDeleteBlocked(bd: BlockedDate): void { this.deletingBlocked.set(bd); }

  deleteBlocked(): void {
    const bd = this.deletingBlocked();
    if (!bd) return;
    this.bookingService.deleteBlockedDate(bd.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.blockedDates.update(list => list.filter(b => b.id !== bd.id)); this.deletingBlocked.set(null); },
      error: () => this.deletingBlocked.set(null),
    });
  }

  onOverrideSaved(data: { date: string; start_time: string; end_time: string; note?: string }): void {
    this.showOverrideDialog.set(false);
    this.bookingService.createOverride(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.overrides.update(list => [...list, res.data]),
    });
  }

  confirmDeleteOverride(ov: AvailabilityOverride): void { this.deletingOverride.set(ov); }

  deleteOverride(): void {
    const ov = this.deletingOverride();
    if (!ov) return;
    this.bookingService.deleteOverride(ov.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.overrides.update(list => list.filter(o => o.id !== ov.id)); this.deletingOverride.set(null); },
      error: () => this.deletingOverride.set(null),
    });
  }
}
