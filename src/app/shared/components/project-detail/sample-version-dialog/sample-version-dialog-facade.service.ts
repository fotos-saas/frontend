import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { PartnerService, SampleVersion, SampleVersionImage } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Injectable()
export class SampleVersionDialogFacade {
  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // State
  readonly selectedFiles = signal<File[]>([]);
  readonly existingImages = signal<SampleVersionImage[]>([]);
  readonly deletedImageIds = signal<number[]>([]);
  readonly previewUrls = signal<string[]>([]);
  readonly saving = signal(false);
  readonly generatingSummary = signal(false);
  readonly showSummary = signal(false);

  description = '';
  summaryText = '';

  readonly isValid = computed(() => {
    const hasNewFiles = this.selectedFiles().length > 0;
    const hasExisting = this.existingImages().length > 0;
    return hasNewFiles || hasExisting;
  });

  initFromVersion(version: SampleVersion): void {
    this.description = version.description;
    this.existingImages.set([...version.images]);
  }

  addFiles(files: File[]): void {
    const valid: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.toast.error('Hiba', `"${file.name}" nem kép fájl.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toast.error('Hiba', `"${file.name}" mérete meghaladja a 10 MB-ot.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    this.selectedFiles.update(prev => [...prev, ...valid]);
    const newUrls = valid.map(f => URL.createObjectURL(f));
    this.previewUrls.update(prev => [...prev, ...newUrls]);
  }

  removeNewFile(index: number): void {
    const urls = this.previewUrls();
    if (urls[index]) {
      URL.revokeObjectURL(urls[index]);
    }
    this.selectedFiles.update(prev => prev.filter((_, i) => i !== index));
    this.previewUrls.update(prev => prev.filter((_, i) => i !== index));
  }

  removeExistingImage(id: number): void {
    this.existingImages.update(prev => prev.filter(img => img.id !== id));
    this.deletedImageIds.update(prev => [...prev, id]);
  }

  generateSummary(text: string): void {
    if (!text.trim() || this.generatingSummary()) return;
    this.generatingSummary.set(true);

    this.partnerService.generateAiSummary(text).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.summaryText = res.summary;
        this.showSummary.set(true);
        this.generatingSummary.set(false);
      },
      error: () => {
        this.generatingSummary.set(false);
        this.toast.error('Hiba', 'Nem sikerült az összefoglaló generálása.');
      },
    });
  }

  dismissSummary(): void {
    this.showSummary.set(false);
    this.summaryText = '';
  }

  applySummary(): void {
    this.description = this.summaryText;
    this.showSummary.set(false);
    this.summaryText = '';
  }

  save(projectId: number, packageId: number | null, editVersion: SampleVersion | null, onSuccess: () => void): void {
    if (!this.isValid() || this.saving()) return;

    this.saving.set(true);

    const buildFormData = (): FormData => {
      const formData = new FormData();
      formData.append('description', this.description.trim());
      for (const file of this.selectedFiles()) {
        formData.append('images[]', file);
      }
      if (editVersion) {
        for (const id of this.deletedImageIds()) {
          formData.append('delete_image_ids[]', id.toString());
        }
      }
      return formData;
    };

    // Ha packageId null → előbb csomagot hozunk létre, utána verziót
    const resolvePackageId$ = packageId !== null
      ? of(packageId)
      : this.partnerService.createSamplePackage(
          projectId,
          `Minta ${new Date().toLocaleDateString('hu-HU')} ${new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`
        ).pipe(switchMap(res => of(res.data.id)));

    resolvePackageId$.pipe(
      switchMap(pkgId => {
        const formData = buildFormData();
        return editVersion
          ? this.partnerService.updateSampleVersion(projectId, pkgId, editVersion.id, formData)
          : this.partnerService.addSampleVersion(projectId, pkgId, formData);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Siker', editVersion ? 'Verzió módosítva.' : 'Új minta hozzáadva.');
        onSuccess();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült a mentés.');
      },
    });
  }

  cleanup(): void {
    for (const url of this.previewUrls()) {
      URL.revokeObjectURL(url);
    }
  }
}
