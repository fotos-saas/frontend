export type PartnerServiceType = 'photo_change' | 'extra_retouch' | 'late_fee' | 'rush_fee' | 'additional_copy' | 'custom';

export interface PartnerService {
  id: number;
  name: string;
  description: string | null;
  service_type: PartnerServiceType;
  default_price: number;
  currency: string;
  vat_percentage: number;
  is_active: boolean;
  sort_order: number;
}

export interface CreatePartnerServicePayload {
  name: string;
  description?: string;
  service_type: PartnerServiceType;
  default_price: number;
  currency?: string;
  vat_percentage?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdatePartnerServicePayload {
  name?: string;
  description?: string;
  service_type?: PartnerServiceType;
  default_price?: number;
  currency?: string;
  vat_percentage?: number;
  is_active?: boolean;
  sort_order?: number;
}

export const SERVICE_TYPE_LABELS: Record<PartnerServiceType, string> = {
  photo_change: 'Képcsere',
  extra_retouch: 'Extra retusálás',
  late_fee: 'Késedelmi díj',
  rush_fee: 'Sürgősségi díj',
  additional_copy: 'Plusz példány',
  custom: 'Egyedi',
};

export const SERVICE_TYPE_OPTIONS: { value: PartnerServiceType; label: string }[] = [
  { value: 'photo_change', label: 'Képcsere' },
  { value: 'extra_retouch', label: 'Extra retusálás' },
  { value: 'late_fee', label: 'Késedelmi díj' },
  { value: 'rush_fee', label: 'Sürgősségi díj' },
  { value: 'additional_copy', label: 'Plusz példány' },
  { value: 'custom', label: 'Egyedi' },
];
