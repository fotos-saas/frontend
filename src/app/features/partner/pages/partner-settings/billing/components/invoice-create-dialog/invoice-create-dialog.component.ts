import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, output, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent, PsDatepickerComponent } from '@shared/components/form';
import { DialogWrapperComponent } from '../../../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsSelectOption } from '@shared/components/form/form.types';
import { InvoiceService } from '../../../../../services/invoice.service';
import {
  InvoiceType,
  INVOICE_TYPE_LABELS,
  CreateInvoiceItemPayload,
} from '../../../../../models/invoice.models';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatPrice } from '@shared/utils/formatters.util';

interface ItemRow {
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  description: string;
}

@Component({
  selector: 'app-invoice-create-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsTextareaComponent, PsToggleComponent, PsDatepickerComponent, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-create-dialog.component.html',
  styleUrl: './invoice-create-dialog.component.scss',
})
export class InvoiceCreateDialogComponent {
  private invoiceService = inject(InvoiceService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly close = output<void>();
  readonly created = output<void>();

  readonly ICONS = ICONS;
  readonly TYPE_LABELS = INVOICE_TYPE_LABELS;

  readonly typeOptions: PsSelectOption[] = [
    { id: 'invoice', label: 'Számla' },
    { id: 'proforma', label: 'Díjbekérő' },
    { id: 'deposit', label: 'Előlegszámla' },
  ];

  readonly unitOptions: PsSelectOption[] = [
    { id: 'db', label: 'db' },
    { id: 'ora', label: 'óra' },
    { id: 'alkalom', label: 'alkalom' },
    { id: 'csomag', label: 'csomag' },
  ];

  readonly saving = signal(false);

  // Form fields
  readonly type = signal<InvoiceType>('invoice');
  readonly customerName = signal('');
  readonly customerEmail = signal('');
  readonly customerTaxNumber = signal('');
  readonly customerAddress = signal('');
  readonly issueDate = signal(this.formatDateForInput(new Date()));
  readonly fulfillmentDate = signal(this.formatDateForInput(new Date()));
  readonly dueDate = signal(this.formatDateForInput(this.addDays(new Date(), 8)));
  readonly comment = signal('');
  readonly syncImmediately = signal(true);

  readonly items = signal<ItemRow[]>([
    { name: '', quantity: 1, unitPrice: 0, unit: 'db', description: '' },
  ]);

  readonly vatPercentage = 27;

  readonly totals = computed(() => {
    const rows = this.items();
    let net = 0;
    for (const item of rows) {
      net += item.quantity * item.unitPrice;
    }
    const vat = Math.round(net * (this.vatPercentage / 100));
    return { net, vat, gross: net + vat };
  });

  addItem(): void {
    this.items.update(items => [...items, { name: '', quantity: 1, unitPrice: 0, unit: 'db', description: '' }]);
  }

  removeItem(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  updateItem(index: number, field: keyof ItemRow, value: string | number): void {
    this.items.update(items => items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  onToggleSyncImmediately(): void {
    this.syncImmediately.update(v => !v);
  }

  submit(): void {
    if (!this.customerName()) {
      this.toast.error('Hiba', 'A vevő neve kötelező');
      return;
    }

    const validItems = this.items().filter(i => i.name && i.unitPrice > 0);
    if (validItems.length === 0) {
      this.toast.error('Hiba', 'Legalább egy érvényes tétel szükséges');
      return;
    }

    this.saving.set(true);

    const itemPayloads: CreateInvoiceItemPayload[] = validItems.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      unit: i.unit,
      description: i.description || undefined,
    }));

    this.invoiceService.createInvoice({
      type: this.type(),
      issue_date: this.issueDate(),
      due_date: this.dueDate(),
      fulfillment_date: this.fulfillmentDate(),
      customer_name: this.customerName(),
      customer_email: this.customerEmail() || undefined,
      customer_tax_number: this.customerTaxNumber() || undefined,
      customer_address: this.customerAddress() || undefined,
      comment: this.comment() || undefined,
      sync_immediately: this.syncImmediately(),
      items: itemPayloads,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.toast.success('Siker', res.message);
        this.saving.set(false);
        this.created.emit();
      },
      error: () => {
        this.toast.error('Hiba', 'Számla létrehozás sikertelen');
        this.saving.set(false);
      },
    });
  }

  readonly formatAmount = formatPrice;

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
