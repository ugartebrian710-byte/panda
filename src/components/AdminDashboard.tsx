import {
  Activity,
  ArrowLeft,
  Box,
  CheckCircle2,
  ExternalLink,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../data/catalog';
import { forceSetAttributionForTest, getOrCreateSessionId } from '../lib/attribution';
import {
  fetchAllOrdersAdmin,
  fetchContactMessagesAdmin,
  fetchEditions,
  fetchSubscribersAdmin,
  fetchTrafficEventsAdmin,
  isSupabaseConfigured,
  logTrafficEvent,
  supabase,
  updateEditionAdmin,
  updateOrderStatusAdmin,
} from '../lib/supabase';
import type {
  ContactMessagePayload,
  CurrencyCode,
  Edition,
  OrderRecord,
  OrderStatus,
  SubscriberRecord,
  TrafficEventRecord,
  UserProfile,
} from '../types/store';

interface AdminDashboardProps {
  profile: UserProfile | null;
  currency: CurrencyCode;
  onExitAdmin: () => void;
  onOpenAuth: () => void;
  onEditionsUpdated: (editions: Edition[]) => void;
}

type AdminTab = 'orders' | 'editions' | 'traffic' | 'inbox';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Confirmed',
  'Hand-Painted & Packed',
  'Dispatched',
  'In Transit',
  'Delivered',
];

export function AdminDashboard({
  profile,
  currency,
  onExitAdmin,
  onOpenAuth,
  onEditionsUpdated,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEventRecord[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessagePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeLive, setRealtimeLive] = useState(false);
  const [lastPing, setLastPing] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canAccessAdmin = !isSupabaseConfigured || profile?.role === 'admin';

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    const [ordList, edList, trafList, subList, msgList] = await Promise.all([
      fetchAllOrdersAdmin(),
      fetchEditions(),
      fetchTrafficEventsAdmin(),
      fetchSubscribersAdmin(),
      fetchContactMessagesAdmin(),
    ]);
    setOrders(ordList);
    setEditions(edList);
    onEditionsUpdated(edList);
    setTrafficEvents(trafList);
    setSubscribers(subList);
    setMessages(msgList);
    setLastPing(new Date().toLocaleTimeString());
    setLoading(false);
  }, [onEditionsUpdated]);

  useEffect(() => {
    if (!canAccessAdmin) {
      setLoading(false);
      return;
    }
    void loadAllAdminData();
  }, [canAccessAdmin, loadAllAdminData]);

  // Real-time subscriptions (Supabase Realtime + local browser sync)
  useEffect(() => {
    if (!canAccessAdmin) return;

    const handleLocalSync = () => {
      void loadAllAdminData();
    };
    window.addEventListener('mistandturf:local-sync', handleLocalSync);

    if (!supabase) {
      setRealtimeLive(true);
      return () => {
        window.removeEventListener('mistandturf:local-sync', handleLocalSync);
      };
    }

    const channel = supabase
      .channel('mistandturf-admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setToastMsg('New live order received!');
            window.setTimeout(() => setToastMsg(null), 5000);
          }
          void loadAllAdminData();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'editions' }, () => {
        void loadAllAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_events' }, () => {
        void loadAllAdminData();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'newsletter_subscribers' },
        () => {
          void loadAllAdminData();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        void loadAllAdminData();
      })
      .subscribe((status) => {
        setRealtimeLive(status === 'SUBSCRIBED');
      });

    return () => {
      window.removeEventListener('mistandturf:local-sync', handleLocalSync);
      void supabase?.removeChannel(channel);
    };
  }, [canAccessAdmin, loadAllAdminData]);

  const handleStatusChange = async (trackingNumber: string, nextStatus: OrderStatus) => {
    const res = await updateOrderStatusAdmin(trackingNumber, nextStatus);
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.tracking_number === trackingNumber ? { ...o, status: nextStatus } : o))
      );
      setToastMsg(`Updated ${trackingNumber} → ${nextStatus}`);
      window.setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleStockChange = async (editionId: string, nextStock: number) => {
    const safeStock = Math.max(0, Math.floor(nextStock));
    const res = await updateEditionAdmin(editionId, { stock_quantity: safeStock });
    if (res.ok) {
      const updated = editions.map((e) =>
        e.id === editionId ? { ...e, stock_quantity: safeStock } : e
      );
      setEditions(updated);
      onEditionsUpdated(updated);
    }
  };

  const handleToggleEditionActive = async (edition: Edition) => {
    const nextActive = !(edition.is_active ?? true);
    const res = await updateEditionAdmin(edition.id, { is_active: nextActive });
    if (res.ok) {
      const updated = editions.map((e) =>
        e.id === edition.id ? { ...e, is_active: nextActive } : e
      );
      setEditions(updated);
      onEditionsUpdated(updated);
    }
  };

  const handleSimulateTikTokVisit = async () => {
    const tested = forceSetAttributionForTest('tiktok', 'matchday_launch_tt');
    await logTrafficEvent({
      session_id: getOrCreateSessionId(),
      source: tested.source,
      utm_medium: tested.utm_medium,
      utm_campaign: tested.utm_campaign,
      utm_content: tested.utm_content,
      ttclid: tested.ttclid,
      referrer: tested.referrer,
      landing_path: tested.landing_path,
      event_type: 'page_view',
    });
    setToastMsg('Simulated TikTok ad click logged! Any order placed now is tagged TikTok.');
    window.setTimeout(() => setToastMsg(null), 4000);
    void loadAllAdminData();
  };

  const totalRevenueUsd = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  const tiktokOrdersCount = useMemo(
    () => orders.filter((o) => (o.traffic_source ?? 'direct').toLowerCase() === 'tiktok').length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      const src = (o.traffic_source ?? 'direct').toLowerCase();
      if (sourceFilter !== 'ALL' && src !== sourceFilter) return false;
      return true;
    });
  }, [orders, statusFilter, sourceFilter]);

  const trafficBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { source: string; visits: number; signups: number; orders: number; revenue: number }
    >();

    const ensure = (src: string) => {
      const key = (src || 'direct').toLowerCase();
      if (!map.has(key)) {
        map.set(key, { source: key, visits: 0, signups: 0, orders: 0, revenue: 0 });
      }
      return map.get(key)!;
    };

    for (const ev of trafficEvents) {
      if (ev.event_type === 'page_view') {
        ensure(ev.source).visits += 1;
      }
    }
    for (const sub of subscribers) {
      ensure(sub.traffic_source).signups += 1;
    }
    for (const ord of orders) {
      const row = ensure(ord.traffic_source ?? 'direct');
      row.orders += 1;
      row.revenue += Number(ord.total_amount || 0);
    }

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.visits - a.visits);
  }, [trafficEvents, subscribers, orders]);

  // Access Gate when Supabase IS configured and user is not an admin
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase text-[#111111]">
            Admin Sign-In Required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your Mist &amp; Turf admin account (
            <span className="font-semibold text-[#111111]">ugartebrian710@gmail.com</span>) to
            access live orders, TikTok traffic analytics, and all 10 editions.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] cursor-pointer"
            >
              Sign In as Admin
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
            >
              ← Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111111]">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Storefront</span>
            </button>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-[#111111]">
                Mist &amp; Turf Admin Console
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Activity className="h-3 w-3" />
                  {isSupabaseConfigured
                    ? realtimeLive
                      ? 'Supabase Realtime Live'
                      : 'Connecting Realtime...'
                    : 'Local Preview Sync Active'}
                </span>
                {lastPing && <span>· Updated {lastPing}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAllAdminData()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-bold text-[#111111] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {!isSupabaseConfigured && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-[#1D4ED8]">
            <strong>Preview Mode:</strong> Run the SQL in{' '}
            <code className="font-mono font-bold">supabase/schema.sql</code> and add{' '}
            <code className="font-mono font-bold">VITE_SUPABASE_URL</code> +{' '}
            <code className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> in Netlify to
            stream real customer orders across devices.
          </div>
        )}

        {toastMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">Gross Revenue</div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-extrabold text-[#111111] tabular-nums">
              {formatCurrency(totalRevenueUsd, currency)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{orders.length} total orders</div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">TikTok Attributed Orders</div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-extrabold text-[#1D4ED8] tabular-nums">
              {tiktokOrdersCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {orders.length > 0 ? Math.round((tiktokOrdersCount / orders.length) * 100) : 0}% of
              orders from TikTok
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">Active Editions</div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-extrabold text-[#111111] tabular-nums">
              {editions.filter((e) => e.is_active !== false).length} / {editions.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {editions.reduce((s, e) => s + (e.units_sold ?? 0), 0)} units sold
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="text-xs font-semibold text-slate-500">5% Popup Subscribers</div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-extrabold text-[#111111] tabular-nums">
              {subscribers.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {messages.length} contact messages
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
          {[
            { id: 'orders', label: `Live Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'editions', label: `All 10 Editions`, icon: Box },
            { id: 'traffic', label: `TikTok & Traffic (${trafficEvents.length})`, icon: TrendingUp },
            { id: 'inbox', label: `Leads & Inbox (${subscribers.length + messages.length})`, icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1D4ED8] text-white'
                    : 'border border-[#E5E7EB] bg-white text-[#111111] hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: LIVE ORDERS */}
        {activeTab === 'orders' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#111111]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#111111]">Traffic Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="ALL">All Sources</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="google">Google</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-slate-500">
                No orders match the current filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.tracking_number}
                    className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-[family-name:var(--font-mono)] text-sm font-extrabold text-[#111111]">
                            {ord.tracking_number}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              (ord.traffic_source ?? 'direct') === 'tiktok'
                                ? 'bg-[#111111] text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Source: {ord.traffic_source ?? 'direct'}
                          </span>
                          {ord.utm_campaign && (
                            <span className="text-[11px] text-slate-500">
                              Campaign: {ord.utm_campaign}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-bold text-[#111111]">
                          {ord.customer_name || 'Guest Customer'} ·{' '}
                          <span className="font-normal text-slate-600">
                            {ord.customer_email || 'No email'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Ship to: {ord.destination_city}, {ord.destination_country} ·{' '}
                          {ord.shipping_method === 'express' ? 'Express Air' : 'Standard Tracked'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="font-[family-name:var(--font-mono)] text-base font-extrabold text-[#111111] tabular-nums">
                          {formatCurrency(ord.total_amount, currency)}
                        </div>
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              ord.tracking_number,
                              e.target.value as OrderStatus
                            )
                          }
                          aria-label={`Update status for ${ord.tracking_number}`}
                          className="rounded-lg border border-[#1D4ED8] bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#1D4ED8] cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-2.5 text-xs text-slate-600">
                      <div>
                        <strong className="text-[#111111]">Editions:</strong>{' '}
                        {ord.selected_editions.join(', ') || ord.bundle_title}
                        {ord.addons.length > 0 && (
                          <span className="ml-2 text-[#1D4ED8]">
                            (+ {ord.addons.join(', ')})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ord.promo_code ? `Promo: ${ord.promo_code} · ` : ''}
                        {new Date(ord.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: ALL 10 EDITIONS */}
        {activeTab === 'editions' && (
          <section className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#111111]">
                All 10 Product Editions &amp; Live Inventory
              </h2>
              <span className="text-xs text-slate-500">
                Changes here sync directly to the storefront edition selector
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-extrabold uppercase text-slate-500 border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Edition Name</th>
                    <th className="px-4 py-3">Units Sold</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Stock Qty</th>
                    <th className="px-4 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {editions.map((ed) => {
                    const active = ed.is_active !== false;
                    return (
                      <tr key={ed.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          {ed.number}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {ed.sku ?? `MT-ED-${String(ed.number).padStart(2, '0')}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#111111]">{ed.name}</div>
                          <div className="text-[11px] text-slate-500">{ed.subtitle}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#111111] tabular-nums">
                          {ed.units_sold ?? 0}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#1D4ED8] tabular-nums">
                          {formatCurrency(ed.revenue_usd ?? 0, currency)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            value={ed.stock_quantity ?? 50}
                            onChange={(e) =>
                              void handleStockChange(ed.id, Number(e.target.value))
                            }
                            aria-label={`Stock for ${ed.name}`}
                            className="w-20 rounded-lg border border-[#E5E7EB] px-2 py-1 font-mono text-xs font-bold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleEditionActive(ed)}
                            className={`rounded-lg px-3 py-1 text-[11px] font-bold cursor-pointer ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {active ? 'Active' : 'Sold Out'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: TIKTOK & TRAFFIC ATTRIBUTION */}
        {activeTab === 'traffic' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div>
                <h2 className="text-sm font-extrabold uppercase text-[#111111]">
                  TikTok &amp; Campaign Attribution
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Share links with{' '}
                  <code className="rounded bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#1D4ED8]">
                    ?utm_source=tiktok&amp;utm_campaign=matchday_drop
                  </code>{' '}
                  or TikTok Ads <code className="font-mono">ttclid</code> to track visitors and
                  orders automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSimulateTikTokVisit()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Simulate TikTok Visit</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[11px] font-extrabold uppercase text-slate-500 border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-3">Traffic Source</th>
                      <th className="px-4 py-3">Visits</th>
                      <th className="px-4 py-3">Email Signups</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Conv. Rate</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {trafficBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          No traffic events recorded yet. Visit the storefront or click Simulate
                          TikTok Visit above.
                        </td>
                      </tr>
                    ) : (
                      trafficBreakdown.map((row) => {
                        const conv =
                          row.visits > 0
                            ? ((row.orders / row.visits) * 100).toFixed(1)
                            : '—';
                        return (
                          <tr key={row.source}>
                            <td className="px-4 py-3 font-bold uppercase text-[#111111]">
                              {row.source}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums">{row.visits}</td>
                            <td className="px-4 py-3 font-mono tabular-nums">{row.signups}</td>
                            <td className="px-4 py-3 font-mono font-bold text-[#1D4ED8] tabular-nums">
                              {row.orders}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums">
                              {conv === '—' ? '—' : `${conv}%`}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold tabular-nums">
                              {formatCurrency(row.revenue, currency)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: SUBSCRIBERS & INBOX */}
        {activeTab === 'inbox' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <h2 className="text-sm font-extrabold uppercase text-[#111111]">
                5% Off Popup Leads ({subscribers.length})
              </h2>
              <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                {subscribers.length === 0 ? (
                  <p className="text-xs text-slate-500">No email signups yet.</p>
                ) : (
                  subscribers.map((sub, i) => (
                    <div
                      key={`${sub.email}-${i}`}
                      className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#111111]">{sub.email}</div>
                        <div className="text-[11px] text-slate-500">
                          Source: {sub.traffic_source} · Code: {sub.promo_code}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <h2 className="text-sm font-extrabold uppercase text-[#111111]">
                Contact Us Messages ({messages.length})
              </h2>
              <div className="mt-3 space-y-2.5 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500">No support messages yet.</p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={`${msg.email}-${i}`}
                      className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111111]">{msg.name}</span>
                        <span className="text-[11px] text-slate-500">{msg.email}</span>
                      </div>
                      {msg.order_number && (
                        <div className="mt-0.5 font-mono text-[11px] font-bold text-[#1D4ED8]">
                          Order: {msg.order_number}
                        </div>
                      )}
                      <p className="mt-1.5 text-slate-700">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
