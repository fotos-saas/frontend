import {
  Component,
  output,
  input,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PasswordStrengthComponent } from '../../../../shared/components/password-strength/password-strength.component';
import { ClientService } from '../../services/client.service';
import { ToastService } from '../../../../core/services/toast.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Dialog eredmény típus
 */
export type ClientRegisterResult =
  | { action: 'success'; token: string }
  | { action: 'cancel' };

/**
 * Client Register Dialog Component
 *
 * Kliens regisztráció dialog email és jelszó beállításához.
 * Csak akkor jelenik meg, ha a partner engedélyezte a regisztrációt
 * az album(ok) beállításaiban.
 *
 * FONTOS: Ha a kliens regisztrál, a kód alapú belépés MEGSZŰNIK,
 * és csak email/jelszóval léphet be.
 */
@Component({
  selector: 'app-client-register-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PasswordStrengthComponent],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
      (keydown.escape)="onCancel()"
    >
      <div
        class="dialog-panel dialog-panel--md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-dialog-title"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="dialog-header">
          <h2 id="register-dialog-title" class="dialog-title">
            <lucide-icon [name]="ICONS.USER_PLUS" [size]="20" class="dialog-icon"></lucide-icon>
            Regisztráció
          </h2>
          <button
            type="button"
            class="dialog-close"
            (click)="onCancel()"
            aria-label="Bezárás"
          >
            <lucide-icon [name]="ICONS.X" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <form (ngSubmit)="onSubmit()" class="dialog-content">
          <!-- Info box -->
          <div class="info-box">
            <lucide-icon [name]="ICONS.INFO" [size]="18" class="info-box__icon"></lucide-icon>
            <div class="info-box__content">
              <p class="info-box__title">Mire jó a regisztráció?</p>
              <ul class="info-box__list">
                @if (hasDownloadableAlbum()) {
                  <li>Letöltheted a kiválasztott képeidet</li>
                }
                <li>Email értesítéseket kapsz az albumokról</li>
                <li>Visszanézheted korábbi albumjaidat</li>
              </ul>
              <p class="info-box__warning">
                <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="14"></lucide-icon>
                A regisztráció után a belépési kód megszűnik, és csak email/jelszóval léphetsz be.
              </p>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">Email cím</label>
            <input
              #emailInput
              type="email"
              id="email"
              name="email"
              class="form-input"
              [(ngModel)]="email"
              [class.form-input--error]="errors['email']"
              (input)="onInputChange()"
              placeholder="pelda@email.hu"
              autocomplete="email"
              required
            />
            @if (errors['email']) {
              <p class="form-error">{{ errors['email'] }}</p>
            }
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password" class="form-label">Jelszó</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                name="password"
                class="form-input"
                [(ngModel)]="password"
                [class.form-input--error]="errors['password']"
                (input)="onInputChange()"
                placeholder="Legalább 8 karakter"
                autocomplete="new-password"
                required
              />
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword() ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'"
              >
                <lucide-icon [name]="showPassword() ? ICONS.EYE_OFF : ICONS.EYE" [size]="18"></lucide-icon>
              </button>
            </div>
            @if (errors['password']) {
              <p class="form-error">{{ errors['password'] }}</p>
            }

            <!-- Password strength -->
            <app-password-strength [password]="password" [compact]="true" />
          </div>

          <!-- Password confirmation -->
          <div class="form-group">
            <label for="passwordConfirmation" class="form-label">Jelszó megerősítése</label>
            <div class="password-input-wrapper">
              <input
                [type]="showPasswordConfirmation() ? 'text' : 'password'"
                id="passwordConfirmation"
                name="passwordConfirmation"
                class="form-input"
                [(ngModel)]="passwordConfirmation"
                [class.form-input--error]="errors['passwordConfirmation']"
                (input)="onInputChange()"
                placeholder="Írd be újra a jelszót"
                autocomplete="new-password"
                required
              />
              <button
                type="button"
                class="password-toggle"
                (click)="toggleConfirmationVisibility()"
                [attr.aria-label]="showPasswordConfirmation() ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'"
              >
                <lucide-icon [name]="showPasswordConfirmation() ? ICONS.EYE_OFF : ICONS.EYE" [size]="18"></lucide-icon>
              </button>
            </div>
            @if (errors['passwordConfirmation']) {
              <p class="form-error">{{ errors['passwordConfirmation'] }}</p>
            }
          </div>

          <!-- API error -->
          @if (apiError()) {
            <div class="api-error">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16"></lucide-icon>
              {{ apiError() }}
            </div>
          }

          <!-- Footer -->
          <div class="dialog-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()"
              [disabled]="isSubmitting()"
            >
              Mégse
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!isFormValid() || isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="spinner"></span>
                Regisztráció...
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="16"></lucide-icon>
                Regisztráció
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Dialog header */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
    }

    .dialog-icon {
      color: var(--primary-color, #3b82f6);
    }

    .dialog-close {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #6b7280);
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }

    .dialog-close:hover {
      background: var(--surface-100, #f3f4f6);
      color: var(--text-primary, #1f2937);
    }

    /* Content */
    .dialog-content {
      padding: 20px;
      overflow: visible;
    }

    /* Override global dialog-panel overflow for this component */
    :host ::ng-deep .dialog-panel {
      overflow: visible;
    }

    /* Info box */
    .info-box {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    :host-context(.dark) .info-box {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .info-box__icon {
      flex-shrink: 0;
      color: #3b82f6;
      margin-top: 2px;
    }

    .info-box__content {
      flex: 1;
    }

    .info-box__title {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e40af;
    }

    :host-context(.dark) .info-box__title {
      color: #93c5fd;
    }

    .info-box__list {
      margin: 0 0 10px 0;
      padding-left: 18px;
      font-size: 0.8125rem;
      color: #1e40af;
      line-height: 1.5;
    }

    :host-context(.dark) .info-box__list {
      color: #bfdbfe;
    }

    .info-box__list li {
      margin-bottom: 2px;
    }

    .info-box__warning {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin: 0;
      padding-top: 10px;
      border-top: 1px solid rgba(59, 130, 246, 0.2);
      font-size: 0.75rem;
      color: #b45309;
    }

    :host-context(.dark) .info-box__warning {
      color: #fbbf24;
      border-color: rgba(59, 130, 246, 0.2);
    }

    .info-box__warning lucide-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Form */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary, #1f2937);
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 8px;
      font-size: 0.9375rem;
      background: var(--surface-50, #ffffff);
      color: var(--text-primary, #1f2937);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .form-input--error {
      border-color: #ef4444;
    }

    .form-input--error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    .form-error {
      margin: 6px 0 0 0;
      font-size: 0.8125rem;
      color: #ef4444;
    }

    /* Password input */
    .password-input-wrapper {
      position: relative;
    }

    .password-input-wrapper .form-input {
      padding-right: 42px;
    }

    .password-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #6b7280);
      cursor: pointer;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .password-toggle:hover {
      color: var(--text-primary, #1f2937);
    }

    /* API error */
    .api-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.875rem;
      color: #b91c1c;
    }

    :host-context(.dark) .api-error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-color, #3b82f6);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover, #2563eb);
    }

    .btn-secondary {
      background: var(--surface-100, #f3f4f6);
      color: var(--text-secondary, #4b5563);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--surface-200, #e5e7eb);
    }

    /* Spinner */
    .spinner {
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

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }

      .dialog-close,
      .password-toggle,
      .form-input,
      .btn {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRegisterDialogComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  /** Pre-filled email from client info */
  readonly initialEmail = input<string>('');

  /** Has any album with download enabled */
  readonly hasDownloadableAlbum = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<ClientRegisterResult>();

  /** Form data */
  email = '';
  password = '';
  passwordConfirmation = '';

  /** Password visibility */
  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);

  /** State */
  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);

  /** Form version trigger - forces computed re-evaluation */
  private readonly formVersion = signal(0);

  /** Validation errors */
  errors: Record<string, string> = {};

  /** ViewChild references */
  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild(PasswordStrengthComponent) passwordStrength?: PasswordStrengthComponent;

  /** Backdrop handler - prevents close when selecting text */
  backdropHandler = createBackdropHandler(() => this.onCancel());

  /** Computed: form valid - uses formVersion to track changes */
  isFormValid = computed(() => {
    // This dependency forces re-evaluation when form inputs change
    this.formVersion();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    const passwordValid = this.password.length >= 8;
    const confirmValid = this.password === this.passwordConfirmation && this.passwordConfirmation.length > 0;
    const strengthOk = this.passwordStrength?.isValid() ?? false;

    return emailValid && passwordValid && confirmValid && strengthOk;
  });

  ngOnInit(): void {
    // Pre-fill email if provided
    const initial = this.initialEmail();
    if (initial) {
      this.email = initial;
    }
  }

  onInputChange(): void {
    this.errors = {};
    this.apiError.set(null);
    // Increment formVersion to trigger computed re-evaluation
    this.formVersion.update(v => v + 1);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmationVisibility(): void {
    this.showPasswordConfirmation.update(v => !v);
  }

  private validate(): boolean {
    this.errors = {};

    if (!this.email) {
      this.errors['email'] = 'Add meg az email címed!';
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors['email'] = 'Érvénytelen email cím.';
      return false;
    }

    if (!this.password) {
      this.errors['password'] = 'Add meg a jelszót!';
      return false;
    }

    if (this.password.length < 8) {
      this.errors['password'] = 'A jelszó minimum 8 karakter legyen.';
      return false;
    }

    if (this.passwordStrength && !this.passwordStrength.isValid()) {
      this.errors['password'] = 'A jelszó nem elég erős. Teljesítsd az összes követelményt!';
      return false;
    }

    if (!this.passwordConfirmation) {
      this.errors['passwordConfirmation'] = 'Erősítsd meg a jelszót!';
      return false;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errors['passwordConfirmation'] = 'A két jelszó nem egyezik.';
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.validate()) {
      return;
    }

    this.isSubmitting.set(true);
    this.apiError.set(null);

    this.clientService.register(this.email, this.password, this.passwordConfirmation).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.toastService.success('Sikeres regisztráció!', 'Mostantól email és jelszóval léphetsz be.');
        this.resultEvent.emit({ action: 'success', token: response.token });
      },
      error: (error: Error) => {
        this.isSubmitting.set(false);
        this.apiError.set(error.message);
      }
    });
  }

  onCancel(): void {
    if (this.isSubmitting()) return;
    this.resultEvent.emit({ action: 'cancel' });
  }
}
