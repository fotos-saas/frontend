import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  input,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { SuperAdminService, DiscountInfo } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent, PsTextareaComponent, PsRadioGroupComponent } from '@shared/components/form';
import { PsRadioOption } from '@shared/components/form/form.types';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * Kedvezmény beállítás dialógus
 * Stripe coupon létrehozása és alkalmazása.
 */
@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsTextareaComponent, PsRadioGroupComponent, DialogWrapperComponent],
  templateUrl: './discount-dialog.component.html',
  styleUrls: ['./discount-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountDialogComponent implements AfterViewInit {
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly durationOptions: PsRadioOption[] = [
    { value: 'forever', label: 'Örökre' },
    { value: 'months', label: 'Meghatározott időre' },
  ];

  /** Inputs */
  readonly subscriberId = input.required<number>();
  readonly subscriberName = input.required<string>();
  readonly currentDiscount = input<number | null>(null);

  /** Outputs */
  readonly close = output<void>();
  readonly saved = output<DiscountInfo>();

  // Form state
  percent = signal(20);
  durationType = signal<'forever' | 'months'>('forever');
  durationMonths = signal(6);
  note = signal('');

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly isFormValid = computed(() => {
    const p = this.percent();
    if (p < 1 || p > 99) return false;
    if (this.durationType() === 'months') {
      const m = this.durationMonths();
      if (m < 1 || m > 120) return false;
    }
    return true;
  });

  ngAfterViewInit(): void {
    if (this.currentDiscount()) {
      this.percent.set(this.currentDiscount()!);
    }
  }

  formatExpiryDate(): string {
    const months = this.durationMonths();
    if (!months || months < 1) return '';
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.setDiscount(this.subscriberId(), {
      percent: this.percent(),
      duration_months: this.durationType() === 'forever' ? null : this.durationMonths(),
      note: this.note().trim() || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          if (response.discount) {
            this.saved.emit(response.discount);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Hiba történt a kedvezmény beállítása során.');
        }
      });
  }
}
