import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { SuperAdminService } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { formatPrice } from '@shared/utils/formatters.util';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * Manuális terhelés dialógus
 * Stripe Invoice létrehozása és azonnali terhelése.
 */
@Component({
  selector: 'app-charge-subscriber-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      variant="create"
      headerStyle="hero"
      theme="blue"
      [icon]="ICONS.CREDIT_CARD"
      title="Manuális terhelés"
      [description]="subscriberName()"
      size="md"
      [closable]="!isSubmitting()"
      [isSubmitting]="isSubmitting()"
      [errorMessage]="errorMessage()"
      (closeEvent)="onCancel()"
      (submitEvent)="onSubmit()"
    >
      <ng-container dialogBody>
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
      </ng-container>

      <ng-container dialogFooter>
        <button
          type="button"
          class="btn btn--outline"
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
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          }
          Terhelés
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChargeSubscriberDialogComponent {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Inputs */
  readonly subscriberId = input.required<number>();
  readonly subscriberName = input.required<string>();

  /** Outputs */
  readonly close = output<void>();
  readonly charged = output<void>();

  // Form state
  amount = signal(0);
  description = signal('');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

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
