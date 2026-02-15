import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent, PsSelectComponent, PsToggleComponent } from '@shared/components/form';
import { PsSelectOption } from '@shared/components/form/form.types';
import { PartnerService } from '../../services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsSelectComponent, PsToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.scss',
})
export class GlobalSettingsComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly zipContentOptions: PsSelectOption[] = [
    { id: 'all', label: 'Összes kép' },
    { id: 'retouch_and_tablo', label: 'Retusált + Tablókép' },
    { id: 'retouch_only', label: 'Csak retusált' },
    { id: 'tablo_only', label: 'Csak tablókép' },
  ];

  readonly fileNamingOptions: PsSelectOption[] = [
    { id: 'original', label: 'Eredeti fájlnév' },
    { id: 'student_name', label: 'Diák neve' },
    { id: 'student_name_iptc', label: 'IPTC beágyazás' },
  ];

  loading = signal(true);
  saving = signal(false);
  maxRetouchPhotos = signal(3);
  freeEditWindowHours = signal(24);
  billingEnabled = signal(false);
  defaultZipContent = signal('all');
  defaultFileNaming = signal('original');
  exportAlwaysAsk = signal(true);

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.partnerService.getGlobalSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.maxRetouchPhotos.set(res.data.default_max_retouch_photos);
        this.freeEditWindowHours.set(res.data.default_free_edit_window_hours ?? 24);
        this.billingEnabled.set(res.data.billing_enabled ?? false);
        this.defaultZipContent.set(res.data.default_zip_content ?? 'all');
        this.defaultFileNaming.set(res.data.default_file_naming ?? 'original');
        this.exportAlwaysAsk.set(res.data.export_always_ask ?? true);
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
      default_free_edit_window_hours: this.freeEditWindowHours(),
      billing_enabled: this.billingEnabled(),
      default_zip_content: this.defaultZipContent(),
      default_file_naming: this.defaultFileNaming(),
      export_always_ask: this.exportAlwaysAsk(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.maxRetouchPhotos.set(res.data.default_max_retouch_photos);
        this.freeEditWindowHours.set(res.data.default_free_edit_window_hours ?? 24);
        this.billingEnabled.set(res.data.billing_enabled ?? false);
        this.defaultZipContent.set(res.data.default_zip_content ?? 'all');
        this.defaultFileNaming.set(res.data.default_file_naming ?? 'original');
        this.exportAlwaysAsk.set(res.data.export_always_ask ?? true);
        this.toast.success('Siker', 'Beállítások mentve');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült menteni a beállításokat');
      },
    });
  }
}
