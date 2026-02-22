import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';

/**
 * Személy kártya a személyek listájában.
 * Title megjelenítés, photo_type badge.
 */
@Component({
  selector: 'app-modal-person-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './modal-person-card.component.html',
  styleUrl: './modal-person-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPersonCardComponent {
  readonly ICONS = ICONS;

  readonly person = input.required<TabloPersonItem>();
  readonly animationDelay = input<string>('0s');

  readonly cardClick = output<TabloPersonItem>();

  onCardClick(): void {
    if (this.person().photoUrl) {
      this.cardClick.emit(this.person());
    }
  }
}
