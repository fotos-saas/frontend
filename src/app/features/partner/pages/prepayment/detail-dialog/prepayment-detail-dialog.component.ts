import {
  Component,
  inject,
  signal,
  input,
  output,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import {
  Prepayment,
  PrepaymentEvent,
  PREPAYMENT_STATUS_LABELS,
  PREPAYMENT_STATUS_COLORS,
  PREPAYMENT_MODE_LABELS,
} from '../../../models/prepayment.models';

/** Esemény ikon mapping */
const EVENT_ICONS: Record<string, string> = {
  created: 'plus-circle',
  paid: 'check-circle',
  reminder_sent: 'mail',
  cancelled: 'x-circle',
  refunded: 'undo-2',
  applied: 'check',
  forfeited: 'alert-triangle',
  expired: 'clock',
  notification_sent: 'forward',
};

@Component({
  selector: 'app-prepayment-detail-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './prepayment-detail-dialog.component.html',
  styleUrl: './prepayment-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentDetailDialogComponent implements OnInit {
  readonly prepayment = input.required<Prepayment>();
  readonly close = output<void>();

  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  readonly STATUS_LABELS = PREPAYMENT_STATUS_LABELS;
  readonly STATUS_COLORS = PREPAYMENT_STATUS_COLORS;
  readonly MODE_LABELS = PREPAYMENT_MODE_LABELS;

  detail = signal<Prepayment | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.loading.set(true);
    this.prepaymentService.getPrepayment(this.prepayment().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.detail.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getEventIcon(eventType: string): string {
    return EVENT_ICONS[eventType] ?? ICONS.CIRCLE;
  }

  getEventLabel(eventType: string): string {
    const labels: Record<string, string> = {
      created: 'Létrehozva',
      paid: 'Fizetve',
      reminder_sent: 'Emlékeztető elküldve',
      cancelled: 'Sztornózva',
      refunded: 'Visszatérítve',
      applied: 'Felhasználva rendelésnél',
      forfeited: 'Elveszett',
      expired: 'Lejárt',
      notification_sent: 'Értesítés elküldve',
    };
    return labels[eventType] ?? eventType;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hu-HU');
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
