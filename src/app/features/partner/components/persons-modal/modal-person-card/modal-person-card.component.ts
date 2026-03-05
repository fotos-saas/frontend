import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TIMEOUTS } from '../../../../../shared/constants/timeouts.constants';
import { TabloPersonItem } from '../persons-modal.types';
import { getPersonCategory, PersonCategory } from '../person-category.util';

/**
 * Személy kártya a személyek listájában.
 * Title megjelenítés, photo_type badge, ID copy.
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
  readonly editClick = output<TabloPersonItem>();
  readonly photoUploadClick = output<TabloPersonItem>();
  readonly linkClick = output<TabloPersonItem>();
  readonly photoChooserClick = output<TabloPersonItem>();
  readonly idCopied = signal(false);

  /** Tanár kategória (vezetőség/osztályfőnök/sima) */
  readonly category = computed<PersonCategory>(() =>
    this.person().type === 'teacher' ? getPersonCategory(this.person().title) : 'regular'
  );

  onCardClick(): void {
    if (this.person().photoUrl || this.person().photoThumbUrl) {
      this.cardClick.emit(this.person());
    }
  }

  copyId(event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.person().id.toString());
    this.idCopied.set(true);
    setTimeout(() => this.idCopied.set(false), TIMEOUTS.ID_COPY_FEEDBACK);
  }

  onLinkClick(event: Event): void {
    event.stopPropagation();
    this.linkClick.emit(this.person());
  }

  onPhotoChooserClick(event: Event): void {
    event.stopPropagation();
    this.photoChooserClick.emit(this.person());
  }

  onEditClick(event: Event): void {
    event.stopPropagation();
    this.editClick.emit(this.person());
  }

  onPhotoUploadClick(event: Event): void {
    event.stopPropagation();
    this.photoUploadClick.emit(this.person());
  }
}
