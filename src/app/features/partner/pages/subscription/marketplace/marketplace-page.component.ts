import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MarketplaceService } from '../../../services/marketplace.service';
import { ModuleCategory } from '../../../models/marketplace.models';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe, DatePipe],
  templateUrl: './marketplace-page.component.html',
  styleUrl: './marketplace-page.component.scss',
})
export class MarketplacePageComponent implements OnInit {
  private readonly marketplaceService = inject(MarketplaceService);

  readonly ICONS = ICONS;

  readonly modules = this.marketplaceService.modules;
  readonly packages = this.marketplaceService.packages;
  readonly activePackage = this.marketplaceService.activePackage;
  readonly loading = this.marketplaceService.loading;
  readonly activeModulesCount = this.marketplaceService.activeModulesCount;
  readonly monthlyModuleCost = this.marketplaceService.monthlyModuleCost;

  readonly selectedCategory = signal<ModuleCategory | 'all'>('all');

  readonly categories: Array<{ key: ModuleCategory | 'all'; label: string }> = [
    { key: 'all', label: 'Összes' },
    { key: 'core', label: 'Alapvető' },
    { key: 'communication', label: 'Kommunikáció' },
    { key: 'ai', label: 'AI' },
    { key: 'content', label: 'Tartalom' },
    { key: 'business', label: 'Üzleti' },
    { key: 'management', label: 'Menedzsment' },
  ];

  readonly filteredModules = computed(() => {
    const cat = this.selectedCategory();
    const mods = this.modules();
    if (cat === 'all') return mods;
    return mods.filter(m => m.category === cat);
  });

  ngOnInit(): void {
    this.marketplaceService.getModules().subscribe();
    this.marketplaceService.getPackages().subscribe();
  }

  selectCategory(cat: ModuleCategory | 'all'): void {
    this.selectedCategory.set(cat);
  }

  activateModule(moduleKey: string): void {
    this.marketplaceService.activateModule(moduleKey).subscribe();
  }

  cancelModule(moduleKey: string): void {
    this.marketplaceService.cancelModule(moduleKey).subscribe();
  }

  pauseModule(moduleKey: string): void {
    this.marketplaceService.pauseModule(moduleKey).subscribe();
  }

  resumeModule(moduleKey: string): void {
    this.marketplaceService.resumeModule(moduleKey).subscribe();
  }

  activatePackage(packageKey: string): void {
    this.marketplaceService.activatePackage(packageKey).subscribe();
  }

  cancelPackage(packageKey: string): void {
    this.marketplaceService.cancelPackage(packageKey).subscribe();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      inactive: 'Inaktív',
      trial: 'Próba',
      active: 'Aktív',
      paused: 'Szüneteltetve',
      canceling: 'Lemondva',
      free: 'Ingyenes',
      package: 'Csomagban',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      inactive: 'status--inactive',
      trial: 'status--trial',
      active: 'status--active',
      paused: 'status--paused',
      canceling: 'status--canceling',
      free: 'status--free',
      package: 'status--package',
    };
    return classes[status] ?? '';
  }

  formatPrice(price: number | null): string {
    if (price === null) return 'Ingyenes';
    return `${price.toLocaleString('hu-HU')} Ft/hó`;
  }
}
