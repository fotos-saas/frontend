import {
  Component,
  inject,
  signal,
  input,
  output,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import { Prepayment } from '../../../models/prepayment.models';
import { PsTextareaComponent } from '@shared/components/form';

@Component({
  selector: 'app-mark-paid-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    DialogWrapperComponent,
    PsTextareaComponent,
  ],
  templateUrl: './mark-paid-dialog.component.html',
  styleUrl: './mark-paid-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkPaidDialogComponent {
  readonly prepayment = input.required<Prepayment>();
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  paymentMethod = signal<'cash' | 'bank_transfer'>('bank_transfer');
  notes = signal('');
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  selectMethod(method: 'cash' | 'bank_transfer'): void {
    this.paymentMethod.set(method);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  onSubmit(): void {
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.prepaymentService.markPaid(this.prepayment().id, {
      payment_method: this.paymentMethod(),
      notes: this.notes() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'Hiba történt a művelet során.');
        },
      });
  }
}
