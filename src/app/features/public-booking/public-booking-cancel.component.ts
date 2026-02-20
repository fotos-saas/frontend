import {
  Component, signal, inject, OnInit, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PublicBookingService } from './services/public-booking.service';

@Component({
  selector: 'app-public-booking-cancel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="cancel-page">
      <div class="cancel-card">
        @if (!done()) {
          <div class="card-header">
            <lucide-icon [name]="ICONS.X_CIRCLE" [size]="28" class="icon-red" />
            <h1>Foglalas lemondasa</h1>
          </div>

          <p class="info-text">Biztosan le szeretne mondani a foglalast? A lemondas vegleges.</p>

          <div class="reason-group">
            <label for="reason">Lemondas oka (nem kotelezo)</label>
            <textarea id="reason" [(ngModel)]="reason" rows="3"
                      class="form-input" placeholder="Kerem, irja le miert mondja le..."></textarea>
          </div>

          @if (error()) {
            <div class="error-box">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="18" />
              <span>{{ error() }}</span>
            </div>
          }

          <div class="action-row">
            <button class="cancel-btn" (click)="confirmCancel()" [disabled]="submitting()">
              @if (submitting()) {
                <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
              } @else {
                <lucide-icon [name]="ICONS.X_CIRCLE" [size]="18" />
              }
              Foglalas lemondasa
            </button>
          </div>
        } @else {
          <div class="done-state">
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="48" class="icon-green" />
            <h2>Foglalas lemondva</h2>
            <p>A foglalast sikeresen lemondta. Emailben megerositest kuldtunk.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: linear-gradient(135deg, #fff5f5 0%, #faf5ff 100%); }
    .cancel-page { max-width: 480px; margin: 0 auto; padding: 48px 16px; }
    .cancel-card {
      background: #fff; border-radius: 16px; padding: 32px 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .card-header { display: flex; align-items: center; margin-bottom: 16px; }
    .card-header lucide-icon { margin-right: 12px; }
    .icon-red { color: #dc2626; }
    .card-header h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
    .info-text { color: #64748b; font-size: 15px; margin: 0 0 20px; line-height: 1.5; }
    .reason-group { margin-bottom: 16px; }
    .reason-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .form-input {
      width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical;
    }
    .form-input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .error-box {
      display: flex; align-items: center; padding: 12px; border-radius: 8px;
      background: #fef2f2; color: #dc2626; font-size: 14px; margin-bottom: 16px;
    }
    .error-box lucide-icon { margin-right: 8px; flex-shrink: 0; }
    .action-row { display: flex; justify-content: flex-end; }
    .cancel-btn {
      display: flex; align-items: center; padding: 12px 20px; border: none;
      border-radius: 10px; background: #dc2626; color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .cancel-btn lucide-icon { margin-right: 8px; }
    .cancel-btn:hover:not(:disabled) { background: #b91c1c; }
    .cancel-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .done-state { text-align: center; padding: 16px 0; }
    .icon-green { color: #16a34a; margin-bottom: 16px; }
    .done-state h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .done-state p { color: #64748b; font-size: 15px; margin: 0; }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class PublicBookingCancelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PublicBookingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  reason = '';
  readonly submitting = signal(false);
  readonly done = signal(false);
  readonly error = signal('');

  private slug = '';
  private bookingUuid = '';

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.bookingUuid = this.route.snapshot.paramMap.get('bookingUuid') ?? '';
  }

  confirmCancel(): void {
    this.submitting.set(true);
    this.error.set('');
    this.service.cancel(this.slug, this.bookingUuid, { reason: this.reason || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.done.set(true); this.submitting.set(false); },
        error: () => { this.error.set('Nem sikerult lemondani a foglalast. Kerem, problja ujra.'); this.submitting.set(false); },
      });
  }
}
