import { Check, PackageSearch } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { formatCurrency, TRANSLATIONS } from '../data/catalog';
import { lookupOrderByTracking } from '../lib/supabase';
import type { CurrencyCode, LanguageCode, OrderRecord, OrderStatus } from '../types/store';

interface TrackOrderSectionProps {
  language: LanguageCode;
  currency: CurrencyCode;
  prefilledTracking?: string | null;
}

const TIMELINE_STEPS: OrderStatus[] = [
  'Order Confirmed',
  'Hand-Painted & Packed',
  'Dispatched',
  'In Transit',
  'Delivered',
];

export function TrackOrderSection({
  language,
  currency,
  prefilledTracking,
}: TrackOrderSectionProps) {
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<OrderRecord | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const t = TRANSLATIONS[language];

  const executeLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearchedOnce(true);
    const { order } = await lookupOrderByTracking(trimmed);
    setFoundOrder(order);
    setLoading(false);
  };

  useEffect(() => {
    if (prefilledTracking) {
      setTrackingInput(prefilledTracking);
      void executeLookup(prefilledTracking);
    }
  }, [prefilledTracking]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await executeLookup(trackingInput);
  };

  const activeStepIndex = foundOrder
    ? Math.max(0, TIMELINE_STEPS.indexOf(foundOrder.status))
    : -1;

  return (
    <section id="track-order" className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-2.5">
          <PackageSearch className="h-5 w-5 text-[#1D4ED8]" />
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#111111] uppercase">
            {t.trackTitle}
          </h2>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">
          Enter your Mist &amp; Turf order code (for example,{' '}
          <button
            type="button"
            onClick={() => {
              setTrackingInput('MT-482910');
              void executeLookup('MT-482910');
            }}
            className="font-[family-name:var(--font-mono)] font-bold text-[#1D4ED8] underline underline-offset-2 cursor-pointer"
          >
            MT-482910
          </button>
          ) to view live dispatch status.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            placeholder="MT-XXXXXX"
            aria-label="Tracking number"
            className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 font-[family-name:var(--font-mono)] text-sm uppercase text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#111111] px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Checking...' : t.trackBtn}
          </button>
        </form>

        {searchedOnce && !loading && !foundOrder && (
          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-slate-600">
            No order found for{' '}
            <span className="font-[family-name:var(--font-mono)] font-bold text-[#111111]">
              {trackingInput.toUpperCase()}
            </span>
            . Double-check your tracking number or test sample code{' '}
            <span className="font-[family-name:var(--font-mono)] font-semibold">MT-482910</span>.
          </div>
        )}

        {foundOrder && (
          <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
              <div>
                <div className="text-xs font-semibold text-slate-500">Tracking Number</div>
                <div className="font-[family-name:var(--font-mono)] text-base font-bold text-[#111111]">
                  {foundOrder.tracking_number}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500">Current Status</div>
                <div className="text-sm font-extrabold text-[#1D4ED8]">{foundOrder.status}</div>
              </div>
            </div>

            {/* 5-Stage Visual Timeline */}
            <ol className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {TIMELINE_STEPS.map((step, idx) => {
                const completed = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <li
                    key={step}
                    className={`flex sm:flex-col items-center sm:items-start gap-2.5 rounded-lg border p-2.5 ${
                      isCurrent
                        ? 'border-[#1D4ED8] bg-white'
                        : completed
                        ? 'border-blue-200 bg-blue-50/40'
                        : 'border-[#E5E7EB] bg-white/60 opacity-60'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        completed
                          ? 'bg-[#1D4ED8] text-white'
                          : 'border border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : idx + 1}
                    </span>
                    <span className="text-xs font-bold leading-snug text-[#111111]">{step}</span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-3 text-xs text-slate-600">
              <span>
                <strong className="text-[#111111]">Items:</strong>{' '}
                {foundOrder.selected_editions.join(', ') || foundOrder.bundle_title}
              </span>
              <span>
                <strong className="text-[#111111]">Destination:</strong>{' '}
                {[foundOrder.destination_city, foundOrder.destination_country]
                  .filter(Boolean)
                  .join(', ')}{' '}
                · {formatCurrency(foundOrder.total_amount, currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
