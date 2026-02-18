import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../../shared/constants/icons.constants';
import type { AlbumType } from '../../../../services/partner.service';

/**
 * Wizard header - cím (album névvel) és bezárás gomb.
 */
@Component({
  selector: 'app-wizard-header',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="wizard-header">
      <div class="header-content">
        <h2>
          {{ title() }}
          @if (albumLabel()) {
            <span class="album-separator">·</span>
            <span class="album-label">
              <lucide-icon [name]="albumIcon()" [size]="18" />
              {{ albumLabel() }}
            </span>
          }
        </h2>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <button type="button" class="close-btn" (click)="close.emit()">
        <lucide-icon [name]="ICONS.X" [size]="20" />
      </button>
    </div>
  `,
  styles: [`
    .wizard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-content h2 {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .album-separator {
      margin: 0 8px;
      color: #cbd5e1;
      font-weight: 300;
    }

    .album-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 1.125rem;
      font-weight: 500;
      color: #475569;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    @media (max-width: 480px) {
      .header-content h2 {
        font-size: 1.0625rem;
      }

      .album-label {
        font-size: 1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardHeaderComponent {
  readonly ICONS = ICONS;

  readonly title = input<string>('Képek feltöltése');
  readonly subtitle = input<string>('');
  readonly selectedAlbum = input<AlbumType | null>(null);

  readonly close = output<void>();

  readonly albumLabel = computed(() => {
    const album = this.selectedAlbum();
    if (!album) return '';
    return album === 'students' ? 'Diákok' : 'Tanárok';
  });

  readonly albumIcon = computed(() => {
    const album = this.selectedAlbum();
    return album === 'students' ? ICONS.GRADUATION_CAP : ICONS.BRIEFCASE;
  });
}
