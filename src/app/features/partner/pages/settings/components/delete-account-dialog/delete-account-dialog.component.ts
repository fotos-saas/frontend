import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../shared/utils/dialog.util';

/**
 * Delete Account Dialog Component
 *
 * GDPR-kompatibilis fiók törlés dialógus.
 * Megerősítést kér a felhasználótól ("TÖRLÉS" beírása).
 */
@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel dialog-panel--md" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <header class="dialog-header">
          <div class="header-icon">
            <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="24" />
          </div>
          <h2 id="delete-dialog-title">Fiók törlése</h2>
          <button class="close-btn" (click)="close.emit()" aria-label="Bezárás">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </header>

        <div class="dialog-body">
          <p class="warning-text">
            Ez a művelet <strong>visszavonhatatlan</strong>! A következők törlődnek:
          </p>

          <ul class="deletion-list">
            <li>
              <lucide-icon [name]="ICONS.FOLDER" [size]="16" />
              Minden projektadat és fotó
            </li>
            <li>
              <lucide-icon [name]="ICONS.SCHOOL" [size]="16" />
              Iskolák és kapcsolattartók
            </li>
            <li>
              <lucide-icon [name]="ICONS.FILE_TEXT" [size]="16" />
              Számlázási előzmények
            </li>
            <li>
              <lucide-icon [name]="ICONS.USER" [size]="16" />
              Felhasználói fiók
            </li>
          </ul>

          <div class="retention-notice">
            <lucide-icon [name]="ICONS.CLOCK" [size]="18" />
            <p>A törlés <strong>30 napon belül</strong> véglegesül. Addig visszavonható.</p>
          </div>

          <div class="confirm-input">
            <label for="confirm-text">
              A megerősítéshez írd be: <strong>TÖRLÉS</strong>
            </label>
            <input
              id="confirm-text"
              type="text"
              [(ngModel)]="confirmText"
              placeholder="TÖRLÉS"
              autocomplete="off"
              [attr.aria-invalid]="confirmText().length > 0 && confirmText() !== 'TÖRLÉS'"
            />
          </div>
        </div>

        <footer class="dialog-footer">
          <button class="btn btn--secondary" (click)="close.emit()" [disabled]="isSubmitting()">
            Mégse
          </button>
          <button
            class="btn btn--danger"
            [disabled]="confirmText() !== 'TÖRLÉS' || isSubmitting()"
            (click)="confirm.emit()"
          >
            @if (isSubmitting()) {
              <span class="btn-spinner"></span>
              Törlés...
            } @else {
              <lucide-icon [name]="ICONS.DELETE" [size]="18" />
              Fiók törlése véglegesen
            }
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    /* ============ Backdrop ============ */
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ============ Panel ============ */
    .dialog-panel {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ============ Header ============ */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-danger-light, #fee2e2);
      color: var(--color-danger, #dc2626);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dialog-header h2 {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: var(--bg-hover, #f1f5f9);
      color: var(--text-primary, #1e293b);
    }

    /* ============ Body ============ */
    .dialog-body {
      padding: 24px;
    }

    .warning-text {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .deletion-list {
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .deletion-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }

    .deletion-list lucide-icon {
      color: var(--color-danger, #dc2626);
      flex-shrink: 0;
    }

    .retention-notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--color-info-light, #dbeafe);
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .retention-notice lucide-icon {
      color: var(--color-info, #3b82f6);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .retention-notice p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-info-dark, #1e40af);
      line-height: 1.4;
    }

    .confirm-input {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .confirm-input label {
      font-size: 0.875rem;
      color: var(--text-primary, #1e293b);
    }

    .confirm-input input {
      padding: 12px 14px;
      border: 2px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      font-size: 1rem;
      font-family: monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-align: center;
      transition: border-color 0.2s ease;
    }

    .confirm-input input:focus {
      outline: none;
      border-color: var(--color-danger, #dc2626);
    }

    .confirm-input input[aria-invalid="true"] {
      border-color: var(--color-warning, #f59e0b);
    }

    /* ============ Footer ============ */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-secondary, #f8fafc);
      border-radius: 0 0 16px 16px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--secondary {
      background: white;
      color: var(--text-primary, #1e293b);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--bg-hover, #f1f5f9);
    }

    .btn--danger {
      background: var(--color-danger, #dc2626);
      color: white;
    }

    .btn--danger:hover:not(:disabled) {
      background: var(--color-danger-dark, #b91c1c);
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============ Reduced Motion ============ */
    @media (prefers-reduced-motion: reduce) {
      .dialog-backdrop,
      .dialog-panel,
      .btn,
      .close-btn,
      .confirm-input input,
      .btn-spinner {
        animation: none;
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteAccountDialogComponent {
  isSubmitting = input<boolean>(false);
  close = output<void>();
  confirm = output<void>();

  protected readonly ICONS = ICONS;

  confirmText = signal('');

  backdropHandler = createBackdropHandler(() => {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  });
}
