import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../../shared/utils/dialog.util';
import { PartnerOrderAlbumDetails } from '../../../../../services/partner-orders.service';

export interface AlbumEditFormData {
  name: string;
  minSelections: number | null;
  maxSelections: number | null;
  maxRetouchPhotos: number | null;
}

/**
 * Album Edit Modal Component
 *
 * Szerkesztés modal az album nevéhez és beállításaihoz.
 */
@Component({
  selector: 'app-album-edit-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
      <div
        class="dialog-backdrop"
        (mousedown)="backdropHandler.onMouseDown($event)"
        (click)="backdropHandler.onClick($event)"
      >
        <div class="dialog-panel dialog-panel--md" (mousedown)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2 class="dialog-title">Album szerkesztése</h2>
            <button type="button" class="dialog-close" (click)="close.emit()">
              <lucide-icon [name]="ICONS.X" [size]="20" />
            </button>
          </div>

          <form (ngSubmit)="onSubmit()" class="dialog-body">
            <!-- Név -->
            <div class="form-group">
              <label class="form-label">Album neve *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                class="form-input"
                required
              />
            </div>

            <!-- Típustól függő mezők -->
            @if (album().type === 'selection') {
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Min. kiválasztás</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.minSelections"
                    name="minSelections"
                    class="form-input"
                    min="0"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Max. kiválasztás</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.maxSelections"
                    name="maxSelections"
                    class="form-input"
                    min="0"
                  />
                </div>
              </div>
            }

            @if (album().type === 'tablo') {
              <div class="form-group">
                <label class="form-label">Max. retusálás</label>
                <input
                  type="number"
                  [(ngModel)]="formData.maxRetouchPhotos"
                  name="maxRetouchPhotos"
                  class="form-input"
                  min="0"
                />
              </div>
            }

            <div class="dialog-actions">
              <button type="button" class="btn-secondary" (click)="close.emit()">
                Mégse
              </button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <div class="spinner spinner--dark"></div>
                }
                Mentés
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    :host-context(.dark) .dialog-header {
      border-color: #374151;
    }

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      color: var(--color-text-primary, #1e293b);
    }

    :host-context(.dark) .dialog-title {
      color: #f8fafc;
    }

    .dialog-close {
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

    .dialog-close:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    :host-context(.dark) .dialog-close:hover {
      background: #374151;
      color: #f8fafc;
    }

    .dialog-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    :host-context(.dark) .form-label {
      color: #d1d5db;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      font-size: 0.9375rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #1e293b;
      transition: all 0.15s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    :host-context(.dark) .form-input {
      background: #1f2937;
      border-color: #4b5563;
      color: #f8fafc;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
    }

    :host-context(.dark) .dialog-actions {
      border-color: #374151;
    }

    .btn-secondary {
      padding: 10px 20px;
      font-size: 0.875rem;
      font-weight: 500;
      background: transparent;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    :host-context(.dark) .btn-secondary {
      border-color: #4b5563;
      color: #d1d5db;
    }

    :host-context(.dark) .btn-secondary:hover {
      background: #374151;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 0.875rem;
      font-weight: 500;
      background: var(--color-primary, #3b82f6);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #2563eb);
    }

    .btn-primary:disabled {
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

    .spinner--dark {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AlbumEditModalComponent {
  readonly ICONS = ICONS;

  // Inputs (Signal-based)
  readonly album = input.required<PartnerOrderAlbumDetails>();
  readonly isOpen = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly initialFormData = input<AlbumEditFormData>({
    name: '',
    minSelections: null,
    maxSelections: null,
    maxRetouchPhotos: null,
  });

  // Outputs
  readonly close = output<void>();
  readonly save = output<AlbumEditFormData>();

  // Form data (mutable)
  formData: AlbumEditFormData = {
    name: '',
    minSelections: null,
    maxSelections: null,
    maxRetouchPhotos: null,
  };

  // Backdrop handler
  backdropHandler = createBackdropHandler(() => this.close.emit());

  constructor() {
    // Update form data when input changes
    // Note: In a real app, we'd use effect() for this
  }

  ngOnChanges(): void {
    const initial = this.initialFormData();
    this.formData = { ...initial };
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      return;
    }
    this.save.emit({
      ...this.formData,
      name: this.formData.name.trim(),
    });
  }
}
