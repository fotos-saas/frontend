import { Component, inject, OnInit, signal, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { PsInputComponent } from '@shared/components/form';
import { PartnerWebshopService, ShopProduct, PaperSize, PaperType, PricingUpdate } from '../../../services/partner-webshop.service';

@Component({
  selector: 'app-webshop-products',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsInputComponent],
  templateUrl: './webshop-products.component.html',
  styleUrl: './webshop-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebshopProductsComponent implements OnInit {
  private webshopService = inject(PartnerWebshopService);
  private destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  products = signal<ShopProduct[]>([]);
  paperSizes = signal<PaperSize[]>([]);
  paperTypes = signal<PaperType[]>([]);
  loading = signal(true);
  saving = signal(false);
  hasChanges = signal(false);

  // Pricing map: "sizeId-typeId" -> { price, isActive }
  priceMap = signal<Map<string, { price: number; isActive: boolean }>>(new Map());

  activeSizes = computed(() => this.paperSizes().filter(s => s.is_active));
  activeTypes = computed(() => this.paperTypes().filter(t => t.is_active));

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.webshopService.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.paperSizes.set(res.paper_sizes);
        this.paperTypes.set(res.paper_types);
        this.buildPriceMap(res.products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildPriceMap(products: ShopProduct[]): void {
    const map = new Map<string, { price: number; isActive: boolean }>();
    for (const p of products) {
      map.set(`${p.paper_size_id}-${p.paper_type_id}`, {
        price: p.price_huf,
        isActive: p.is_active,
      });
    }
    this.priceMap.set(map);
  }

  getPrice(sizeId: number, typeId: number): number {
    return this.priceMap().get(`${sizeId}-${typeId}`)?.price ?? 0;
  }

  getIsActive(sizeId: number, typeId: number): boolean {
    return this.priceMap().get(`${sizeId}-${typeId}`)?.isActive ?? true;
  }

  updatePrice(sizeId: number, typeId: number, price: number): void {
    const map = new Map(this.priceMap());
    const key = `${sizeId}-${typeId}`;
    const existing = map.get(key);
    map.set(key, { price, isActive: existing?.isActive ?? true });
    this.priceMap.set(map);
    this.hasChanges.set(true);
  }

  toggleActive(sizeId: number, typeId: number): void {
    const map = new Map(this.priceMap());
    const key = `${sizeId}-${typeId}`;
    const existing = map.get(key);
    map.set(key, { price: existing?.price ?? 0, isActive: !(existing?.isActive ?? true) });
    this.priceMap.set(map);
    this.hasChanges.set(true);
  }

  saveAll(): void {
    const updates: PricingUpdate[] = [];
    for (const p of this.products()) {
      const entry = this.priceMap().get(`${p.paper_size_id}-${p.paper_type_id}`);
      if (entry) {
        updates.push({
          id: p.id,
          price_huf: entry.price,
          is_active: entry.isActive,
        });
      }
    }

    this.saving.set(true);
    this.webshopService.bulkUpdatePricing(updates).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.hasChanges.set(false);
        this.saving.set(false);
        this.loadProducts();
      },
      error: () => this.saving.set(false),
    });
  }
}
