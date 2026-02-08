import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopConfig {
  welcome_message: string | null;
  min_order_amount_huf: number;
  shipping_cost_huf: number;
  shipping_free_threshold_huf: number | null;
  allow_pickup: boolean;
  allow_shipping: boolean;
  terms_text: string | null;
}

export interface ShopProductPublic {
  id: number;
  paper_size_name: string;
  paper_type_name: string;
  width_cm: number;
  height_cm: number;
  price_huf: number;
}

export interface ShopPhoto {
  id: number;
  name: string;
  title: string;
  original_url: string;
  thumb_url: string;
  preview_url: string;
}

export interface CheckoutRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_method: 'pickup' | 'shipping';
  shipping_address?: string;
  shipping_notes?: string;
  customer_notes?: string;
  items: CheckoutItem[];
}

export interface CheckoutItem {
  product_id: number;
  media_id: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClientWebshopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/shop`;

  getConfig(token: string): Observable<{ config: ShopConfig; source_type: string; source_name: string }> {
    return this.http.get<{ config: ShopConfig; source_type: string; source_name: string }>(`${this.baseUrl}/${token}/config`);
  }

  getProducts(token: string): Observable<{ products: ShopProductPublic[] }> {
    return this.http.get<{ products: ShopProductPublic[] }>(`${this.baseUrl}/${token}/products`);
  }

  getPhotos(token: string): Observable<{ photos: ShopPhoto[] }> {
    return this.http.get<{ photos: ShopPhoto[] }>(`${this.baseUrl}/${token}/photos`);
  }

  createCheckout(token: string, data: CheckoutRequest): Observable<{ checkout_url: string; order_number: string }> {
    return this.http.post<{ checkout_url: string; order_number: string }>(`${this.baseUrl}/${token}/checkout`, data);
  }
}
