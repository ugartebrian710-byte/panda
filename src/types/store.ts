export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type LanguageCode = 'EN' | 'ES' | 'FR' | 'DE' | 'PT';

export interface Edition {
  id: string;
  number: number;
  name: string;
  subtitle: string;
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

export interface OrderRecord {
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
}

export interface NewOrderPayload {
  tracking_number: string;
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
  status: OrderStatus;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  order_number?: string;
  message: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  stateLabel: string;
  postalLabel: string;
}
