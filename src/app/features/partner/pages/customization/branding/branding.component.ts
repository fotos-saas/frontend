import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
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
import { PsInputComponent, PsToggleComponent, PsFileUploadComponent } from '@shared/components/form';

interface PendingMedia {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule, MatTooltipModule, PsInputComponent, PsToggleComponent, PsFileUploadComponent],
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
  hideBrandName = signal(false);

  // Pending media state - lokális változások a mentésig
  pendingLogo = signal<PendingMedia | null>(null);
  pendingFavicon = signal<PendingMedia | null>(null);
  pendingOgImage = signal<PendingMedia | null>(null);

  // Törlésre jelölt média
  deleteLogo = signal(false);
  deleteFavicon = signal(false);
  deleteOgImage = signal(false);

  // Computed: van-e mentetlen változás a médiáknál
  hasMediaChanges = computed(() =>
    !!this.pendingLogo() || !!this.pendingFavicon() || !!this.pendingOgImage() ||
    this.deleteLogo() || this.deleteFavicon() || this.deleteOgImage()
  );

  // Computed: effektív logó URL (pending preview VAGY szerveres, ha nincs törlésre jelölve)
  effectiveLogoUrl = computed(() => {
    if (this.pendingLogo()) return this.pendingLogo()!.previewUrl;
    if (this.deleteLogo()) return null;
    return this.branding()?.logo_url ?? null;
  });

  effectiveFaviconUrl = computed(() => {
    if (this.pendingFavicon()) return this.pendingFavicon()!.previewUrl;
    if (this.deleteFavicon()) return null;
    return this.branding()?.favicon_url ?? null;
  });

  effectiveOgImageUrl = computed(() => {
    if (this.pendingOgImage()) return this.pendingOgImage()!.previewUrl;
    if (this.deleteOgImage()) return null;
    return this.branding()?.og_image_url ?? null;
  });

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
          this.hideBrandName.set(response.branding?.hide_brand_name ?? false);
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
    this.brandingService.saveBranding({
      brand_name: this.brandName() || null,
      is_active: this.isActive(),
      hide_brand_name: this.hideBrandName(),
      logo: this.pendingLogo()?.file,
      favicon: this.pendingFavicon()?.file,
      og_image: this.pendingOgImage()?.file,
      delete_logo: this.deleteLogo(),
      delete_favicon: this.deleteFavicon(),
      delete_og_image: this.deleteOgImage(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.branding.set(response.branding);
          this.brandingService.updateState(response.branding);
          this.clearPendingState();
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

  // --- Logo ---
  onLogoFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;
    this.revokePreview(this.pendingLogo());
    this.pendingLogo.set({ file, previewUrl: URL.createObjectURL(file) });
    this.deleteLogo.set(false);
  }

  removeLogo(): void {
    this.revokePreview(this.pendingLogo());
    this.pendingLogo.set(null);
    if (this.branding()?.logo_url) {
      this.deleteLogo.set(true);
    }
  }

  // --- Favicon ---
  onFaviconFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;
    this.revokePreview(this.pendingFavicon());
    this.pendingFavicon.set({ file, previewUrl: URL.createObjectURL(file) });
    this.deleteFavicon.set(false);
  }

  removeFavicon(): void {
    this.revokePreview(this.pendingFavicon());
    this.pendingFavicon.set(null);
    if (this.branding()?.favicon_url) {
      this.deleteFavicon.set(true);
    }
  }

  // --- OG Image ---
  onOgImageFileChange(files: File[]): void {
    const file = files[0];
    if (!file) return;
    this.revokePreview(this.pendingOgImage());
    this.pendingOgImage.set({ file, previewUrl: URL.createObjectURL(file) });
    this.deleteOgImage.set(false);
  }

  removeOgImage(): void {
    this.revokePreview(this.pendingOgImage());
    this.pendingOgImage.set(null);
    if (this.branding()?.og_image_url) {
      this.deleteOgImage.set(true);
    }
  }

  private revokePreview(pending: PendingMedia | null): void {
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
    }
  }

  private clearPendingState(): void {
    this.revokePreview(this.pendingLogo());
    this.revokePreview(this.pendingFavicon());
    this.revokePreview(this.pendingOgImage());
    this.pendingLogo.set(null);
    this.pendingFavicon.set(null);
    this.pendingOgImage.set(null);
    this.deleteLogo.set(false);
    this.deleteFavicon.set(false);
    this.deleteOgImage.set(false);
  }
}
