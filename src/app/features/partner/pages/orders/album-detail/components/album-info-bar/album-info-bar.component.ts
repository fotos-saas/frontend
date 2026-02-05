import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerOrderAlbumDetails } from '../../../../../services/partner-orders.service';

/**
 * Album Info Bar Component
 *
 * Kompakt info sáv: statisztikák, nézet váltó, lejárat kezelés.
 */
@Component({
  selector: 'app-album-info-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './album-info-bar.component.html',
  styleUrls: ['./album-info-bar.component.scss']
})
export class AlbumInfoBarComponent {
  readonly ICONS = ICONS;

  // Inputs (Signal-based)
  readonly album = input.required<PartnerOrderAlbumDetails>();
  readonly viewMode = input.required<'grid' | 'list'>();
  readonly selectedCount = input<number>(0);
  readonly extendingExpiry = input<boolean>(false);
  readonly expiryDateValue = input<string>('');
  readonly tomorrowDate = input<string>('');
  readonly isExpired = input<boolean>(false);

  // Outputs
  readonly viewModeChange = output<'grid' | 'list'>();
  readonly expiryChange = output<string>();
  readonly extendExpiry = output<number>();

  onExpiryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.expiryChange.emit(input.value);
    }
  }
}
