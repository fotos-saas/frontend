export type PrepaymentMode = 'fixed_fee' | 'deposit' | 'package';
export type PrepaymentStatus = 'pending' | 'paid' | 'used' | 'partially_used' | 'cancelled' | 'refunded' | 'forfeited' | 'expired';

export interface PrepaymentConfig {
  id: number;
  tablo_partner_id: number;
  tablo_project_id: number | null;
  is_enabled: boolean;
  mode: PrepaymentMode;
  amount_huf: number | null;
  label: string;
  description: string | null;
  is_refundable: boolean;
  refund_deadline_hours: number;
  min_order_to_apply: number;
  forfeit_if_no_order: boolean;
  payment_methods: string[];
  payment_deadline_days: number;
  reminder_schedule: number[];
  send_invoice: boolean;
  custom_terms: string | null;
  packages?: PrepaymentPackage[];
  created_at: string;
  updated_at: string;
}

export interface PrepaymentPackage {
  id: number;
  prepayment_config_id: number;
  key: string;
  name: string;
  description: string | null;
  price_huf: number;
  included_items: PackageItem[];
  allow_extras: boolean;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PackageItem {
  product_id: number;
  product_name: string;
  quantity: number;
}

export interface Prepayment {
  id: number;
  uuid: string;
  prepayment_number: string;
  tablo_partner_id: number;
  tablo_project_id: number;
  tablo_guest_session_id: number | null;
  tablo_person_id: number | null;
  prepayment_config_id: number | null;
  prepayment_package_id: number | null;
  mode: PrepaymentMode;
  status: PrepaymentStatus;
  amount_huf: number;
  amount_used: number;
  amount_remaining: number;
  amount_forfeited: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string | null;
  child_name: string | null;
  class_name: string | null;
  billing_name: string | null;
  billing_address: string | null;
  payment_method: string | null;
  paid_at: string | null;
  payment_deadline: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  applied_at: string | null;
  package_fulfilled_at: string | null;
  notes: string | null;
  config?: PrepaymentConfig;
  package?: PrepaymentPackage;
  person?: { id: number; name: string; class_name: string | null };
  project?: { id: number; name: string };
  events?: PrepaymentEvent[];
  applied_order?: { id: number; order_number: string };
  created_at: string;
  updated_at: string;
}

export interface PrepaymentEvent {
  id: number;
  prepayment_id: number;
  event_type: string;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  creator?: { id: number; name: string };
  created_at: string;
}

export interface PrepaymentStats {
  total_collected: number;
  total_used: number;
  total_pending: number;
  total_forfeited: number;
  total_refunded: number;
  conversion_rate: number;
  by_mode: Record<string, { count: number; total: number }>;
  total_count: number;
}

export interface PrepaymentSummary {
  total: number;
  pending: number;
  paid: number;
  total_collected: number;
  total_pending: number;
}

export const PREPAYMENT_STATUS_LABELS: Record<PrepaymentStatus, string> = {
  pending: 'Fizetésre vár',
  paid: 'Fizetve',
  used: 'Felhasználva',
  partially_used: 'Részben felhasználva',
  cancelled: 'Sztornózva',
  refunded: 'Visszatérítve',
  forfeited: 'Elveszett',
  expired: 'Lejárt',
};

export const PREPAYMENT_MODE_LABELS: Record<PrepaymentMode, string> = {
  fixed_fee: 'Fix díj',
  deposit: 'Előleg',
  package: 'Csomag',
};

export const PREPAYMENT_STATUS_COLORS: Record<PrepaymentStatus, string> = {
  pending: 'amber',
  paid: 'green',
  used: 'blue',
  partially_used: 'cyan',
  cancelled: 'gray',
  refunded: 'orange',
  forfeited: 'red',
  expired: 'gray',
};
