export interface StripeSettings {
  has_public_key: boolean;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
  stripe_enabled: boolean;
  webhook_url: string;
}

export interface UpdateStripeSettingsPayload {
  stripe_public_key?: string | null;
  stripe_secret_key?: string | null;
  stripe_webhook_secret?: string | null;
  stripe_enabled?: boolean;
}
