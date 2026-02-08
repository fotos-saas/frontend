import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerWebshopService, ShopSettings, PaperSize, PaperType } from '../../../services/partner-webshop.service';

@Component({
  selector: 'app-webshop-settings',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule],
  templateUrl: './webshop-settings.component.html',
  styleUrl: './webshop-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopSettingsComponent implements OnInit {
  private webshopService = inject(PartnerWebshopService);
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

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.webshopService.getSettings().subscribe({
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
    this.webshopService.initializeWebshop().subscribe({
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
    this.webshopService.updateSettings(s).subscribe({
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
    this.webshopService.getPaperSizes().subscribe({
      next: (res) => this.paperSizes.set(res.paper_sizes),
    });
  }

  addPaperSize(): void {
    const n = this.newSize();
    if (!n.name || !n.width_cm || !n.height_cm) return;

    this.webshopService.createPaperSize(n).subscribe({
      next: () => {
        this.loadPaperSizes();
        this.showNewSizeForm.set(false);
        this.newSize.set({ name: '', width_cm: 0, height_cm: 0 });
      },
    });
  }

  updatePaperSize(size: PaperSize): void {
    this.webshopService.updatePaperSize(size.id, size).subscribe({
      next: () => {
        this.loadPaperSizes();
        this.editingSizeId.set(null);
      },
    });
  }

  deletePaperSize(id: number): void {
    this.webshopService.deletePaperSize(id).subscribe({
      next: () => this.loadPaperSizes(),
    });
  }

  // Paper Types
  private loadPaperTypes(): void {
    this.webshopService.getPaperTypes().subscribe({
      next: (res) => this.paperTypes.set(res.paper_types),
    });
  }

  addPaperType(): void {
    const n = this.newType();
    if (!n.name) return;

    this.webshopService.createPaperType(n).subscribe({
      next: () => {
        this.loadPaperTypes();
        this.showNewTypeForm.set(false);
        this.newType.set({ name: '', description: '' });
      },
    });
  }

  updatePaperType(type: PaperType): void {
    this.webshopService.updatePaperType(type.id, type).subscribe({
      next: () => {
        this.loadPaperTypes();
        this.editingTypeId.set(null);
      },
    });
  }

  deletePaperType(id: number): void {
    this.webshopService.deletePaperType(id).subscribe({
      next: () => this.loadPaperTypes(),
    });
  }
}
