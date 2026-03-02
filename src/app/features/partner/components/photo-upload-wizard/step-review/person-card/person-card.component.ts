import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import { UploadedPhoto } from '../../../../services/partner.service';
import { PersonWithPhoto } from '../step-review.types';

/**
 * Személykártya drag & drop támogatással.
 * Megjeleníti a személyt és a hozzárendelt fotót.
 */
@Component({
  selector: 'app-review-person-card',
  standalone: true,
  imports: [DragDropModule, MatTooltipModule, LucideAngularModule],
  templateUrl: './person-card.component.html',
  styleUrls: ['./person-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewPersonCardComponent {
  readonly ICONS = ICONS;

  readonly person = input.required<PersonWithPhoto>();
  readonly animationDelay = input<string>('0s');
  readonly connectedDropLists = input<string[]>([]);

  readonly photoClick = output<UploadedPhoto>();
  readonly removeClick = output<void>();
  readonly drop = output<CdkDragDrop<any>>();

  onDrop(event: CdkDragDrop<any>): void {
    this.drop.emit(event);
  }
}
