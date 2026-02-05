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
  template: `
    <div class="album-picker">
      <div class="picker-header">
        <h3>Válaszd ki, hova szeretnél képeket feltölteni</h3>
        <p class="picker-subtitle">A diákok és tanárok képei külön albumban kezelhetők</p>
      </div>

      <div class="album-cards">
        <!-- Diákok album -->
        <div
          class="album-card"
          [class.album-card--has-photos]="albums().students.photoCount > 0"
          (click)="selectAlbum('students')"
        >
          <div class="album-icon">
            <lucide-icon [name]="ICONS.GRADUATION_CAP" [size]="32" />
          </div>
          <h4 class="album-title">Diákok</h4>

          <div class="album-stats">
            @if (albums().students.missingCount > 0) {
              <div class="stat stat--missing">
                <lucide-icon [name]="ICONS.USER_X" [size]="16" />
                <span>{{ albums().students.missingCount }} hiányzik</span>
              </div>
            }
            @if (albums().students.photoCount > 0) {
              <div class="stat stat--pending">
                <lucide-icon [name]="ICONS.CLOCK" [size]="16" />
                <span>{{ albums().students.photoCount }} párosításra vár</span>
              </div>
            }
            @if (albums().students.photoCount === 0 && albums().students.missingCount === 0) {
              <div class="stat stat--empty">
                <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" />
                <span>Minden kép kész</span>
              </div>
            }
          </div>

          <!-- Kártya stack preview -->
          @if (albums().students.previewThumbs && albums().students.previewThumbs.length > 0) {
            <div class="photo-stack">
              @for (thumb of albums().students.previewThumbs.slice(0, 3); track thumb; let i = $index) {
                <div
                  class="stack-card"
                  [style.--stack-index]="i"
                  [style.z-index]="3 - i"
                >
                  <img [src]="thumb" alt="Preview" />
                </div>
              }
              @if (albums().students.photoCount > 3) {
                <div class="stack-more">+{{ albums().students.photoCount - 3 }}</div>
              }
            </div>
          }

          <button class="album-btn" type="button">
            @if (albums().students.photoCount > 0) {
              Folytatás
            } @else {
              Megnyitás
            }
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
          </button>
        </div>

        <!-- Tanárok album -->
        <div
          class="album-card"
          [class.album-card--has-photos]="albums().teachers.photoCount > 0"
          (click)="selectAlbum('teachers')"
        >
          <div class="album-icon album-icon--teachers">
            <lucide-icon [name]="ICONS.BRIEFCASE" [size]="32" />
          </div>
          <h4 class="album-title">Tanárok</h4>

          <div class="album-stats">
            @if (albums().teachers.missingCount > 0) {
              <div class="stat stat--missing">
                <lucide-icon [name]="ICONS.USER_X" [size]="16" />
                <span>{{ albums().teachers.missingCount }} hiányzik</span>
              </div>
            }
            @if (albums().teachers.photoCount > 0) {
              <div class="stat stat--pending">
                <lucide-icon [name]="ICONS.CLOCK" [size]="16" />
                <span>{{ albums().teachers.photoCount }} párosításra vár</span>
              </div>
            }
            @if (albums().teachers.photoCount === 0 && albums().teachers.missingCount === 0) {
              <div class="stat stat--empty">
                <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" />
                <span>Minden kép kész</span>
              </div>
            }
          </div>

          <!-- Kártya stack preview -->
          @if (albums().teachers.previewThumbs && albums().teachers.previewThumbs.length > 0) {
            <div class="photo-stack">
              @for (thumb of albums().teachers.previewThumbs.slice(0, 3); track thumb; let i = $index) {
                <div
                  class="stack-card"
                  [style.--stack-index]="i"
                  [style.z-index]="3 - i"
                >
                  <img [src]="thumb" alt="Preview" />
                </div>
              }
              @if (albums().teachers.photoCount > 3) {
                <div class="stack-more">+{{ albums().teachers.photoCount - 3 }}</div>
              }
            </div>
          }

          <button class="album-btn" type="button">
            @if (albums().teachers.photoCount > 0) {
              Folytatás
            } @else {
              Megnyitás
            }
            <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="16" />
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .album-picker {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .picker-header {
      text-align: center;
    }

    .picker-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .picker-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .album-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 600px) {
      .album-cards {
        grid-template-columns: 1fr;
      }
    }

    .album-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 280px;
    }

    .album-card:hover {
      border-color: var(--color-primary, #1e3a5f);
      background: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
    }

    .album-card--has-photos {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .album-card--has-photos:hover {
      border-color: #d97706;
      background: #fef3c7;
    }

    .album-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
      border-radius: 16px;
      color: #ffffff;
    }

    .album-icon--teachers {
      background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
    }

    .album-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .album-stats {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-height: 48px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .stat--missing {
      background: #fef3c7;
      color: #b45309;
    }

    .stat--pending {
      background: #e0e7ff;
      color: #4338ca;
    }

    .stat--empty {
      background: #d1fae5;
      color: #047857;
    }

    /* Kártya stack */
    .photo-stack {
      position: relative;
      width: 80px;
      height: 90px;
      margin: 8px 0;
    }

    .stack-card {
      position: absolute;
      width: 64px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateX(calc(var(--stack-index) * 8px)) rotate(calc(var(--stack-index) * -3deg));
      transition: transform 0.2s ease;
    }

    .album-card:hover .stack-card {
      transform: translateX(calc(var(--stack-index) * 10px)) rotate(calc(var(--stack-index) * -5deg));
    }

    .stack-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .stack-more {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e3a5f;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .album-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: auto;
    }

    .album-btn:hover {
      background: var(--color-primary-dark, #152a45);
    }

    .album-card--has-photos .album-btn {
      background: #f59e0b;
    }

    .album-card--has-photos .album-btn:hover {
      background: #d97706;
    }
  `],
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
