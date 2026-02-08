import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ShopSettings {
  id: number;
  is_enabled: boolean;
  welcome_message: string | null;
  min_order_amount_huf: number;
  shipping_cost_huf: number;
  shipping_free_threshold_huf: number | null;
  allow_pickup: boolean;
  allow_shipping: boolean;
  terms_text: string | null;
}

export interface PaperSize {
  id: number;
  name: string;
  width_cm: number;
  height_cm: number;
  display_order: number;
  is_active: boolean;
}

export interface PaperType {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ShopProduct {
  id: number;
  paper_size_id: number;
  paper_size_name: string;
  paper_type_id: number;
  paper_type_name: string;
  price_huf: number;
  is_active: boolean;
}

export interface PricingUpdate {
  id: number;
  price_huf: number;
  is_active: boolean;
}

export interface ShopOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal_huf: number;
  shipping_cost_huf: number;
  total_huf: number;
  status: string;
  delivery_method: string;
  items_count: number;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
}

export interface ShopOrderDetail extends ShopOrder {
  shipping_address: string | null;
  shipping_notes: string | null;
  tracking_number: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  items: ShopOrderItemDetail[];
}

export interface ShopOrderItemDetail {
  id: number;
  paper_size_name: string;
  paper_type_name: string;
  unit_price_huf: number;
  quantity: number;
  subtotal_huf: number;
  photo_url: string;
  photo_filename: string;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  total_revenue_huf: number;
  this_month_revenue_huf: number;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerWebshopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/partner/webshop`;

  // Settings
  getSettings(): Observable<{ settings: ShopSettings | null }> {
    return this.http.get<{ settings: ShopSettings | null }>(`${this.baseUrl}/settings`);
  }

  updateSettings(data: Partial<ShopSettings>): Observable<{ settings: ShopSettings; message: string }> {
    return this.http.put<{ settings: ShopSettings; message: string }>(`${this.baseUrl}/settings`, data);
  }

  initializeWebshop(): Observable<{ settings: ShopSettings; message: string }> {
    return this.http.post<{ settings: ShopSettings; message: string }>(`${this.baseUrl}/initialize`, {});
  }

  // Paper Sizes
  getPaperSizes(): Observable<{ paper_sizes: PaperSize[] }> {
    return this.http.get<{ paper_sizes: PaperSize[] }>(`${this.baseUrl}/paper-sizes`);
  }

  createPaperSize(data: Partial<PaperSize>): Observable<{ paper_size: PaperSize }> {
    return this.http.post<{ paper_size: PaperSize }>(`${this.baseUrl}/paper-sizes`, data);
  }

  updatePaperSize(id: number, data: Partial<PaperSize>): Observable<{ paper_size: PaperSize }> {
    return this.http.put<{ paper_size: PaperSize }>(`${this.baseUrl}/paper-sizes/${id}`, data);
  }

  deletePaperSize(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/paper-sizes/${id}`);
  }

  // Paper Types
  getPaperTypes(): Observable<{ paper_types: PaperType[] }> {
    return this.http.get<{ paper_types: PaperType[] }>(`${this.baseUrl}/paper-types`);
  }

  createPaperType(data: Partial<PaperType>): Observable<{ paper_type: PaperType }> {
    return this.http.post<{ paper_type: PaperType }>(`${this.baseUrl}/paper-types`, data);
  }

  updatePaperType(id: number, data: Partial<PaperType>): Observable<{ paper_type: PaperType }> {
    return this.http.put<{ paper_type: PaperType }>(`${this.baseUrl}/paper-types/${id}`, data);
  }

  deletePaperType(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/paper-types/${id}`);
  }

  // Products (pricing matrix)
  getProducts(): Observable<{ products: ShopProduct[]; paper_sizes: PaperSize[]; paper_types: PaperType[] }> {
    return this.http.get<{ products: ShopProduct[]; paper_sizes: PaperSize[]; paper_types: PaperType[] }>(`${this.baseUrl}/products`);
  }

  bulkUpdatePricing(updates: PricingUpdate[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/products/pricing`, { products: updates });
  }

  toggleProductStatus(id: number): Observable<{ product: ShopProduct }> {
    return this.http.patch<{ product: ShopProduct }>(`${this.baseUrl}/products/${id}/toggle`, {});
  }

  // Orders
  getOrders(params?: Record<string, string>): Observable<{ orders: ShopOrder[]; total: number }> {
    return this.http.get<{ orders: ShopOrder[]; total: number }>(`${this.baseUrl}/orders`, { params });
  }

  getOrder(id: number): Observable<{ order: ShopOrderDetail }> {
    return this.http.get<{ order: ShopOrderDetail }>(`${this.baseUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string, data?: Record<string, string>): Observable<{ order: ShopOrder; message: string }> {
    return this.http.patch<{ order: ShopOrder; message: string }>(`${this.baseUrl}/orders/${id}/status`, { status, ...data });
  }

  getOrderStats(): Observable<{ stats: OrderStats }> {
    return this.http.get<{ stats: OrderStats }>(`${this.baseUrl}/orders/stats`);
  }
}
