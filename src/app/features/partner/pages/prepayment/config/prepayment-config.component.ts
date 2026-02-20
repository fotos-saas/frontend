import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerPrepaymentService } from '../../../services/partner-prepayment.service';
import {
  PrepaymentConfig,
  PrepaymentMode,
  PREPAYMENT_MODE_LABELS,
} from '../../../models/prepayment.models';
import {
  PsInputComponent,
  PsTextareaComponent,
  PsToggleComponent,
  PsCheckboxComponent,
} from '@shared/components/form';

interface ModeCard {
  mode: PrepaymentMode;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-prepayment-config',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    PsInputComponent,
    PsTextareaComponent,
    PsToggleComponent,
    PsCheckboxComponent,
  ],
  templateUrl: './prepayment-config.component.html',
  styleUrl: './prepayment-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentConfigComponent implements OnInit {
  private readonly prepaymentService = inject(PartnerPrepaymentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly el = inject(ElementRef);

  readonly ICONS = ICONS;
  readonly PREPAYMENT_MODE_LABELS = PREPAYMENT_MODE_LABELS;

  readonly modeCards: ModeCard[] = [
    {
      mode: 'fixed_fee',
      label: 'Fix díj',
      description: 'Minden diák azonos összeget fizet előre.',
      icon: ICONS.BANKNOTE,
    },
    {
      mode: 'deposit',
      label: 'Előleg',
      description: 'A végösszeg egy részét fizetik be előre.',
      icon: ICONS.WALLET,
    },
    {
      mode: 'package',
      label: 'Csomag',
      description: 'Előre összeállított csomagokból választhatnak.',
      icon: ICONS.PACKAGE,
    },
  ];

  // Állapot
  config = signal<PrepaymentConfig | null>(null);
  loading = signal(true);
  saving = signal(false);

  // Űrlap mezők
  isEnabled = signal(false);
  selectedMode = signal<PrepaymentMode>('fixed_fee');
  amountHuf = signal<number | null>(null);
  label = signal('');
  description = signal('');
  isRefundable = signal(true);
  refundDeadlineHours = signal(48);
  minOrderToApply = signal(0);
  forfeitIfNoOrder = signal(false);
  paymentMethods = signal<Record<string, boolean>>({
    bank_transfer: true,
    cash: true,
    card: false,
  });
  paymentDeadlineDays = signal(7);
  reminderDays = signal('3,1');
  sendInvoice = signal(false);
  customTerms = signal('');
  attempted = signal(false);

  readonly errors = computed(() => {
    const errs: Record<string, string> = {};
    if (this.selectedMode() !== 'package' && (!this.amountHuf() || this.amountHuf()! < 100)) {
      errs['amount_huf'] = 'Az összeg megadása kötelező (min. 100 Ft).';
    }
    if (!this.label().trim()) {
      errs['label'] = 'A megnevezés kitöltése kötelező.';
    }
    const methods = Object.values(this.paymentMethods()).filter(Boolean);
    if (methods.length === 0) {
      errs['payment_methods'] = 'Legalább egy fizetési mód kiválasztása kötelező.';
    }
    return errs;
  });

  readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.prepaymentService.getConfigs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const cfg = res.data?.[0] ?? null;
          this.config.set(cfg);
          if (cfg) {
            this.populateForm(cfg);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private populateForm(cfg: PrepaymentConfig): void {
    this.isEnabled.set(cfg.is_enabled);
    this.selectedMode.set(cfg.mode);
    this.amountHuf.set(cfg.amount_huf);
    this.label.set(cfg.label);
    this.description.set(cfg.description ?? '');
    this.isRefundable.set(cfg.is_refundable);
    this.refundDeadlineHours.set(cfg.refund_deadline_hours);
    this.minOrderToApply.set(cfg.min_order_to_apply);
    this.forfeitIfNoOrder.set(cfg.forfeit_if_no_order);
    this.paymentDeadlineDays.set(cfg.payment_deadline_days);
    this.reminderDays.set(cfg.reminder_schedule?.join(',') ?? '3,1');
    this.sendInvoice.set(cfg.send_invoice);
    this.customTerms.set(cfg.custom_terms ?? '');

    const methods: Record<string, boolean> = {
      bank_transfer: false,
      cash: false,
      card: false,
    };
    cfg.payment_methods.forEach((m) => (methods[m] = true));
    this.paymentMethods.set(methods);
  }

  selectMode(mode: PrepaymentMode): void {
    this.selectedMode.set(mode);
  }

  togglePaymentMethod(method: string): void {
    const current = this.paymentMethods();
    this.paymentMethods.set({ ...current, [method]: !current[method] });
  }

  save(): void {
    this.attempted.set(true);
    if (this.hasErrors()) {
      setTimeout(() => {
        const firstError = this.el.nativeElement.querySelector('.field-error');
        firstError?.closest('.field-wrap, .settings-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    this.saving.set(true);
    const methods = Object.entries(this.paymentMethods())
      .filter(([, v]) => v)
      .map(([k]) => k);

    const reminder = this.reminderDays()
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const payload: Partial<PrepaymentConfig> = {
      is_enabled: this.isEnabled(),
      mode: this.selectedMode(),
      amount_huf: this.amountHuf(),
      label: this.label(),
      description: this.description() || null,
      is_refundable: this.isRefundable(),
      refund_deadline_hours: this.refundDeadlineHours(),
      min_order_to_apply: this.minOrderToApply(),
      forfeit_if_no_order: this.forfeitIfNoOrder(),
      payment_methods: methods,
      payment_deadline_days: this.paymentDeadlineDays(),
      reminder_schedule: reminder,
      send_invoice: this.sendInvoice(),
      custom_terms: this.customTerms() || null,
    };

    const existing = this.config();
    const request$ = existing
      ? this.prepaymentService.updateConfig(existing.id, payload)
      : this.prepaymentService.createConfig(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.config.set(res.data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    const cfg = this.config();
    if (cfg) {
      this.populateForm(cfg);
    }
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      bank_transfer: 'Banki utalás',
      cash: 'Készpénz',
      card: 'Bankkártya (online)',
    };
    return labels[method] ?? method;
  }
}
