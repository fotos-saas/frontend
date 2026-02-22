import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';

/**
 * Személy kártya a személyek listájában.
 * Támogatja: title megjelenítés, photo_type badge, inline szerkesztés.
 */
@Component({
  selector: 'app-modal-person-card',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './modal-person-card.component.html',
  styleUrl: './modal-person-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPersonCardComponent {
  readonly ICONS = ICONS;

  readonly person = input.required<TabloPersonItem>();
  readonly animationDelay = input<string>('0s');

  readonly cardClick = output<TabloPersonItem>();
  readonly resetOverride = output<TabloPersonItem>();
  readonly saveEdit = output<{ personId: number; name: string; title: string | null }>();

  editing = signal(false);
  editName = signal('');
  editTitle = signal('');

  onCardClick(): void {
    if (this.editing()) return;
    if (this.person().photoUrl) {
      this.cardClick.emit(this.person());
    }
  }

  onResetOverride(event: Event): void {
    event.stopPropagation();
    this.resetOverride.emit(this.person());
  }

  startEdit(event: Event): void {
    event.stopPropagation();
    this.editName.set(this.person().name);
    this.editTitle.set(this.person().title || '');
    this.editing.set(true);
  }

  cancelEdit(event: Event): void {
    event.stopPropagation();
    this.editing.set(false);
  }

  confirmEdit(event: Event): void {
    event.stopPropagation();
    const name = this.editName().trim();
    if (!name) return;
    this.saveEdit.emit({
      personId: this.person().id,
      name,
      title: this.editTitle().trim() || null,
    });
    this.editing.set(false);
  }
}
