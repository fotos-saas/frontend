import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '@shared/components/form';
import { PartnerService, GuestSession } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-guest-session-edit-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guest-session-edit-dialog.component.html',
})
export class GuestSessionEditDialogComponent {
  projectId = input.required<number>();
  session = input.required<GuestSession>();
  close = output<void>();
  saved = output<void>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  saving = signal(false);

  name = '';
  email = '';

  ngOnInit(): void {
    const s = this.session();
    this.name = s.guestName;
    this.email = s.guestEmail ?? '';
  }

  save(): void {
    if (!this.name.trim()) return;

    this.saving.set(true);
    this.partnerService.updateGuestSession(this.projectId(), this.session().id, {
      guest_name: this.name.trim(),
      guest_email: this.email.trim() || null,
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Siker', 'Felhasználó módosítva.');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült a módosítás.');
      },
    });
  }
}
