export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type LanguageCode = 'EN' | 'ES' | 'FR' | 'DE' | 'PT';

export interface Edition {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  sku?: string;
  stock_quantity?: number;
  units_sold?: number;
  revenue_usd?: number;
  is_active?: boolean;
}

export interface BundleTier {
  id: 'buy-1' | 'buy-2' | 'buy-3';
  quantity: 1 | 2 | 3;
  title: string;
  subtitle: string;
  priceUsd: number;
  compareAtUsd: number;
  savingsUsd: number;
  badgeText?: string;
  discountPill?: string;
}

export interface AddOnItem {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
}

export interface CartItem {
  cartKey: string;
  bundleId: BundleTier['id'];
  bundleTitle: string;
  editions: Edition[];
  addons: AddOnItem[];
  unitPriceUsd: number;
  compareAtUsd: number;
  quantity: number;
}

export interface ReviewItem {
  id: string;
  author_name: string;
  location: string;
  edition_name: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'Order Confirmed'
  | 'Hand-Painted & Packed'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered';

export interface TrafficAttribution {
  source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  ttclid: string | null;
  referrer: string | null;
  landing_path: string;
}

export interface OrderRecord {
  id?: string;
  tracking_number: string;
  status: OrderStatus;
  bundle_title: string;
  selected_editions: string[];
  addons: string[];
  shipping_method: 'standard' | 'express';
  destination_city: string;
  destination_country: string;
  currency: CurrencyCode;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: ShippingAddress;
  promo_code?: string | null;
  payment_method?: string;
  payment_status?: string;
  traffic_source?: string;
  utm_campaign?: string | null;
  ttclid?: string | null;
}

export interface NewOrderPayload {
  tracking_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  bundle_id: string;
  bundle_title: string;
  selected_editions: string[];
  addons: string[];
  shipping_method: 'standard' | 'express';
  promo_code: string | null;
  currency: CurrencyCode;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_method: string;
  payment_status?: string;
  status: OrderStatus;
  traffic_source?: string;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  ttclid?: string | null;
  referrer?: string | null;
}

export interface ContactMessagePayload {
  id?: string;
  name: string;
  email: string;
  order_number?: string | null;
  message: string;
  created_at?: string;
}

export interface SubscriberRecord {
  id?: string;
  email: string;
  promo_code: string;
  traffic_source: string;
  utm_campaign?: string | null;
  created_at: string;
}

export interface TrafficEventRecord {
  id?: string;
  session_id: string;
  source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  ttclid: string | null;
  referrer: string | null;
  landing_path: string;
  event_type: 'page_view' | 'add_to_cart' | 'checkout_start' | 'purchase';
  edition_id?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'admin';
}

export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  stateLabel: string;
  postalLabel: string;
}
