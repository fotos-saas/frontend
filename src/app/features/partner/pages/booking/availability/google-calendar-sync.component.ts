import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { GoogleCalendarStatus } from '../../../models/booking.models';

@Component({
  selector: 'app-google-calendar-sync',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="google-calendar-section">
      <h3>
        <lucide-icon [name]="ICONS.CALENDAR" [size]="20" />
        Google Naptar szinkron
      </h3>

      @if (loading()) {
        <div class="skeleton-block"></div>
      } @else if (status()?.connected) {
        <div class="connected-info">
          <div class="status-badge connected">
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" /> Csatlakozva
          </div>
          <p class="google-email">{{ status()!.google_email }}</p>
          @if (status()!.last_synced_at) {
            <p class="last-sync">Utolso szinkron: {{ status()!.last_synced_at }}</p>
          }

          @if (syncResult()) {
            <div class="sync-result">
              <lucide-icon [name]="ICONS.CHECK" [size]="14" />
              {{ syncResult() }} esemeny szinkronizalva
            </div>
          }

          <div class="sync-actions">
            <button class="btn btn--outline btn--sm" (click)="sync()" [disabled]="syncing()">
              <lucide-icon [name]="ICONS.REFRESH" [size]="14" />
              @if (syncing()) { Szinkronizalas... } @else { Szinkronizalas }
            </button>
            <button class="btn btn--outline btn--sm btn--danger" (click)="confirmDisconnect()">
              Levalasztas
            </button>
          </div>

          @if (showDisconnectConfirm()) {
            <div class="disconnect-confirm">
              <p>Biztosan levalasztod a Google Naptarat?</p>
              <div class="confirm-actions">
                <button class="btn btn--danger btn--sm" (click)="disconnect()" [disabled]="disconnecting()">
                  Igen, levalasztas
                </button>
                <button class="btn btn--outline btn--sm" (click)="showDisconnectConfirm.set(false)">
                  Megse
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="disconnected-info">
          <p>Csatlakoztasd a Google Naptarad, hogy automatikusan szinkronizaljuk a foglalasokat.</p>
          <button class="btn btn--primary" (click)="connect()">
            <lucide-icon [name]="ICONS.LINK" [size]="16" /> Google Naptar csatlakoztatasa
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .google-calendar-section { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; }
    h3 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 600; margin: 0 0 16px; }
    .skeleton-block { height: 80px; border-radius: 8px; background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .connected-info { display: flex; flex-direction: column; gap: 8px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 500; padding: 4px 10px; border-radius: 20px; width: fit-content; }
    .status-badge.connected { background: #ecfdf5; color: #059669; }
    .google-email { font-size: 0.9rem; color: #374151; margin: 0; }
    .last-sync { font-size: 0.8rem; color: #9ca3af; margin: 0; }
    .sync-result { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #ecfdf5; color: #059669; border-radius: 8px; font-size: 0.85rem; }
    .sync-actions { display: flex; gap: 8px; margin-top: 4px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
    .btn--sm { padding: 6px 12px; font-size: 0.8rem; }
    .btn--primary { background: #7c3aed; color: #fff; }
    .btn--outline { background: transparent; border: 1px solid #d1d5db; color: #374151; }
    .btn--danger { border-color: #fecaca; color: #dc2626; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .disconnect-confirm { margin-top: 8px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }
    .disconnect-confirm p { margin: 0 0 8px; font-size: 0.85rem; color: #991b1b; }
    .confirm-actions { display: flex; gap: 8px; }
    .btn--danger:not(.btn--outline) { background: #dc2626; color: #fff; border: none; }
    .disconnected-info { display: flex; flex-direction: column; gap: 12px; }
    .disconnected-info p { margin: 0; font-size: 0.9rem; color: #6b7280; }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `],
})
export class GoogleCalendarSyncComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly bookingService = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  status = signal<GoogleCalendarStatus | null>(null);
  syncing = signal(false);
  disconnecting = signal(false);
  showDisconnectConfirm = signal(false);
  syncResult = signal<number | null>(null);

  ngOnInit(): void {
    this.loadStatus();
  }

  connect(): void {
    this.bookingService.connectGoogleCalendar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          window.open(res.data.auth_url, '_blank', 'width=600,height=700');
        },
      });
  }

  sync(): void {
    this.syncing.set(true);
    this.syncResult.set(null);
    this.bookingService.syncGoogleCalendar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncing.set(false);
          this.syncResult.set(res.data.synced_events);
          this.loadStatus();
        },
        error: () => this.syncing.set(false),
      });
  }

  confirmDisconnect(): void {
    this.showDisconnectConfirm.set(true);
  }

  disconnect(): void {
    this.disconnecting.set(true);
    this.bookingService.disconnectGoogleCalendar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.disconnecting.set(false);
          this.showDisconnectConfirm.set(false);
          this.status.set({ connected: false });
        },
        error: () => this.disconnecting.set(false),
      });
  }

  private loadStatus(): void {
    this.loading.set(true);
    this.bookingService.getGoogleCalendarStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.status.set(res.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }
}
