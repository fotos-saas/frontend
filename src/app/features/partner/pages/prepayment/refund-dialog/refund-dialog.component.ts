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
  selector: 'app-refund-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    DialogWrapperComponent,
    PsTextareaComponent,
  ],
  templateUrl: './refund-dialog.component.html',
  styleUrl: './refund-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefundDialogComponent {
  readonly prepayment = input.required<Prepayment>();
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  reason = signal('');
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  onSubmit(): void {
    if (!this.reason().trim()) {
      this.errorMessage.set('Az indoklás megadása kötelező.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.prepaymentService.refund(this.prepayment().id, this.reason())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'Hiba történt a visszatérítés során.');
        },
      });
  }
}
