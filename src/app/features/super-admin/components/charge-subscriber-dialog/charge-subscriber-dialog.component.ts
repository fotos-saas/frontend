import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  AfterViewInit,
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
import { PsInputComponent } from '@shared/components/form';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { SuperAdminService } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { formatPrice } from '@shared/utils/formatters.util';

/**
 * Manuális terhelés dialógus
 * Stripe Invoice létrehozása és azonnali terhelése.
 */
@Component({
  selector: 'app-charge-subscriber-dialog',
  standalone: true,
  imports: [FormsModule, A11yModule, LucideAngularModule, PsInputComponent],
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
            <ps-input
              type="number"
              label="Összeg (Ft)"
              [(ngModel)]="amount"
              name="amount"
              min="1"
              [required]="true"
              placeholder="pl. 5000"
            />
            @if (amount() > 0) {
              <span class="ps-field__hint">{{ formatAmount(amount()) }}</span>
            }

            <ps-input
              label="Leírás"
              [(ngModel)]="description"
              name="description"
              [required]="true"
              placeholder="pl. Extra tárhely"
            />

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'handleKeyboardEvent($event)',
  }
})
export class ChargeSubscriberDialogComponent implements AfterViewInit {
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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.focusTrap?.destroy();
      if (this.previousActiveElement?.focus) {
        setTimeout(() => this.previousActiveElement?.focus(), 0);
      }
    });
  }

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

  readonly formatAmount = formatPrice;

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
