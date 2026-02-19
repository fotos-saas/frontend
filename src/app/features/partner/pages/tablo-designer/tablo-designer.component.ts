import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PhotoshopService } from '../../services/photoshop.service';

@Component({
  selector: 'app-tablo-designer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tablo-designer.component.html',
  styleUrl: './tablo-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabloDesignerComponent implements OnInit {
  private readonly ps = inject(PhotoshopService);
  protected readonly ICONS = ICONS;

  /** PhotoshopService signal-ek */
  readonly psPath = this.ps.path;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;

  /** Lokalis allapot */
  readonly launching = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.ps.detectPhotoshop();
  }

  async selectPsPath(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);

    const path = await this.ps.browseForPhotoshop();
    if (!path) return;

    const ok = await this.ps.setPath(path);
    if (ok) {
      this.successMessage.set('Photoshop sikeresen beallitva!');
    } else {
      this.error.set('A kivalasztott fajl nem egy ervenyes Photoshop alkalmazas.');
    }
  }

  async launchPs(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);
    this.launching.set(true);

    try {
      const result = await this.ps.launchPhotoshop();
      if (result.success) {
        this.successMessage.set('Photoshop elinditva!');
      } else {
        this.error.set(result.error || 'Nem sikerult elinditani a Photoshop-ot.');
      }
    } finally {
      this.launching.set(false);
    }
  }
}
