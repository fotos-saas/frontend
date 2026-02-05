import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { AlbumsSummary, AlbumType } from '../../../services/partner.service';

/**
 * Album választó komponens a wizard kezdőképernyőjéhez.
 *
 * Két album kártya:
 * - Diákok (students)
 * - Tanárok (teachers)
 *
 * Megjeleníti:
 * - Hiányzó személyek száma (akiknek még nincs képük)
 * - Pending képek száma (feltöltött de nem párosított)
 * - Kártya stack preview (ha van kép)
 */
@Component({
  selector: 'app-step-album-picker',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './step-album-picker.component.html',
  styleUrls: ['./step-album-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepAlbumPickerComponent {
  readonly ICONS = ICONS;

  readonly albums = input.required<AlbumsSummary>();
  readonly albumSelected = output<AlbumType>();

  selectAlbum(album: AlbumType): void {
    this.albumSelected.emit(album);
  }
}
