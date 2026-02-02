import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  input,
  output,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';
import { SuperAdminService, DiscountInfo } from '../services/super-admin.service';
import { ICONS } from '../../../shared/constants/icons.constants';

/**
 * Kedvezmény beállítás dialógus
 * Stripe coupon létrehozása és alkalmazása.
 */
@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, LucideAngularModule, MatTooltipModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div #dialogContent class="dialog dialog--md" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" tabindex="-1">
        <!-- Header -->
        <header class="dialog__header">
          <div class="dialog__icon dialog__icon--discount">
            <lucide-icon [name]="ICONS.PERCENT" [size]="28" />
          </div>
          <h2 class="dialog__title">{{ currentDiscount() ? 'Kedvezmény módosítása' : 'Kedvezmény beállítása' }}</h2>
          <p class="dialog__subtitle">{{ subscriberName() }}</p>
        </header>

        <!-- Content -->
        <div class="dialog__content">
          <form (ngSubmit)="onSubmit()">
            <!-- Százalék -->
            <div class="form-group">
              <label for="percent" class="form-label">Kedvezmény mértéke (%)</label>
              <input
                type="number"
                id="percent"
                class="form-input"
                [ngModel]="percent()"
                (ngModelChange)="percent.set($event)"
                name="percent"
                min="1"
                max="99"
                required
                placeholder="pl. 20"
              />
              @if (percent() > 0 && percent() <= 99) {
                <span class="form-hint">{{ percent() }}% kedvezmény minden számlából</span>
              }
            </div>

            <!-- Időtartam típus -->
            <div class="form-group">
              <label class="form-label">Érvényesség</label>
              <div class="radio-group">
                <label
                  class="radio-item"
                  [class.radio-item--active]="durationType() === 'forever'"
                >
                  <input
                    type="radio"
                    name="durationType"
                    value="forever"
                    [checked]="durationType() === 'forever'"
                    (change)="durationType.set('forever')"
                  />
                  <span>Örökre</span>
                </label>
                <label
                  class="radio-item"
                  [class.radio-item--active]="durationType() === 'months'"
                >
                  <input
                    type="radio"
                    name="durationType"
                    value="months"
                    [checked]="durationType() === 'months'"
                    (change)="durationType.set('months')"
                  />
                  <span>Meghatározott időre</span>
                </label>
              </div>
            </div>

            <!-- Hónapok száma -->
            @if (durationType() === 'months') {
              <div class="form-group">
                <label for="durationMonths" class="form-label">Hónapok száma</label>
                <input
                  type="number"
                  id="durationMonths"
                  class="form-input"
                  [ngModel]="durationMonths()"
                  (ngModelChange)="durationMonths.set($event)"
                  name="durationMonths"
                  min="1"
                  max="120"
                  required
                  placeholder="pl. 6"
                />
                @if (durationMonths() > 0) {
                  <span class="form-hint">{{ formatExpiryDate() }}-ig érvényes</span>
                }
              </div>
            }

            <!-- Megjegyzés -->
            <div class="form-group">
              <label for="note" class="form-label">Megjegyzés (opcionális)</label>
              <textarea
                id="note"
                class="form-input form-textarea"
                [ngModel]="note()"
                (ngModelChange)="note.set($event)"
                name="note"
                maxlength="500"
                rows="3"
                placeholder="pl. Hűségkedvezmény, egyedi megállapodás..."
              ></textarea>
              <span class="form-hint">{{ note().length }}/500 karakter</span>
            </div>

            @if (currentDiscount()) {
              <div class="info-box">
                <lucide-icon [name]="ICONS.INFO" [size]="16" />
                <span>A jelenlegi {{ currentDiscount() }}% kedvezmény felülírásra kerül.</span>
              </div>
            }

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
            [disabled]="isSubmitting() || !isFormValid()"
          >
            @if (isSubmitting()) {
              <span class="btn__spinner"></span>
            }
            Mentés
          </button>
        </footer>
      </div>
    </div>
  `,
  styleUrls: ['./dialog-shared.scss', './discount-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountDialogComponent implements AfterViewInit, OnDestroy {
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

  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLElement>;

  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

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

    if (this.dialogContent?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(this.dialogContent.nativeElement);
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
      if (this.dialogContent?.nativeElement) {
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
