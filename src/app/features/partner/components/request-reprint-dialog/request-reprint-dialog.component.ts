import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ICONS } from '@shared/constants/icons.constants';
import { RequestReprintPayload } from '@core/models/print-order.models';

@Component({
  selector: 'app-request-reprint-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogWrapperComponent, FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './request-reprint-dialog.component.html',
  styleUrl: './request-reprint-dialog.component.scss',
})
export class RequestReprintDialogComponent {
  readonly projectName = input.required<string>();
  readonly currentCopies = input(1);
  readonly isSubmitting = input(false);

  readonly submitReprint = output<RequestReprintPayload>();
  readonly close = output<void>();

  protected readonly ICONS = ICONS;
  protected readonly today = new Date().toISOString().split('T')[0];

  protected message = signal('');
  protected printCopies = signal(1);
  protected printDeadline = signal<string | null>(null);
  protected isUrgent = signal(false);

  constructor() {
    effect(() => this.printCopies.set(this.currentCopies()));
  }

  get canSubmit(): boolean {
    return this.message().trim().length > 0;
  }

  onSubmit(): void {
    if (!this.canSubmit) return;
    this.submitReprint.emit({
      message: this.message(),
      print_copies: this.printCopies(),
      print_deadline: this.printDeadline(),
      is_urgent: this.isUrgent(),
    });
  }
}
