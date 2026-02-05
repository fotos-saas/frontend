import { Component, EventEmitter, Output, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { TeamService, TeamRole } from '../../../services/team.service';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../shared/utils/dialog.util';

/**
 * Invite Dialog - Új csapattag meghívása
 */
@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel dialog-panel--md" (mousedown)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dialog-header">
          <h2>Új csapattag meghívása</h2>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- Email -->
          <div class="form-group">
            <label for="email">Email cím</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              placeholder="munkatars@example.com"
              [class.error]="emailError()"
            />
            @if (emailError()) {
              <span class="error-text">{{ emailError() }}</span>
            }
          </div>

          <!-- Szerepkör -->
          <div class="form-group">
            <label>Szerepkör</label>
            <div class="role-options">
              @for (role of teamService.roles; track role.value) {
                <label class="role-option" [class.selected]="selectedRole() === role.value">
                  <input
                    type="radio"
                    name="role"
                    [value]="role.value"
                    [checked]="selectedRole() === role.value"
                    (change)="selectedRole.set(role.value)"
                  />
                  <div class="role-content">
                    <span class="role-label">{{ role.label }}</span>
                    <span class="role-description">{{ role.description }}</span>
                  </div>
                  <lucide-icon
                    [name]="ICONS.CHECK_CIRCLE"
                    [size]="20"
                    class="check-icon"
                    [class.visible]="selectedRole() === role.value"
                  />
                </label>
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="close.emit()">
            Mégse
          </button>
          <button
            class="btn btn-primary"
            [disabled]="saving() || !isValid()"
            (click)="onSave()"
          >
            @if (saving()) {
              <lucide-icon [name]="ICONS.LOADER" [size]="18" class="spin" />
            } @else {
              <lucide-icon [name]="ICONS.MAIL" [size]="18" />
            }
            <span>Meghívó küldése</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }

    .dialog-panel {
      background: var(--bg-primary);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);

      h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .dialog-content {
      padding: 24px;
      overflow-y: auto;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
    }

    .form-group {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--text-primary);
      }

      input[type="email"] {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 14px;
        background: var(--bg-primary);
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        &.error {
          border-color: #dc2626;
        }
      }

      .error-text {
        display: block;
        font-size: 12px;
        color: #dc2626;
        margin-top: 4px;
      }
    }

    .role-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;

      input[type="radio"] {
        display: none;
      }

      &:hover {
        border-color: var(--color-primary);
        background: var(--bg-secondary);
      }

      &.selected {
        border-color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.05);
      }

      .role-content {
        flex: 1;
      }

      .role-label {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
      }

      .role-description {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }

      .check-icon {
        color: var(--color-primary);
        opacity: 0;
        transition: opacity 0.15s ease;

        &.visible {
          opacity: 1;
        }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &-primary {
        background: var(--color-primary);
        color: white;

        &:hover:not(:disabled) {
          background: var(--color-primary-dark, #2563eb);
        }
      }

      &-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InviteDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  email = '';
  selectedRole = signal<TeamRole>('designer');
  saving = signal(false);
  emailError = signal<string | null>(null);

  isValid(): boolean {
    return this.email.trim().length > 0 && this.isValidEmail(this.email);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSave(): void {
    // Validáció
    this.emailError.set(null);

    if (!this.email.trim()) {
      this.emailError.set('Az email cím megadása kötelező.');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.emailError.set('Érvénytelen email cím.');
      return;
    }

    this.saving.set(true);

    this.teamService.createInvitation({
      email: this.email.trim(),
      role: this.selectedRole()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          if (err.error?.message) {
            this.emailError.set(err.error.message);
          } else {
            this.emailError.set('Hiba történt a meghívó küldése során.');
          }
        }
      });
  }
}
