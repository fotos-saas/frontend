import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../../../shared/utils/dialog.util';

/**
 * Delete Account Dialog Component
 *
 * GDPR-kompatibilis fiók törlés dialógus.
 * Megerősítést kér a felhasználótól ("TÖRLÉS" beírása).
 */
@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './delete-account-dialog.component.html',
  styleUrls: ['./delete-account-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteAccountDialogComponent {
  isSubmitting = input<boolean>(false);
  close = output<void>();
  confirm = output<void>();

  protected readonly ICONS = ICONS;

  confirmText = signal('');

  backdropHandler = createBackdropHandler(() => {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  });
}
