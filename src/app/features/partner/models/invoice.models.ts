export type InvoiceProvider = 'szamlazz_hu' | 'billingo';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
export type InvoiceType = 'invoice' | 'proforma' | 'deposit' | 'cancellation';

export interface InvoiceSettings {
  invoice_provider: InvoiceProvider;
  invoice_enabled: boolean;
  has_api_key: boolean;
  szamlazz_bank_name: string | null;
  szamlazz_bank_account: string | null;
  szamlazz_reply_email: string | null;
  billingo_block_id: string | null;
  billingo_bank_account_id: string | null;
  invoice_prefix: string;
  invoice_currency: string;
  invoice_language: string;
  invoice_due_days: number;
  invoice_vat_percentage: number;
  invoice_comment: string | null;
  invoice_eu_vat: boolean;
}

export interface Invoice {
  id: number;
  tablo_partner_id: number;
  tablo_project_id: number | null;
  tablo_contact_id: number | null;
  provider: InvoiceProvider;
  external_id: string | null;
  invoice_number: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  fulfillment_date: string;
  paid_at: string | null;
  currency: string;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  vat_percentage: number;
  customer_name: string;
  customer_email: string | null;
  customer_tax_number: string | null;
  customer_address: string | null;
  pdf_path: string | null;
  comment: string | null;
  internal_note: string | null;
  synced_at: string | null;
  created_at: string;
  project?: { id: number; name: string } | null;
  contact?: { id: number; name: string } | null;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  net_amount: number;
  vat_percentage: number;
  vat_amount: number;
  gross_amount: number;
}

export interface InvoiceStatistics {
  total_count: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  total_gross: number;
  paid_gross: number;
  pending_gross: number;
  overdue_gross: number;
}

export interface CreateInvoicePayload {
  type: InvoiceType;
  issue_date: string;
  due_date: string;
  fulfillment_date: string;
  customer_name: string;
  customer_email?: string;
  customer_tax_number?: string;
  customer_address?: string;
  comment?: string;
  internal_note?: string;
  tablo_project_id?: number;
  tablo_contact_id?: number;
  sync_immediately: boolean;
  items: CreateInvoiceItemPayload[];
}

export interface CreateInvoiceItemPayload {
  name: string;
  quantity: number;
  unit_price: number;
  unit: string;
  description?: string;
}

export const PARTNER_INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Piszkozat',
  sent: 'Kiküldve',
  paid: 'Fizetve',
  cancelled: 'Sztornózva',
  overdue: 'Lejárt',
};

export const PARTNER_INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  paid: '#22c55e',
  cancelled: '#ef4444',
  overdue: '#f97316',
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  invoice: 'Számla',
  proforma: 'Díjbekérő',
  deposit: 'Előlegszámla',
  cancellation: 'Sztornó számla',
};

export const INVOICE_PROVIDER_LABELS: Record<InvoiceProvider, string> = {
  szamlazz_hu: 'Számlázz.hu',
  billingo: 'Billingo',
};
