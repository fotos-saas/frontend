export type BillingChargeStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type BillingServiceType = 'photo_change' | 'extra_retouch' | 'late_fee' | 'rush_fee' | 'additional_copy' | 'custom';

export interface BillingCharge {
  id: number;
  chargeNumber: string;
  serviceType: BillingServiceType;
  serviceLabel: string;
  description: string;
  amountHuf: number;
  status: BillingChargeStatus;
  dueDate: string | null;
  paidAt: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  createdAt: string;
}

export interface BillingSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  chargesCount: number;
}

export const STATUS_LABELS: Record<BillingChargeStatus, string> = {
  pending: 'Fizetésre vár',
  paid: 'Kifizetve',
  cancelled: 'Törölve',
  refunded: 'Visszatérítve',
};

export const SERVICE_TYPE_LABELS: Record<BillingServiceType, string> = {
  photo_change: 'Képcsere',
  extra_retouch: 'Extra retusálás',
  late_fee: 'Késedelmi díj',
  rush_fee: 'Sürgősségi díj',
  additional_copy: 'Plusz példány',
  custom: 'Egyedi',
};

export const SERVICE_TYPE_ICONS: Record<BillingServiceType, string> = {
  photo_change: 'image',
  extra_retouch: 'sparkles',
  late_fee: 'clock',
  rush_fee: 'timer',
  additional_copy: 'copy',
  custom: 'settings',
};
