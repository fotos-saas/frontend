import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, SchoolListItem, SchoolItem } from '../../services/partner.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * School Edit Modal - Iskola szerkesztése.
 */
@Component({
  selector: 'app-school-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel dialog-panel--md" (click)="$event.stopPropagation()">
        <div class="modal-content">
        <header class="modal-header">
          <h2>{{ mode === 'create' ? 'Új iskola' : 'Iskola szerkesztése' }}</h2>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </header>

        <form (ngSubmit)="save()" class="modal-form">
          <div class="form-group">
            <label for="name">Iskola neve *</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="name"
              name="name"
              required
              class="form-input"
              placeholder="Pl. Bolyai János Gimnázium"
            />
          </div>

          <div class="form-group">
            <label for="city">Város</label>
            <input
              type="text"
              id="city"
              [(ngModel)]="city"
              name="city"
              class="form-input"
              placeholder="Pl. Budapest"
            />
          </div>

          @if (errorMessage()) {
            <div class="error-message">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
              {{ errorMessage() }}
            </div>
          }

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()">
              Mégse
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="saving() || !name.trim()"
            >
              @if (saving()) {
                <span class="spinner"></span>
                Mentés...
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="16" />
                {{ mode === 'create' ? 'Létrehozás' : 'Mentés' }}
              }
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 1.5rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }

    .form-input {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #152a45);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchoolEditModalComponent {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() school: SchoolListItem | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<SchoolItem>();

  readonly ICONS = ICONS;

  name = '';
  city = '';
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    if (this.school && this.mode === 'edit') {
      this.name = this.school.name;
      this.city = this.school.city ?? '';
    }
  }

  save(): void {
    if (!this.name.trim() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name.trim(),
      city: this.city.trim() || null
    };

    const request$ = this.mode === 'create'
      ? this.partnerService.createSchool(payload)
      : this.partnerService.updateSchool(this.school!.id, payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saved.emit(response.data);
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
