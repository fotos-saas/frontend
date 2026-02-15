import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { ProjectContact } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Add Contact Modal - Új kapcsolattartó hozzáadása.
 */
@Component({
  selector: 'app-add-contact-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <lucide-icon [name]="ICONS.USER_PLUS" [size]="24" />
          </div>
          <h2>Új kapcsolattartó</h2>
        </div>

        <!-- Content -->
        <form class="modal-content" (ngSubmit)="onSubmit()">
          <!-- Név -->
          <ps-input
            label="Név"
            placeholder="pl. Kovács János"
            [(ngModel)]="formData.name"
            name="name"
            [required]="true"
          />

          <!-- Email -->
          <ps-input
            type="email"
            label="Email"
            placeholder="pl. kovacs.janos@iskola.hu"
            [(ngModel)]="formData.email"
            name="email"
          />

          <!-- Telefon -->
          <ps-input
            type="tel"
            label="Telefon"
            placeholder="pl. +36 30 123 4567"
            [(ngModel)]="formData.phone"
            name="phone"
          />

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
            >
              Mégse
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="!formData.name"
            >
              <lucide-icon [name]="ICONS.CHECK" [size]="18" />
              Hozzáadás
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
      background: #8b5cf6;
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
      background: #8b5cf6;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: #7c3aed;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddContactModalComponent {
  readonly ICONS = ICONS;

  /** Backdrop kezelő - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly close = output<void>();
  readonly contactCreated = output<ProjectContact>();

  error = signal<string | null>(null);

  formData: ProjectContact = {
    name: '',
    email: null,
    phone: null,
  };

  onSubmit(): void {
    if (!this.formData.name) {
      this.error.set('A név megadása kötelező');
      return;
    }

    this.error.set(null);
    this.contactCreated.emit({ ...this.formData });
  }

}
