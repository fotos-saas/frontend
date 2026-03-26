import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { SendToPrintPayload } from '@core/models/print-order.models';

@Component({
  selector: 'app-send-to-print-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogWrapperComponent, FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './send-to-print-dialog.component.html',
  styleUrl: './send-to-print-dialog.component.scss',
})
export class SendToPrintDialogComponent {
  readonly projectName = input.required<string>();
  readonly isSubmitting = input(false);

  readonly submitOrder = output<SendToPrintPayload>();
  readonly close = output<void>();

  protected readonly ICONS = ICONS;
  protected readonly today = new Date().toISOString().split('T')[0];

  protected printCopies = signal(1);
  protected printDeadline = signal<string | null>(null);
  protected isUrgent = signal(false);
  protected message = signal('');

  onSubmit(): void {
    this.submitOrder.emit({
      print_copies: this.printCopies(),
      print_deadline: this.printDeadline(),
      is_urgent: this.isUrgent(),
      message: this.message() || null,
    });
  }
}
