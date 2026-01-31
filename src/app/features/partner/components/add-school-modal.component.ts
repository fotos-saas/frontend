import { Component, Output, EventEmitter, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, SchoolItem, CreateSchoolRequest } from '../services/partner.service';
import { ICONS } from '../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';

/**
 * Add School Modal - Új iskola hozzáadása.
 */
@Component({
  selector: 'app-add-school-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <lucide-icon [name]="ICONS.BUILDING_2" [size]="24" />
          </div>
          <h2>Új iskola hozzáadása</h2>
        </div>

        <!-- Content -->
        <form class="modal-content" (ngSubmit)="onSubmit()">
          <!-- Iskola neve -->
          <div class="form-group">
            <label class="form-label">
              Iskola neve
              <span class="required">*</span>
            </label>
            <input
              type="text"
              placeholder="pl. Petőfi Sándor Gimnázium"
              [(ngModel)]="formData.name"
              name="name"
              class="form-input"
              required
            />
          </div>

          <!-- Város -->
          <div class="form-group">
            <label class="form-label">Város</label>
            <input
              type="text"
              placeholder="pl. Budapest"
              [(ngModel)]="formData.city"
              name="city"
              class="form-input"
            />
          </div>

          @if (error()) {
            <div class="error-message">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
              {{ error() }}
            </div>
          }

          <!-- Actions -->
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="close.emit()"
              [disabled]="submitting()"
            >
              Mégse
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="submitting() || !formData.name"
            >
              @if (submitting()) {
                <span class="spinner"></span>
                Mentés...
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="18" />
                Iskola hozzáadása
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Modal Header */
    .modal-header {
      text-align: center;
      padding: 24px 24px 0;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #10b981;
      border-radius: 16px;
      color: #ffffff;
      margin: 0 auto 16px;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Modal Content */
    .modal-content {
      padding: 24px;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .required {
      color: #dc2626;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: all 0.15s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary {
      padding: 10px 16px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #10b981;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: #059669;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSchoolModalComponent {
  readonly ICONS = ICONS;

  /** Backdrop kezelő - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  @Output() close = new EventEmitter<void>();
  @Output() schoolCreated = new EventEmitter<SchoolItem>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  submitting = signal(false);
  error = signal<string | null>(null);

  formData: CreateSchoolRequest = {
    name: '',
    city: null,
  };

  onSubmit(): void {
    if (!this.formData.name) {
      this.error.set('Az iskola neve kötelező');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    this.partnerService.createSchool(this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.schoolCreated.emit(response.data);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message ?? 'Hiba történt az iskola létrehozása során');
        }
      });
  }

}
