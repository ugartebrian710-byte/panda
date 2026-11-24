import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_REVIEWS } from '../data/catalog';
import type {
  ContactMessagePayload,
  NewOrderPayload,
  OrderRecord,
  ReviewItem,
} from '../types/store';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_ORDERS_KEY = 'mistandturf_orders_v1';
const STORAGE_REVIEWS_KEY = 'mistandturf_reviews_v1';
const STORAGE_MESSAGES_KEY = 'mistandturf_messages_v1';

const DEMO_ORDER: OrderRecord = {
  tracking_number: 'MT-482910',
  status: 'In Transit',
  bundle_title: 'Buy 2, Get 15% Off + Free Gift',
  selected_editions: ['The Grand Stadium', 'The #10 Maestro (Messi)'],
  addons: ['Backflow Mist Cone Pack'],
  shipping_method: 'standard',
  destination_city: 'London',
  destination_country: 'United Kingdom',
  currency: 'USD',
  total_amount: 89.98,
  created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
};

function readLocalOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [DEMO_ORDER];
    const parsed = JSON.parse(raw) as OrderRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEMO_ORDER];
  } catch {
    return [DEMO_ORDER];
  }
}

function saveLocalOrder(order: OrderRecord): void {
  try {
    const existing = readLocalOrders();
    const updated = [order, ...existing.filter((o) => o.tracking_number !== order.tracking_number)];
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MT-${suffix}`;
}

export async function createOrder(
  payload: NewOrderPayload
): Promise<{ ok: boolean; order: OrderRecord; persistedTo: 'supabase' | 'local'; error?: string }> {
  const record: OrderRecord = {
    tracking_number: payload.tracking_number,
    status: payload.status,
    bundle_title: payload.bundle_title,
    selected_editions: payload.selected_editions,
    addons: payload.addons,
    shipping_method: payload.shipping_method,
    destination_city: payload.shipping_address.city,
    destination_country: payload.shipping_address.country,
    currency: payload.currency,
    total_amount: payload.total_amount,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase.from('orders').insert([payload]);
    if (!error) {
      saveLocalOrder(record);
      return { ok: true, order: record, persistedTo: 'supabase' };
    }
    saveLocalOrder(record);
    return {
      ok: true,
      order: record,
      persistedTo: 'local',
      error: error.message,
    };
  }

  saveLocalOrder(record);
  return { ok: true, order: record, persistedTo: 'local' };
}

export async function lookupOrderByTracking(
  trackingInput: string
): Promise<{ order: OrderRecord | null; source: 'supabase' | 'local' }> {
  const normalized = trackingInput.trim().toUpperCase();
  if (!normalized) return { order: null, source: 'local' };

  if (supabase) {
    const { data, error } = await supabase.rpc('lookup_order_status', {
      p_tracking_number: normalized,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as Record<string, unknown>;
      return {
        order: {
          tracking_number: String(row.tracking_number ?? normalized),
          status: (row.status as OrderRecord['status']) ?? 'Order Confirmed',
          bundle_title: String(row.bundle_title ?? ''),
          selected_editions: Array.isArray(row.selected_editions)
            ? (row.selected_editions as string[])
            : [],
          addons: Array.isArray(row.addons) ? (row.addons as string[]) : [],
          shipping_method: row.shipping_method === 'express' ? 'express' : 'standard',
          destination_city: String(row.destination_city ?? ''),
          destination_country: String(row.destination_country ?? ''),
          currency: (row.currency as OrderRecord['currency']) ?? 'USD',
          total_amount: Number(row.total_amount ?? 0),
          created_at: String(row.created_at ?? new Date().toISOString()),
        },
        source: 'supabase',
      };
    }
  }

  const localOrders = readLocalOrders();
  const match = localOrders.find((o) => o.tracking_number.toUpperCase() === normalized) ?? null;
  return { order: match, source: 'local' };
}

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<{ ok: boolean; persistedTo: 'supabase' | 'local'; error?: string }> {
  if (supabase) {
    const { error } = await supabase.from('contact_messages').insert([
      {
        name: payload.name.trim(),
        email: payload.email.trim(),
        order_number: payload.order_number?.trim() || null,
        message: payload.message.trim(),
      },
    ]);
    if (!error) {
      return { ok: true, persistedTo: 'supabase' };
    }
    return { ok: false, persistedTo: 'local', error: error.message };
  }

  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.unshift({ ...payload, created_at: new Date().toISOString() });
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
  return { ok: true, persistedTo: 'local' };
}

function readLocalReviews(): ReviewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (!raw) return INITIAL_REVIEWS;
    const custom = JSON.parse(raw) as ReviewItem[];
    if (!Array.isArray(custom)) return INITIAL_REVIEWS;
    return [...custom, ...INITIAL_REVIEWS];
  } catch {
    return INITIAL_REVIEWS;
  }
}

export async function fetchReviews(): Promise<{
  reviews: ReviewItem[];
  source: 'supabase' | 'local';
}> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data)) {
      const dbReviews = data as ReviewItem[];
      const combined = [...dbReviews, ...INITIAL_REVIEWS];
      return { reviews: combined, source: 'supabase' };
    }
  }

  return { reviews: readLocalReviews(), source: 'local' };
}

export async function createReview(input: {
  author_name: string;
  location: string;
  edition_name: string;
  rating: number;
  title: string;
  body: string;
}): Promise<{ ok: boolean; review: ReviewItem; persistedTo: 'supabase' | 'local' }> {
  const localItem: ReviewItem = {
    id: `local-${Date.now()}`,
    author_name: input.author_name.trim(),
    location: input.location.trim() || 'Worldwide',
    edition_name: input.edition_name,
    rating: input.rating,
    title: input.title.trim(),
    body: input.body.trim(),
    verified_purchase: false,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          author_name: localItem.author_name,
          location: localItem.location,
          edition_name: localItem.edition_name,
          rating: localItem.rating,
          title: localItem.title,
          body: localItem.body,
          verified_purchase: false,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return { ok: true, review: data as ReviewItem, persistedTo: 'supabase' };
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    const existing = raw ? (JSON.parse(raw) as ReviewItem[]) : [];
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify([localItem, ...existing]));
  } catch {
    // Ignore storage quota errors
  }
  return { ok: true, review: localItem, persistedTo: 'local' };
}
