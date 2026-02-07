import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PartnerService } from '../../services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.scss',
})
export class GlobalSettingsComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  loading = signal(true);
  saving = signal(false);
  maxRetouchPhotos = signal(3);

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.partnerService.getGlobalSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.maxRetouchPhotos.set(res.data.default_max_retouch_photos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült betölteni a beállításokat');
      },
    });
  }

  save(): void {
    this.saving.set(true);

    this.partnerService.updateGlobalSettings({
      default_max_retouch_photos: this.maxRetouchPhotos(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.maxRetouchPhotos.set(res.data.default_max_retouch_photos);
        this.toast.success('Siker', 'Beállítások mentve');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a beállításokat');
      },
    });
  }
}
