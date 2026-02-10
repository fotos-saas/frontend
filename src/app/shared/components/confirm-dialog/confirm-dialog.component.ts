import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { DialogTheme } from '../dialog-wrapper/dialog-wrapper.types';

export interface ConfirmDialogResult {
  action: 'confirm' | 'cancel';
}

/**
 * Újrafelhasználható megerősítő dialógus
 *
 * Törlések és veszélyes műveletek megerősítésére.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly ICONS = ICONS;

  /** Signal-based inputs */
  readonly title = input<string>('Megerősítés');
  readonly message = input<string>('Biztosan folytatod?');
  readonly confirmText = input<string>('Törlés');
  readonly cancelText = input<string>('Mégse');
  readonly confirmType = input<'danger' | 'warning' | 'primary'>('danger');
  readonly isSubmitting = input<boolean>(false);
  readonly showCancel = input<boolean>(true);

  /** Signal-based output */
  readonly resultEvent = output<ConfirmDialogResult>();

  /** Dinamikus téma a confirmType alapján */
  readonly theme = computed<DialogTheme>(() => {
    switch (this.confirmType()) {
      case 'danger': return 'red';
      case 'warning': return 'amber';
      case 'primary': return 'blue';
    }
  });

  /** Dinamikus ikon a confirmType alapján */
  readonly iconName = computed<string>(() => {
    switch (this.confirmType()) {
      case 'danger': return ICONS.DELETE;
      case 'warning': return ICONS.ALERT_TRIANGLE;
      case 'primary': return ICONS.HELP_CIRCLE;
    }
  });

  onCancel(): void {
    this.resultEvent.emit({ action: 'cancel' });
  }

  onConfirm(): void {
    this.resultEvent.emit({ action: 'confirm' });
  }
}
