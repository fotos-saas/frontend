import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  input,
  output,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { SuperAdminService } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Manuális terhelés dialógus
 * Stripe Invoice létrehozása és azonnali terhelése.
 */
@Component({
  selector: 'app-charge-subscriber-dialog',
  standalone: true,
  imports: [FormsModule, A11yModule, LucideAngularModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div #dialogContent class="dialog dialog--md" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" tabindex="-1">
        <!-- Header -->
        <header class="dialog__header">
          <div class="dialog__icon">
            <lucide-icon [name]="ICONS.CREDIT_CARD" [size]="28" />
          </div>
          <h2 class="dialog__title">Manuális terhelés</h2>
          <p class="dialog__subtitle">{{ subscriberName() }}</p>
        </header>

        <!-- Content -->
        <div class="dialog__content">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="amount" class="form-label">Összeg (Ft)</label>
              <input
                type="number"
                id="amount"
                class="form-input"
                [(ngModel)]="amount"
                name="amount"
                min="1"
                required
                placeholder="pl. 5000"
              />
              @if (amount() > 0) {
                <span class="form-hint">{{ formatAmount(amount()) }}</span>
              }
            </div>

            <div class="form-group">
              <label for="description" class="form-label">Leírás</label>
              <input
                type="text"
                id="description"
                class="form-input"
                [(ngModel)]="description"
                name="description"
                maxlength="255"
                required
                placeholder="pl. Extra tárhely"
              />
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
                {{ errorMessage() }}
              </div>
            }
          </form>
        </div>

        <!-- Footer -->
        <footer class="dialog__footer">
          <button
            type="button"
            class="btn btn--secondary"
            (click)="onCancel()"
            [disabled]="isSubmitting()"
          >
            Mégse
          </button>
          <button
            type="button"
            class="btn btn--primary"
            (click)="onSubmit()"
            [disabled]="isSubmitting() || !isValid()"
          >
            @if (isSubmitting()) {
              <span class="btn__spinner"></span>
            }
            Terhelés
          </button>
        </footer>
      </div>
    </div>
  `,
  styleUrls: ['../dialog-shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargeSubscriberDialogComponent implements AfterViewInit, OnDestroy {
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Inputs */
  readonly subscriberId = input.required<number>();
  readonly subscriberName = input.required<string>();

  /** Outputs */
  readonly close = output<void>();
  readonly charged = output<void>();

  readonly dialogContent = viewChild<ElementRef<HTMLElement>>('dialogContent');

  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

  // Form state
  amount = signal(0);
  description = signal('');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly backdropHandler = createBackdropHandler(() => this.onCancel());

  ngAfterViewInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;

    if (this.dialogContent()?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(this.dialogContent()!.nativeElement);
      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();

    if (this.previousActiveElement?.focus) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
      }, 0);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.dialogContent()?.nativeElement) {
        this.onCancel();
      }
    }
  }

  isValid(): boolean {
    return this.amount() > 0 && this.description().trim().length > 0;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft';
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.isValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.chargeSubscriber(this.subscriberId(), {
      amount: this.amount(),
      description: this.description().trim()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.charged.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Hiba történt a terhelés során.');
        }
      });
  }
}
