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
  computed,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { SuperAdminService, DiscountInfo } from '../../services/super-admin.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Kedvezmény beállítás dialógus
 * Stripe coupon létrehozása és alkalmazása.
 */
@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [FormsModule, A11yModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './discount-dialog.component.html',
  styleUrls: ['../dialog-shared.scss', './discount-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'handleKeyboardEvent($event)',
  }
})
export class DiscountDialogComponent implements AfterViewInit {
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  /** Inputs */
  readonly subscriberId = input.required<number>();
  readonly subscriberName = input.required<string>();
  readonly currentDiscount = input<number | null>(null);

  /** Outputs */
  readonly close = output<void>();
  readonly saved = output<DiscountInfo>();

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

  readonly backdropHandler = createBackdropHandler(() => this.onCancel());

  ngAfterViewInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Set initial value from current discount
    if (this.currentDiscount()) {
      this.percent.set(this.currentDiscount()!);
    }

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
