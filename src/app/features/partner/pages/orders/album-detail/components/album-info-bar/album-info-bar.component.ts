import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerOrderAlbumDetails } from '../../../../../services/partner-orders.service';
import { PsDatepickerComponent } from '@shared/components/form';

/**
 * Album Info Bar Component
 *
 * Kompakt info sáv: statisztikák, nézet váltó, lejárat kezelés.
 */
@Component({
  selector: 'app-album-info-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsDatepickerComponent],
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

}
