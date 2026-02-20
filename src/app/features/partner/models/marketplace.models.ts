/**
 * Marketplace modellek
 *
 * Interfészek a moduláris piactér rendszerhez.
 */

// =========================================================================
// Alap típusok
// =========================================================================

export type ModuleType = 'free' | 'monthly' | 'per_use';
export type ModuleCategory = 'core' | 'communication' | 'ai' | 'content' | 'business' | 'management';
export type ModuleStatus = 'ready' | 'development' | 'planned';
export type PartnerModuleStatus = 'inactive' | 'trial' | 'active' | 'paused' | 'canceling' | 'free' | 'package';
export type BillingCycle = 'monthly' | 'yearly';

// =========================================================================
// Modul
// =========================================================================

export interface MarketplaceModule {
  key: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: ModuleCategory;
  type: ModuleType;
  monthly_price: number | null;
  yearly_price: number | null;
  per_use_price: number | null;
  per_use_unit: string | null;
  depends_on: string[];
  status: ModuleStatus;
  popular: boolean;
  sort_order: number;
  cta_button: string;
  badges: string[];
  is_free: boolean;
}

export interface PartnerModule extends MarketplaceModule {
  partner_status: PartnerModuleStatus;
  activated_at: string | null;
  cancels_at: string | null;
}

// =========================================================================
// Csomag
// =========================================================================

export interface MarketplacePackage {
  key: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  included_modules: string[];
  limits_override: Record<string, number | null>;
  popular: boolean;
  sort_order: number;
  cta_button: string;
}

export interface PartnerPackage extends MarketplacePackage {
  is_active: boolean;
}

// =========================================================================
// Konfiguráció
// =========================================================================

export interface MarketplaceConfig {
  base_plan: {
    name: string;
    monthly_price: number;
    yearly_price: number;
    limits: Record<string, number | null>;
  };
  modules: MarketplaceModule[];
  packages: MarketplacePackage[];
  trial: {
    days: number;
    includes_all_modules: boolean;
  };
  free_modules: string[];
}

// =========================================================================
// API válaszok
// =========================================================================

export interface ModulesResponse {
  modules: PartnerModule[];
  summary: {
    total_modules: number;
    active_count: number;
    monthly_module_cost: number;
    active_package: string | null;
  };
}

export interface PackagesResponse {
  packages: PartnerPackage[];
  current_package: string | null;
}

export interface ModuleActionResponse {
  success: boolean;
  message: string;
  module: {
    key: string;
    status: string;
    activated_at?: string;
    cancels_at?: string;
    paused_at?: string;
  };
}

export interface PackageActionResponse {
  success: boolean;
  message: string;
  package: {
    key: string;
    status: string;
    activated_at?: string;
    included_modules_count?: number;
  };
}

// =========================================================================
// Használat
// =========================================================================

export interface UsageModuleSummary {
  module_key: string;
  module_name: string;
  unit: string;
  unit_price: number;
  total_quantity: number;
  total_cost: number;
}

export interface UsageResponse {
  period: {
    start: string;
    end: string;
  };
  modules: UsageModuleSummary[];
  total_per_use_cost: number;
  monthly_overview: {
    base_or_package: number;
    extra_modules: number;
    per_use_cost: number;
    estimated_total: number;
  };
}

// =========================================================================
// Checkout
// =========================================================================

export interface MarketplaceCheckoutRequest {
  email: string;
  name: string;
  password: string;
  billing_cycle: BillingCycle;
  company_name?: string;
  tax_number?: string;
  phone?: string;
  billing_postal_code?: string;
  billing_city?: string;
  billing_address?: string;
  is_desktop?: boolean;
  package_key?: string;
  module_keys?: string[];
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface CheckoutCompleteResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  partner: {
    id: number;
    active_package: string | null;
    trial_ends_at: string | null;
  };
  already_registered?: boolean;
}

// =========================================================================
// Admin
// =========================================================================

export interface MarketplaceStats {
  total_partners: number;
  active_subscriptions: number;
  in_trial: number;
  modules_popularity: Array<{
    key: string;
    name: string;
    active_count: number;
    monthly_price: number;
  }>;
  packages_distribution: Record<string, number>;
  trial_conversion_rate: number;
}
