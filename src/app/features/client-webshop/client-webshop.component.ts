import { Component, inject, OnInit, signal, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ClientWebshopService, ShopConfig, ShopProductPublic, ShopPhoto } from './client-webshop.service';
import { cartItems, cartTotal, cartItemCount, addToCart, removeFromCart, updateQuantity, clearCart } from './client-webshop.state';
import { CheckoutDialogComponent } from './components/checkout-dialog/checkout-dialog.component';

@Component({
  selector: 'app-client-webshop',
  standalone: true,
  imports: [DecimalPipe, FormsModule, LucideAngularModule, CheckoutDialogComponent],
  templateUrl: './client-webshop.component.html',
  styleUrl: './client-webshop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientWebshopComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private webshopService = inject(ClientWebshopService);
  readonly ICONS = ICONS;
  readonly Math = Math;

  token = '';
  config = signal<ShopConfig | null>(null);
  sourceName = signal('');
  products = signal<ShopProductPublic[]>([]);
  photos = signal<ShopPhoto[]>([]);
  loading = signal(true);
  error = signal('');

  // Cart state (shared signals)
  readonly cartItems = cartItems;
  readonly cartTotal = cartTotal;
  readonly cartItemCount = cartItemCount;

  // Product selector
  selectedPhoto = signal<ShopPhoto | null>(null);
  selectedProduct = signal<ShopProductPublic | null>(null);
  selectedQuantity = signal(1);

  // Checkout
  showCheckout = signal(false);

  // Grouped products by size
  productsBySize = computed(() => {
    const map = new Map<string, ShopProductPublic[]>();
    for (const p of this.products()) {
      const key = p.paper_size_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.webshopService.getConfig(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.config.set(res.config);
        this.sourceName.set(res.source_name);
        this.loadProducts();
        this.loadPhotos();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'A webshop nem elérhető.');
        this.loading.set(false);
      },
    });
  }

  private loadProducts(): void {
    this.webshopService.getProducts(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.products.set(res.products),
    });
  }

  private loadPhotos(): void {
    this.webshopService.getPhotos(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.photos.set(res.photos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectPhoto(photo: ShopPhoto): void {
    this.selectedPhoto.set(photo);
    this.selectedProduct.set(null);
    this.selectedQuantity.set(1);
  }

  selectProduct(product: ShopProductPublic): void {
    this.selectedProduct.set(product);
  }

  addSelectedToCart(): void {
    const photo = this.selectedPhoto();
    const product = this.selectedProduct();
    if (!photo || !product) return;

    addToCart({
      mediaId: photo.id,
      photoUrl: photo.thumb_url,
      photoFilename: photo.title,
      productId: product.id,
      paperSizeName: product.paper_size_name,
      paperTypeName: product.paper_type_name,
      unitPrice: product.price_huf,
      quantity: this.selectedQuantity(),
    });

    this.selectedPhoto.set(null);
    this.selectedProduct.set(null);
    this.selectedQuantity.set(1);
  }

  removeItem(id: string): void {
    removeFromCart(id);
  }

  updateItemQuantity(id: string, qty: number): void {
    updateQuantity(id, qty);
  }

  openCheckout(): void {
    this.showCheckout.set(true);
  }

  closeCheckout(): void {
    this.showCheckout.set(false);
  }

  onCheckoutSuccess(checkoutUrl: string): void {
    clearCart();
    window.location.href = checkoutUrl;
  }
}
