import {
  Component, inject, input, output, signal,
  DestroyRef, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { TimeSlot, BookingConflict } from '../../../models/booking.models';

@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      variant="edit"
      headerStyle="flat"
      theme="amber"
      [icon]="ICONS.CALENDAR"
      title="Foglalás átütemezése"
      size="md"
      [errorMessage]="errorMsg()"
      (closeEvent)="close.emit()"
      (submitEvent)="onConfirm()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <div class="field">
          <label for="rs-date">Új dátum *</label>
          <input id="rs-date" type="date" [(ngModel)]="newDate" (ngModelChange)="loadSlots()" class="input" />
        </div>

        <div class="field">
          <label>Új időpont *</label>
          @if (loadingSlots()) {
            <div class="slots-loading">Időpontok betöltése...</div>
          } @else if (availableSlots().length === 0 && newDate) {
            <div class="slots-empty">Nincs elérhető időpont erre a napra.</div>
          } @else {
            <div class="slot-grid">
              @for (slot of availableSlots(); track slot.start_time) {
                <button type="button" class="slot-btn" [class.selected]="newStartTime === slot.start_time"
                  (click)="newStartTime = slot.start_time">
                  {{ slot.start_time }}
                </button>
              }
            </div>
          }
        </div>

        @if (conflicts().length > 0) {
          <div class="conflict-list">
            @for (conflict of conflicts(); track $index) {
              <div class="conflict-item">
                <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="16" />
                <span>{{ conflict.message }}</span>
              </div>
            }
          </div>
        }
      </div>
      <ng-container dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">Mégse</button>
        <button class="btn btn--amber" [disabled]="!isValid() || saving()" (click)="onConfirm()">
          @if (saving()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          }
          Átütemezés
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;
      label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    }
    .input {
      padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9375rem;
      width: 100%; box-sizing: border-box;
      &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    }

    .slot-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .slot-btn {
      padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;
      font-size: 0.8125rem; cursor: pointer; transition: all 0.15s;
      &:hover { border-color: #f59e0b; background: #fffbeb; }
      &.selected { background: #f59e0b; color: #fff; border-color: #f59e0b; }
    }
    .slots-loading, .slots-empty { font-size: 0.8125rem; color: #94a3b8; padding: 8px 0; }

    .conflict-list { margin-top: 8px; }
    .conflict-item {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 4px;
      background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;
      font-size: 0.8125rem; color: #92400e;
    }
  `],
})
export class RescheduleDialogComponent {
  readonly bookingId = input.required<number>();
  readonly sessionTypeId = input.required<number>();
  readonly close = output<void>();
  readonly confirmed = output<{ date: string; start_time: string }>();

  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  availableSlots = signal<TimeSlot[]>([]);
  conflicts = signal<BookingConflict[]>([]);
  loadingSlots = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  newDate = '';
  newStartTime = '';

  loadSlots(): void {
    if (!this.newDate) return;
    this.newStartTime = '';
    this.loadingSlots.set(true);
    this.bookingService.getAvailableSlots(this.newDate, this.sessionTypeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.availableSlots.set(res.data); this.loadingSlots.set(false); },
        error: () => { this.availableSlots.set([]); this.loadingSlots.set(false); },
      });
  }

  isValid(): boolean {
    return this.newDate.length > 0 && this.newStartTime.length > 0;
  }

  onConfirm(): void {
    if (!this.isValid()) return;
    this.confirmed.emit({ date: this.newDate, start_time: this.newStartTime });
  }
}
