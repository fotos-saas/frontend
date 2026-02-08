import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PartnerWebshopService, ShopSettings, PaperSize, PaperType } from '../../../services/partner-webshop.service';

@Component({
  selector: 'app-webshop-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent],
  templateUrl: './webshop-settings.component.html',
  styleUrl: './webshop-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopSettingsComponent implements OnInit {
  private webshopService = inject(PartnerWebshopService);
  private destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  settings = signal<ShopSettings | null>(null);
  paperSizes = signal<PaperSize[]>([]);
  paperTypes = signal<PaperType[]>([]);
  loading = signal(true);
  saving = signal(false);

  // Edit state
  editingSizeId = signal<number | null>(null);
  editingTypeId = signal<number | null>(null);
  showNewSizeForm = signal(false);
  showNewTypeForm = signal(false);

  // New item forms
  newSize = signal({ name: '', width_cm: 0, height_cm: 0 });
  newType = signal({ name: '', description: '' });

  // Delete confirm
  showDeleteConfirm = signal(false);
  deleteAction = signal<(() => void) | null>(null);
  deleteMessage = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.webshopService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.settings.set(res.settings);
        if (res.settings) {
          this.loadPaperSizes();
          this.loadPaperTypes();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  initializeWebshop(): void {
    this.saving.set(true);
    this.webshopService.initializeWebshop().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.settings.set(res.settings);
        this.loadPaperSizes();
        this.loadPaperTypes();
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveSettings(): void {
    const s = this.settings();
    if (!s) return;

    this.saving.set(true);
    this.webshopService.updateSettings(s).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.settings.set(res.settings);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  updateField(field: keyof ShopSettings, value: unknown): void {
    const s = this.settings();
    if (!s) return;
    this.settings.set({ ...s, [field]: value });
  }

  // Paper Sizes
  private loadPaperSizes(): void {
    this.webshopService.getPaperSizes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.paperSizes.set(res.paper_sizes),
    });
  }

  addPaperSize(): void {
    const n = this.newSize();
    if (!n.name || !n.width_cm || !n.height_cm) return;

    this.webshopService.createPaperSize(n).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadPaperSizes();
        this.showNewSizeForm.set(false);
        this.newSize.set({ name: '', width_cm: 0, height_cm: 0 });
      },
    });
  }

  updatePaperSize(size: PaperSize): void {
    this.webshopService.updatePaperSize(size.id, size).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadPaperSizes();
        this.editingSizeId.set(null);
      },
    });
  }

  deletePaperSize(size: PaperSize): void {
    this.deleteMessage.set(`Biztosan törölni szeretnéd a(z) "${size.name}" papírméretet?`);
    this.deleteAction.set(() => {
      this.webshopService.deletePaperSize(size.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadPaperSizes(),
      });
    });
    this.showDeleteConfirm.set(true);
  }

  // Paper Types
  private loadPaperTypes(): void {
    this.webshopService.getPaperTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.paperTypes.set(res.paper_types),
    });
  }

  addPaperType(): void {
    const n = this.newType();
    if (!n.name) return;

    this.webshopService.createPaperType(n).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadPaperTypes();
        this.showNewTypeForm.set(false);
        this.newType.set({ name: '', description: '' });
      },
    });
  }

  updatePaperType(type: PaperType): void {
    this.webshopService.updatePaperType(type.id, type).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadPaperTypes();
        this.editingTypeId.set(null);
      },
    });
  }

  deletePaperType(type: PaperType): void {
    this.deleteMessage.set(`Biztosan törölni szeretnéd a(z) "${type.name}" papírtípust?`);
    this.deleteAction.set(() => {
      this.webshopService.deletePaperType(type.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.loadPaperTypes(),
      });
    });
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deleteAction()?.();
    }
    this.showDeleteConfirm.set(false);
    this.deleteAction.set(null);
  }
}
