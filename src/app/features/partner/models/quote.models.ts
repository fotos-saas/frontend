/**
 * Árajánlat modellek
 */

export type QuoteStatus = 'template' | 'draft' | 'sent' | 'accepted' | 'rejected';

export interface ContentItem {
  title: string;
  description?: string;
}

export interface PriceListItem {
  size: string;
  description?: string;
  price: number;
}

export interface VolumeDiscount {
  min_quantity: number;
  discount_percent: number;
}

export interface Quote {
  id: number;
  tablo_partner_id: number | null;
  status: QuoteStatus;
  template_name: string | null;
  customer_name: string;
  customer_title: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  quote_date: string;
  quote_number: string;
  quote_type: string | null;
  quote_category: 'custom' | 'photographer' | null;
  size: string | null;
  intro_text: string | null;
  content_items: ContentItem[] | null;
  price_list_items: PriceListItem[] | null;
  volume_discounts: VolumeDiscount[] | null;
  is_full_execution: boolean;
  has_small_tablo: boolean;
  has_shipping: boolean;
  has_production: boolean;
  base_price: number;
  discount_price: number;
  small_tablo_price: number;
  shipping_price: number;
  production_price: number;
  small_tablo_text: string | null;
  production_text: string | null;
  discount_text: string | null;
  notes: string | null;
  valid_until: string | null;
  emails_count?: number;
  emails?: QuoteEmail[];
  created_at: string;
  updated_at: string;
}

export interface QuoteEmail {
  id: number;
  quote_id: number;
  to_email: string;
  subject: string;
  body_html: string;
  smtp_source: string;
  sent_at: string;
}

export interface QuoteTemplate {
  id: number;
  template_name: string;
  quote_category: string | null;
  quote_type: string | null;
  base_price: number;
  discount_price: number;
}

export interface EmailSnippet {
  id: number;
  name: string;
  slug: string;
  subject: string;
  content: string;
}

/** Státusz konfigurációk a UI-hoz */
export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bgClass: string }> = {
  template: { label: 'Sablon', color: 'gray', bgClass: 'bg-gray-100 text-gray-700' },
  draft: { label: 'Piszkozat', color: 'amber', bgClass: 'bg-amber-100 text-amber-700' },
  sent: { label: 'Elküldve', color: 'blue', bgClass: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Elfogadva', color: 'green', bgClass: 'bg-green-100 text-green-700' },
  rejected: { label: 'Elutasítva', color: 'red', bgClass: 'bg-red-100 text-red-700' },
};
