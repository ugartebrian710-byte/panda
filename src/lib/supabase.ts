import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { EDITIONS, INITIAL_REVIEWS } from '../data/catalog';
import type {
  ContactMessagePayload,
  Edition,
  NewOrderPayload,
  OrderRecord,
  OrderStatus,
  ReviewItem,
  SubscriberRecord,
  TrafficEventRecord,
  UserProfile,
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
const STORAGE_SUBSCRIBERS_KEY = 'mistandturf_subscribers_v1';
const STORAGE_TRAFFIC_KEY = 'mistandturf_traffic_v1';
const STORAGE_EDITIONS_KEY = 'mistandturf_editions_v1';

const DEMO_ORDERS: OrderRecord[] = [
  {
    id: 'demo-1',
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
    customer_name: 'Callum Henderson',
    customer_email: 'callum@example.co.uk',
    customer_phone: '+44 7700 900123',
    promo_code: null,
    payment_method: 'Card ending 4242',
    payment_status: 'pending_gateway',
    traffic_source: 'tiktok',
    utm_campaign: 'matchday_drop_uk',
    ttclid: 'tt_demo_9182',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    tracking_number: 'MT-739204',
    status: 'Order Confirmed',
    bundle_title: 'Buy 3, Get 25% Off + Free Gift',
    selected_editions: [
      'The #7 Legend (Ronaldo)',
      'The World Crown (World Cup)',
      'The Golden Boot',
    ],
    addons: ['60-Day Extended Warranty'],
    shipping_method: 'express',
    destination_city: 'Austin',
    destination_country: 'United States',
    currency: 'USD',
    total_amount: 116.97,
    customer_name: 'Hannah Wright',
    customer_email: 'hannah.w@example.com',
    customer_phone: '+1 512 555 0194',
    promo_code: 'MIST5',
    payment_method: 'Apple Pay',
    payment_status: 'pending_gateway',
    traffic_source: 'tiktok',
    utm_campaign: 'creators_pitch_02',
    ttclid: 'tt_demo_4410',
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
];

function emitLocalUpdateEvent() {
  window.dispatchEvent(new CustomEvent('mistandturf:local-sync'));
}

function readLocalOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(DEMO_ORDERS));
      return DEMO_ORDERS;
    }
    const parsed = JSON.parse(raw) as OrderRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_ORDERS;
  } catch {
    return DEMO_ORDERS;
  }
}

function saveLocalOrder(order: OrderRecord): void {
  try {
    const existing = readLocalOrders();
    const updated = [order, ...existing.filter((o) => o.tracking_number !== order.tracking_number)];
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    emitLocalUpdateEvent();
  } catch {
    // Ignore storage quota errors
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

// ---------- EDITIONS (ALL 10 VERSIONS) ----------

function getSeededEditions(): Edition[] {
  return EDITIONS.map((ed) => ({
    ...ed,
    sku: `MT-ED-${String(ed.number).padStart(2, '0')}`,
    stock_quantity: 50,
    units_sold: ed.number <= 4 ? 18 - ed.number * 2 : 6,
    revenue_usd: (ed.number <= 4 ? 18 - ed.number * 2 : 6) * 43.99,
    is_active: true,
  }));
}

export async function fetchEditions(): Promise<Edition[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
        id: String(row.id),
        number: Number(row.sort_order),
        name: String(row.name),
        subtitle: String(row.subtitle),
        sku: String(row.sku),
        stock_quantity: Number(row.stock_quantity ?? 0),
        units_sold: Number(row.units_sold ?? 0),
        revenue_usd: Number(row.revenue_usd ?? 0),
        is_active: Boolean(row.is_active ?? true),
      }));
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_EDITIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Edition[];
      if (Array.isArray(parsed) && parsed.length === 10) return parsed;
    }
  } catch {
    // ignore
  }
  const seeded = getSeededEditions();
  try {
    localStorage.setItem(STORAGE_EDITIONS_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

export async function updateEditionAdmin(
  editionId: string,
  patch: { stock_quantity?: number; is_active?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  if (supabase) {
    const { error } = await supabase
      .from('editions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', editionId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const current = await fetchEditions();
  const next = current.map((e) => (e.id === editionId ? { ...e, ...patch } : e));
  try {
    localStorage.setItem(STORAGE_EDITIONS_KEY, JSON.stringify(next));
    emitLocalUpdateEvent();
  } catch {
    // ignore
  }
  return { ok: true };
}

// ---------- ORDERS ----------

export async function createOrder(
  payload: NewOrderPayload
): Promise<{ ok: boolean; order: OrderRecord; persistedTo: 'supabase' | 'local'; error?: string }> {
  const record: OrderRecord = {
    id: `local-${Date.now()}`,
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
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    shipping_address: payload.shipping_address,
    promo_code: payload.promo_code,
    payment_method: payload.payment_method,
    payment_status: payload.payment_status ?? 'pending_gateway',
    traffic_source: payload.traffic_source ?? 'direct',
    utm_campaign: payload.utm_campaign ?? null,
    ttclid: payload.ttclid ?? null,
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

  // Update local edition counters in preview mode
  try {
    const currentEds = await fetchEditions();
    const perUnitRev = payload.total_amount / Math.max(1, payload.selected_editions.length);
    const updatedEds = currentEds.map((ed) => {
      const count = payload.selected_editions.filter((n) => n === ed.name).length;
      if (count === 0) return ed;
      return {
        ...ed,
        stock_quantity: Math.max(0, (ed.stock_quantity ?? 50) - count),
        units_sold: (ed.units_sold ?? 0) + count,
        revenue_usd: Number(((ed.revenue_usd ?? 0) + perUnitRev * count).toFixed(2)),
      };
    });
    localStorage.setItem(STORAGE_EDITIONS_KEY, JSON.stringify(updatedEds));
  } catch {
    // ignore
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

export async function fetchAllOrdersAdmin(): Promise<OrderRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        id: String(row.id),
        tracking_number: String(row.tracking_number),
        status: row.status as OrderStatus,
        bundle_title: String(row.bundle_title),
        selected_editions: Array.isArray(row.selected_editions)
          ? (row.selected_editions as string[])
          : [],
        addons: Array.isArray(row.addons) ? (row.addons as string[]) : [],
        shipping_method: row.shipping_method === 'express' ? 'express' : 'standard',
        destination_city: String((row.shipping_address as Record<string, unknown>)?.city ?? ''),
        destination_country: String(
          (row.shipping_address as Record<string, unknown>)?.country ?? ''
        ),
        currency: (row.currency as OrderRecord['currency']) ?? 'USD',
        total_amount: Number(row.total_amount ?? 0),
        customer_name: String(row.customer_name ?? ''),
        customer_email: String(row.customer_email ?? ''),
        customer_phone: String(row.customer_phone ?? ''),
        shipping_address: row.shipping_address as OrderRecord['shipping_address'],
        promo_code: row.promo_code ? String(row.promo_code) : null,
        payment_method: String(row.payment_method ?? ''),
        payment_status: String(row.payment_status ?? 'pending_gateway'),
        traffic_source: String(row.traffic_source ?? 'direct'),
        utm_campaign: row.utm_campaign ? String(row.utm_campaign) : null,
        ttclid: row.ttclid ? String(row.ttclid) : null,
        created_at: String(row.created_at),
      }));
    }
  }

  return readLocalOrders();
}

export async function fetchMyOrders(email: string): Promise<OrderRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('customer_email', email.trim())
      .order('created_at', { ascending: false })
      .limit(25);
    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        id: String(row.id),
        tracking_number: String(row.tracking_number),
        status: row.status as OrderStatus,
        bundle_title: String(row.bundle_title),
        selected_editions: Array.isArray(row.selected_editions)
          ? (row.selected_editions as string[])
          : [],
        addons: Array.isArray(row.addons) ? (row.addons as string[]) : [],
        shipping_method: row.shipping_method === 'express' ? 'express' : 'standard',
        destination_city: String((row.shipping_address as Record<string, unknown>)?.city ?? ''),
        destination_country: String(
          (row.shipping_address as Record<string, unknown>)?.country ?? ''
        ),
        currency: (row.currency as OrderRecord['currency']) ?? 'USD',
        total_amount: Number(row.total_amount ?? 0),
        created_at: String(row.created_at),
      }));
    }
  }
  return readLocalOrders().filter(
    (o) => o.customer_email?.toLowerCase() === email.trim().toLowerCase()
  );
}

export async function updateOrderStatusAdmin(
  trackingNumber: string,
  status: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  if (supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('tracking_number', trackingNumber);
    if (error) return { ok: false, error: error.message };
  }

  const localOrders = readLocalOrders().map((o) =>
    o.tracking_number === trackingNumber ? { ...o, status } : o
  );
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(localOrders));
    emitLocalUpdateEvent();
  } catch {
    // ignore
  }
  return { ok: true };
}

// ---------- TRAFFIC & TIKTOK ATTRIBUTION ----------

export async function logTrafficEvent(
  event: Omit<TrafficEventRecord, 'id' | 'created_at'>
): Promise<void> {
  const fullEvent: TrafficEventRecord = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    await supabase.from('traffic_events').insert([event]);
  }

  try {
    const raw = localStorage.getItem(STORAGE_TRAFFIC_KEY);
    const existing = raw ? (JSON.parse(raw) as TrafficEventRecord[]) : [];
    localStorage.setItem(STORAGE_TRAFFIC_KEY, JSON.stringify([fullEvent, ...existing].slice(0, 200)));
    emitLocalUpdateEvent();
  } catch {
    // ignore
  }
}

export async function fetchTrafficEventsAdmin(): Promise<TrafficEventRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('traffic_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (!error && Array.isArray(data)) {
      return data as TrafficEventRecord[];
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_TRAFFIC_KEY);
    if (raw) return JSON.parse(raw) as TrafficEventRecord[];
  } catch {
    // ignore
  }
  return [];
}

// ---------- NEWSLETTER POPUP SUBSCRIBERS ----------

export async function subscribeLeadEmail(input: {
  email: string;
  promo_code: string;
  traffic_source: string;
  utm_campaign?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  const record: SubscriberRecord = {
    id: `sub-${Date.now()}`,
    email: cleanEmail,
    promo_code: input.promo_code,
    traffic_source: input.traffic_source,
    utm_campaign: input.utm_campaign ?? null,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase.from('newsletter_subscribers').insert([
      {
        email: cleanEmail,
        promo_code: input.promo_code,
        traffic_source: input.traffic_source,
        utm_campaign: input.utm_campaign ?? null,
      },
    ]);
    // 23505 = unique email already subscribed — still reveal code nicely
    if (error && error.code !== '23505') {
      return { ok: false, error: error.message };
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIBERS_KEY);
    const existing = raw ? (JSON.parse(raw) as SubscriberRecord[]) : [];
    const deduped = [record, ...existing.filter((s) => s.email !== cleanEmail)];
    localStorage.setItem(STORAGE_SUBSCRIBERS_KEY, JSON.stringify(deduped));
    emitLocalUpdateEvent();
  } catch {
    // ignore
  }

  return { ok: true };
}

export async function fetchSubscribersAdmin(): Promise<SubscriberRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && Array.isArray(data)) {
      return data as SubscriberRecord[];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIBERS_KEY);
    if (raw) return JSON.parse(raw) as SubscriberRecord[];
  } catch {
    // ignore
  }
  return [];
}

// ---------- CONTACT MESSAGES ----------

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<{ ok: boolean; persistedTo: 'supabase' | 'local'; error?: string }> {
  const item: ContactMessagePayload = {
    id: `msg-${Date.now()}`,
    name: payload.name.trim(),
    email: payload.email.trim(),
    order_number: payload.order_number?.trim() || null,
    message: payload.message.trim(),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase.from('contact_messages').insert([
      {
        name: item.name,
        email: item.email,
        order_number: item.order_number,
        message: item.message,
      },
    ]);
    if (!error) {
      return { ok: true, persistedTo: 'supabase' };
    }
    return { ok: false, persistedTo: 'local', error: error.message };
  }

  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    const list = raw ? (JSON.parse(raw) as ContactMessagePayload[]) : [];
    list.unshift(item);
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(list));
    emitLocalUpdateEvent();
  } catch {
    // Ignore storage quota errors
  }
  return { ok: true, persistedTo: 'local' };
}

export async function fetchContactMessagesAdmin(): Promise<ContactMessagePayload[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && Array.isArray(data)) {
      return data as ContactMessagePayload[];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (raw) return JSON.parse(raw) as ContactMessagePayload[];
  } catch {
    // ignore
  }
  return [];
}

// ---------- REVIEWS ----------

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

// ---------- AUTH & PROFILE ----------

export async function fetchUserProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single();

    if (data) {
      return {
        id: String(data.id),
        email: String(data.email),
        full_name: data.full_name ? String(data.full_name) : null,
        role: data.role === 'admin' ? 'admin' : 'customer',
      };
    }
  }

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    role: (user.email ?? '').toLowerCase() === 'ugartebrian710@gmail.com' ? 'admin' : 'customer',
  };
}
