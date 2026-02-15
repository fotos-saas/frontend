import { Component, input, output, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerOrdersService, PartnerClient } from '../../services/partner-orders.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent, PsTextareaComponent } from '@shared/components/form';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * Client Edit Modal - Ügyfél szerkesztése.
 */
@Component({
  selector: 'app-client-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsTextareaComponent, DialogWrapperComponent],
  templateUrl: './client-edit-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientEditModalComponent {
  private readonly ordersService = inject(PartnerOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly client = input<PartnerClient | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly close = output<void>();
  readonly saved = output<PartnerClient>();

  readonly ICONS = ICONS;

  name = '';
  email = '';
  phone = '';
  note = '';
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const client = this.client();
    if (client && this.mode() === 'edit') {
      this.name = client.name;
      this.email = client.email ?? '';
      this.phone = client.phone ?? '';
      this.note = client.note ?? '';
    }
  }

  save(): void {
    if (!this.name.trim() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name.trim(),
      email: this.email.trim() || null,
      phone: this.phone.trim() || null,
      note: this.note.trim() || null
    };

    const request$ = this.mode() === 'create'
      ? this.ordersService.createClient(payload)
      : this.ordersService.updateClient(this.client()!.id, payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saved.emit(response.data);
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
