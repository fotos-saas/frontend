import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrandingService, BrandingData } from '../../../services/branding.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ICONS } from '../../../../../shared/constants/icons.constants';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './branding.component.html',
  styleUrl: './branding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandingComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly brandingService = inject(BrandingService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  protected readonly ICONS = ICONS;
  protected readonly isPartner = this.authService.isPartner;

  loading = signal(true);
  saving = signal(false);
  accessDenied = signal(false);
  branding = signal<BrandingData | null>(null);

  brandName = signal<string>('');
  isActive = signal(false);

  // Upload states
  logoUploading = signal(false);
  faviconUploading = signal(false);
  ogImageUploading = signal(false);

  ngOnInit(): void {
    this.loadBranding();
  }

  private loadBranding(): void {
    this.loading.set(true);
    this.brandingService.getBranding()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.set(response.branding);
          this.brandName.set(response.branding?.brand_name ?? '');
          this.isActive.set(response.branding?.is_active ?? false);
          this.brandingService.updateState(response.branding);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 403) {
            this.accessDenied.set(true);
          } else {
            this.logger.error('Branding betöltés sikertelen:', err);
          }
          this.loading.set(false);
        }
      });
  }

  saveBranding(): void {
    this.saving.set(true);
    this.brandingService.updateBranding({
      brand_name: this.brandName() || null,
      is_active: this.isActive()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.set(response.branding);
          this.brandingService.updateState(response.branding);
          this.toastService.success('Siker', 'Márkajelzés mentve.');
          this.saving.set(false);
        },
        error: (err) => {
          this.logger.error('Branding mentés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült menteni a márkajelzést.');
          this.saving.set(false);
        }
      });
  }

  onLogoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoUploading.set(true);
    this.brandingService.uploadLogo(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.update(b => b ? { ...b, logo_url: response.logo_url ?? null } : b);
          this.brandingService.logoUrl.set(response.logo_url ?? null);
          this.toastService.success('Siker', 'Logó feltöltve.');
          this.logoUploading.set(false);
        },
        error: (err) => {
          this.logger.error('Logó feltöltés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült feltölteni a logót.');
          this.logoUploading.set(false);
        }
      });
  }

  onFaviconSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.faviconUploading.set(true);
    this.brandingService.uploadFavicon(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.update(b => b ? { ...b, favicon_url: response.favicon_url ?? null } : b);
          this.brandingService.faviconUrl.set(response.favicon_url ?? null);
          this.toastService.success('Siker', 'Favicon feltöltve.');
          this.faviconUploading.set(false);
        },
        error: (err) => {
          this.logger.error('Favicon feltöltés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült feltölteni a favicont.');
          this.faviconUploading.set(false);
        }
      });
  }

  onOgImageSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.ogImageUploading.set(true);
    this.brandingService.uploadOgImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.update(b => b ? { ...b, og_image_url: response.og_image_url ?? null } : b);
          this.toastService.success('Siker', 'OG kép feltöltve.');
          this.ogImageUploading.set(false);
        },
        error: (err) => {
          this.logger.error('OG kép feltöltés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült feltölteni az OG képet.');
          this.ogImageUploading.set(false);
        }
      });
  }

  deleteLogo(): void {
    this.brandingService.deleteLogo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.branding.update(b => b ? { ...b, logo_url: null } : b);
          this.brandingService.logoUrl.set(null);
          this.toastService.success('Siker', 'Logó törölve.');
        },
        error: (err) => {
          this.logger.error('Logó törlés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült törölni a logót.');
        }
      });
  }

  deleteFavicon(): void {
    this.brandingService.deleteFavicon()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.branding.update(b => b ? { ...b, favicon_url: null } : b);
          this.brandingService.faviconUrl.set(null);
          this.toastService.success('Siker', 'Favicon törölve.');
        },
        error: (err) => {
          this.logger.error('Favicon törlés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült törölni a favicont.');
        }
      });
  }

  deleteOgImage(): void {
    this.brandingService.deleteOgImage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.branding.update(b => b ? { ...b, og_image_url: null } : b);
          this.toastService.success('Siker', 'OG kép törölve.');
        },
        error: (err) => {
          this.logger.error('OG kép törlés sikertelen:', err);
          this.toastService.error('Hiba', 'Nem sikerült törölni az OG képet.');
        }
      });
  }
}
