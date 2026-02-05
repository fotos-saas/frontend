import {
  Component,
  output,
  input,
  ChangeDetectionStrategy,
  OnInit,
  viewChild,
  ElementRef,
  inject,
  signal,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PasswordStrengthComponent } from '../../../../shared/components/password-strength/password-strength.component';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { ClientRegisterFormService } from './client-register-form.service';

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
  templateUrl: './client-register-dialog.component.html',
  styleUrl: './client-register-dialog.component.scss',
  providers: [ClientRegisterFormService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRegisterDialogComponent implements OnInit {
  private readonly formService = inject(ClientRegisterFormService);
  protected readonly ICONS = ICONS;

  /** Pre-filled email from client info */
  readonly initialEmail = input<string>('');

  /** Has any album with download enabled */
  readonly hasDownloadableAlbum = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<ClientRegisterResult>();

  /** Password visibility */
  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);

  /** ViewChild references */
  readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  readonly passwordStrength = viewChild(PasswordStrengthComponent);

  /** Backdrop handler - prevents close when selecting text */
  backdropHandler = createBackdropHandler(() => this.onCancel());

  /** Delegált state a service-ből */
  readonly isSubmitting = this.formService.isSubmitting;
  readonly apiError = this.formService.apiError;
  readonly isFormValid = this.formService.isFormValid;

  /** Errors getter - template kompatibilitás (errors['email'] syntax) */
  get errors(): Record<string, string> {
    return this.formService.errors();
  }

  /** Form mező getterek/setterek - ngModel kompatibilitás */
  get email(): string { return this.formService.email; }
  set email(value: string) { this.formService.email = value; }

  get password(): string { return this.formService.password; }
  set password(value: string) { this.formService.password = value; }

  get passwordConfirmation(): string { return this.formService.passwordConfirmation; }
  set passwordConfirmation(value: string) { this.formService.passwordConfirmation = value; }

  constructor() {
    // Password strength validator beállítása amikor a viewChild elérhető
    effect(() => {
      const strengthComp = this.passwordStrength();
      if (strengthComp) {
        this.formService.setPasswordStrengthValidator(() => strengthComp.isValid());
      }
    });
  }

  ngOnInit(): void {
    const initial = this.initialEmail();
    if (initial) {
      this.formService.email = initial;
    }
  }

  onInputChange(): void {
    this.formService.onInputChange();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmationVisibility(): void {
    this.showPasswordConfirmation.update(v => !v);
  }

  onSubmit(): void {
    this.formService.submit((token) => {
      this.resultEvent.emit({ action: 'success', token });
    });
  }

  onCancel(): void {
    if (this.isSubmitting()) return;
    this.resultEvent.emit({ action: 'cancel' });
  }
}
