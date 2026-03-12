import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayQuickActionsService } from '../../overlay-quick-actions.service';

@Component({
  selector: 'app-overlay-qa-panels',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './overlay-qa-panels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayQaPanelsComponent {
  protected readonly ICONS = ICONS;
  readonly qa = inject(OverlayQuickActionsService);

  applyBorderRadius(): void {
    this.qa.applyBorderRadiusSelected();
  }

  applyRotate(): void {
    this.qa.applyRotateSelected();
  }
}
