import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent } from '@shared/components/form';
import { PartnerOrderAlbumDetails } from '../../../../../services/partner-orders.service';

export interface AlbumEditFormData {
  name: string;
  minSelections: number | null;
  maxSelections: number | null;
  maxRetouchPhotos: number | null;
}

/**
 * Album Edit Modal Component
 *
 * Szerkesztés modal az album nevéhez és beállításaihoz.
 */
@Component({
  selector: 'app-album-edit-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  templateUrl: './album-edit-modal.component.html',
})
export class AlbumEditModalComponent {
  readonly ICONS = ICONS;

  // Inputs (Signal-based)
  readonly album = input.required<PartnerOrderAlbumDetails>();
  readonly isOpen = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly initialFormData = input<AlbumEditFormData>({
    name: '',
    minSelections: null,
    maxSelections: null,
    maxRetouchPhotos: null,
  });

  // Outputs
  readonly close = output<void>();
  readonly save = output<AlbumEditFormData>();

  // Form data (mutable)
  formData: AlbumEditFormData = {
    name: '',
    minSelections: null,
    maxSelections: null,
    maxRetouchPhotos: null,
  };

  ngOnChanges(): void {
    const initial = this.initialFormData();
    this.formData = { ...initial };
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      return;
    }
    this.save.emit({
      ...this.formData,
      name: this.formData.name.trim(),
    });
  }
}
