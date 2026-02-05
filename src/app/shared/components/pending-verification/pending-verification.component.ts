import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  DestroyRef,
  inject,
  signal,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestService } from '../../../core/services/guest.service';

/**
 * Pending Verification Component
 *
 * Várakozó képernyő pending státuszú session-ökhöz.
 * Automatikusan pollingol a státusz változásig.
 */
@Component({
  selector: 'app-pending-verification',
  standalone: true,
  imports: [],
  templateUrl: './pending-verification.component.html',
  styleUrls: ['./pending-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PendingVerificationComponent implements OnInit, OnDestroy {
  /** Signal-based inputs */
  readonly guestName = input<string>('');
  readonly missingPersonName = input<string | null>(null);

  /** Signal-based outputs */
  readonly refreshEvent = output<void>();
  readonly cancelEvent = output<void>();

  private readonly guestService = inject(GuestService);
  private readonly destroyRef = inject(DestroyRef);

  /** Frissítés folyamatban */
  readonly isRefreshing = signal(false);

  ngOnInit(): void {
    // Indítsuk el a verification pollingot
    this.guestService.startVerificationPolling();
  }

  ngOnDestroy(): void {
    // Állítsuk le a pollingot
    this.guestService.stopVerificationPolling();
  }

  /**
   * Manuális frissítés
   */
  onRefresh(): void {
    if (this.isRefreshing()) return;

    this.isRefreshing.set(true);
    this.refreshEvent.emit();

    // Ellenőrizzük a státuszt
    this.guestService.checkVerificationStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isRefreshing.set(false);
        },
        error: () => {
          this.isRefreshing.set(false);
        }
      });
  }

  /**
   * Mégsem / kijelentkezés
   */
  onCancel(): void {
    this.cancelEvent.emit();
  }
}
