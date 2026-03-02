import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../../services/partner.service';

/**
 * Párosítatlan képek panel - jobb oldali sidebar.
 * Vertikálisan görgethető, 2 oszlopos grid.
 */
@Component({
  selector: 'app-review-unassigned-panel',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, LucideAngularModule],
  templateUrl: './unassigned-panel.component.html',
  styleUrls: ['./unassigned-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewUnassignedPanelComponent {
  readonly ICONS = ICONS;

  readonly photos = input.required<UploadedPhoto[]>();
  readonly connectedDropLists = input<string[]>([]);

  readonly photoClick = output<UploadedPhoto>();
  readonly deleteAll = output<void>();
  readonly drop = output<CdkDragDrop<any>>();

  onDrop(event: CdkDragDrop<any>): void {
    this.drop.emit(event);
  }
}
