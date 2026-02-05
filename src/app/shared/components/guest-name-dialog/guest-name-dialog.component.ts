import { Component, input, output, ChangeDetectionStrategy, AfterViewInit, viewChild, ElementRef, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { isValidEmail } from '../../utils/validators.util';

/**
 * Dialog mód: register (első regisztráció) vagy edit (szerkesztés)
 */
export type GuestDialogMode = 'register' | 'edit';

/**
 * Dialog eredmény típus
 */
export type GuestNameResult =
  | { action: 'submit'; name: string; email?: string }
  | { action: 'close' };

/**
 * Guest Name Dialog
 *
 * Vendég névbekérés popup.
 * Két mód:
 * - register: Megjelenik az első belépéskor, kötelező kitölteni
 * - edit: Meglévő adatok szerkesztése (navbar-ból nyitható)
 *
 * BaseDialogComponent-et bővíti a közös funkcionalitásért.
 */
@Component({
  selector: 'app-guest-name-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './guest-name-dialog.component.html',
  styleUrls: ['./guest-name-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestNameDialogComponent extends BaseDialogComponent implements OnInit, AfterViewInit {
  /** Signal-based inputs (external) - different names to not conflict with base class */
  readonly mode = input<GuestDialogMode>('register');
  readonly initialName = input<string>('');
  readonly initialEmail = input<string>('');
  readonly externalIsSubmitting = input<boolean>(false, { alias: 'isSubmitting' });
  readonly externalErrorMessage = input<string | null>(null, { alias: 'errorMessage' });
  readonly canClose = input<boolean>(false);

  /** Signal-based outputs */
  readonly resultEvent = output<GuestNameResult>();

  /** Computed signals for template compatibility */
  readonly isBusy = computed(() => this.externalIsSubmitting() || this._isSubmitting());
  readonly apiError = computed(() => this.externalErrorMessage() || this._errorMessage());

  /** Form adatok */
  guestName = '';
  guestEmail = '';

  /** Validációs hibák */
  errors: { name?: string; email?: string } = {};

  /** ViewChild referenciák */
  readonly firstInput = viewChild<ElementRef<HTMLInputElement>>('firstInput');

  ngOnInit(): void {
    // Kezdeti értékek beállítása Input-okból
    this.guestName = this.initialName();
    this.guestEmail = this.initialEmail();
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    // Focus az első input mezőre
    setTimeout(() => {
      this.firstInput()?.nativeElement.focus();
    }, 100);
  }

  /**
   * Input change - töröljük a hibát
   */
  onInputChange(): void {
    this.errors = {};
  }

  /**
   * Validáció
   */
  private validate(): boolean {
    this.errors = {};

    const trimmedName = this.guestName.trim();

    if (!trimmedName) {
      this.errors.name = 'Add meg a neved!';
      return false;
    }

    if (trimmedName.length < 2) {
      this.errors.name = 'A név legalább 2 karakter legyen.';
      return false;
    }

    if (trimmedName.length > 100) {
      this.errors.name = 'A név maximum 100 karakter lehet.';
      return false;
    }

    // Email opcionális, de ha van, validálni kell
    const trimmedEmail = this.guestEmail.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      this.errors.email = 'Érvénytelen email cím.';
      return false;
    }

    return true;
  }

  /**
   * Form érvényes-e
   */
  get isFormValid(): boolean {
    return this.guestName.trim().length >= 2;
  }

  /**
   * Dialog címe módtól függően
   */
  readonly dialogTitle = computed(() =>
    this.mode() === 'edit' ? 'Adatok módosítása' : 'Üdvözöllek!'
  );

  /**
   * Dialog leírása módtól függően
   */
  readonly dialogDescription = computed(() =>
    this.mode() === 'edit'
      ? 'Itt módosíthatod a megjelenített nevedet és email címedet.'
      : 'Kérlek, add meg a neved, hogy részt vehess a szavazásban és a beszélgetésekben.'
  );

  /**
   * Gomb szövege módtól függően
   */
  readonly submitButtonText = computed(() => {
    if (this.isBusy()) {
      return this.mode() === 'edit' ? 'Mentés...' : 'Regisztráció...';
    }
    return this.mode() === 'edit' ? 'Mentés' : 'Tovább';
  });

  // ============================================================================
  // BaseDialogComponent abstract metódusok implementálása
  // ============================================================================

  protected onSubmit(): void {
    if (this.isBusy()) return;

    if (this.validate()) {
      this.resultEvent.emit({
        action: 'submit',
        name: this.guestName.trim(),
        email: this.guestEmail.trim() || undefined
      });
    }
  }

  protected onClose(): void {
    if (!this.isBusy() && this.canClose()) {
      this.resultEvent.emit({ action: 'close' });
    }
  }

  /**
   * Override close to check canClose
   */
  override close(): void {
    if (this.canClose()) {
      super.close();
    }
  }
}
