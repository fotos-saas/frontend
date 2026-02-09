import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-help-fab',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './help-fab.component.html',
  styleUrl: './help-fab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpFabComponent {
  readonly ICONS = ICONS;
  readonly toggleChat = output<void>();
}
