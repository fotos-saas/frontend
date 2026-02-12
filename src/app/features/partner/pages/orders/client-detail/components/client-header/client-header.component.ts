import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { PartnerClientDetails } from '../../../../../services/partner-orders.service';

/**
 * Client Header Component
 *
 * Kliens részletek oldal fejléce:
 * - Vissza link
 * - Akció gombok (szerkesztés, törlés, kód inaktiválás)
 * - Kliens név és státusz badge-ek
 * - Email/telefon meta adatok
 */
@Component({
  selector: 'app-client-header',
  standalone: true,
  imports: [RouterModule, DatePipe, LucideAngularModule, MatTooltipModule],
  templateUrl: './client-header.component.html',
  styleUrls: ['./client-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientHeaderComponent {
  protected readonly ICONS = ICONS;

  /** Kliens adatok */
  readonly client = input.required<PartnerClientDetails>();

  /** Output events */
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly disableCode = output<void>();
}
