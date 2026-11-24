import { Check, Gift, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ADDONS, BUNDLE_TIERS, EDITIONS, formatCurrency, TRANSLATIONS } from '../data/catalog';
import type { AddOnItem, BundleTier, CurrencyCode, Edition, LanguageCode } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';

interface BundleBuilderProps {
  countdown: { hours: string; mins: string; secs: string };
  currency: CurrencyCode;
  language: LanguageCode;
  editions: Edition[];
  selectedBundle: BundleTier;
  onSelectBundle: (bundle: BundleTier) => void;
  selectedEditions: Edition[];
  onChangeEditionAtSlot: (slotIndex: number, edition: Edition) => void;
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
  onAddToCart: () => void;
}

export function BundleBuilder({
  countdown,
  currency,
  language,
  editions,
  selectedBundle,
  onSelectBundle,
  selectedEditions,
  onChangeEditionAtSlot,
  selectedAddonIds,
  onToggleAddon,
  onAddToCart,
}: BundleBuilderProps) {
  const [activeSlotTab, setActiveSlotTab] = useState(0);
  const t = TRANSLATIONS[language];

  const safeSlotTab = activeSlotTab < selectedBundle.quantity ? activeSlotTab : 0;

  const estimatedDeliveryWindow = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date();
    end.setDate(end.getDate() + 12);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }, []);

  const selectedAddonsTotalUsd = ADDONS.filter((a: AddOnItem) =>
    selectedAddonIds.includes(a.id)
  ).reduce((sum, a) => sum + a.priceUsd, 0);

  const totalUsd = selectedBundle.priceUsd + selectedAddonsTotalUsd;

  return (
    <section id="bundles" className="mx-auto max-w-3xl px-4 py-6">
      {/* Section Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-widest text-[#111111] uppercase">
          {t.bundleDivider}
        </h2>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      {/* Live Pill Countdown */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-[#1D4ED8] tabular-nums">
          <span>
            Hurry! Offer expires in: {countdown.hours}:{countdown.mins}:{countdown.secs}
          </span>
        </div>
      </div>

      {/* 3 Interactive Bundle Radio Cards */}
      <div className="mt-5 space-y-3.5" role="radiogroup" aria-label="Bundle tiers">
        {BUNDLE_TIERS.map((tier) => {
          const isSelected = tier.id === selectedBundle.id;
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                onSelectBundle(tier);
                setActiveSlotTab(0);
              }}
              className={`relative w-full rounded-xl border-2 p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${
                isSelected
                  ? 'border-[#1D4ED8] bg-blue-50/35 shadow-sm'
                  : 'border-[#E5E7EB] bg-white hover:border-slate-300'
              }`}
            >
              {tier.badgeText && (
                <span className="absolute -top-2.5 right-4 rounded bg-[#1D4ED8] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase">
                  {tier.badgeText}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-[#1D4ED8] bg-[#1D4ED8]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#111111]">
                        {tier.title}
                      </span>
                      {tier.discountPill && (
                        <span className="rounded bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                          {tier.discountPill}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{tier.subtitle}</p>
                    <p className="mt-1 text-xs font-semibold text-[#1D4ED8]">
                      Save {formatCurrency(tier.savingsUsd, currency)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <div className="text-base sm:text-lg font-extrabold text-[#111111]">
                    {formatCurrency(tier.priceUsd, currency)}
                  </div>
                  <div className="text-xs text-slate-400 line-through">
                    {formatCurrency(tier.compareAtUsd, currency)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 10-Product Selector */}
      <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold tracking-wider text-[#111111] uppercase">
            {t.chooseEdition}
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {selectedBundle.quantity === 1
              ? 'Select 1 of 10 editions'
              : `Mix & match ${selectedBundle.quantity} editions`}
          </span>
        </div>

        {/* Multi-unit Edition Tabs */}
        {selectedBundle.quantity > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: selectedBundle.quantity }).map((_, idx) => {
              const active = safeSlotTab === idx;
              const chosen = selectedEditions[idx] ?? EDITIONS[0];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlotTab(idx)}
                  className={`flex-1 min-w-[110px] rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? 'border-[#1D4ED8] bg-white text-[#1D4ED8] font-bold shadow-xs'
                      : 'border-[#E5E7EB] bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider opacity-75">
                    Edition #{idx + 1}
                  </div>
                  <div className="truncate font-semibold text-[#111111]">{chosen.name}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* 10 Edition Cards Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {(editions.length > 0 ? editions : EDITIONS).map((edition) => {
            const currentSlotEdition = selectedEditions[safeSlotTab] ?? EDITIONS[0];
            const isChosen = currentSlotEdition.id === edition.id;
            const isSoldOut = edition.is_active === false || edition.stock_quantity === 0;
            return (
              <button
                key={edition.id}
                type="button"
                disabled={isSoldOut}
                onClick={() => onChangeEditionAtSlot(safeSlotTab, edition)}
                aria-pressed={isChosen}
                className={`group flex flex-col rounded-xl border p-2 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${
                  isSoldOut
                    ? 'border-[#E5E7EB] bg-slate-50 opacity-60 cursor-not-allowed'
                    : isChosen
                    ? 'border-[#1D4ED8] bg-white ring-2 ring-[#1D4ED8]/20 cursor-pointer'
                    : 'border-[#E5E7EB] bg-white hover:border-slate-300 cursor-pointer'
                }`}
              >
                <MediaPlaceholder
                  aspectClass="aspect-square w-full"
                  label={isSoldOut ? 'Sold Out' : 'Uploading Soon'}
                  compact
                />
                <div className="mt-2 flex items-start justify-between gap-1">
                  <span className="text-xs font-bold leading-snug text-[#111111]">
                    {edition.name}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] leading-tight text-slate-500">
                  {edition.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional Add-On Checkboxes */}
        <div className="mt-5 border-t border-[#E5E7EB] pt-4">
          <p className="text-xs font-extrabold tracking-wider text-[#111111] uppercase">
            Optional Matchday Add-Ons
          </p>
          <div className="mt-2.5 space-y-2">
            {ADDONS.map((addon) => {
              const checked = selectedAddonIds.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                    checked
                      ? 'border-[#1D4ED8] bg-white'
                      : 'border-[#E5E7EB] bg-white/80 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleAddon(addon.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>

                  <div className="w-12 shrink-0">
                    <MediaPlaceholder
                      aspectClass="aspect-square w-12"
                      label="Uploading Soon"
                      compact
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-[#111111]">
                      {addon.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {addon.description}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs sm:text-sm font-bold text-[#111111] tabular-nums">
                    +{formatCurrency(addon.priceUsd, currency)}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Free Bonus Bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1D4ED8]">
          <span className="inline-flex items-center gap-2">
            <Gift className="h-4 w-4 shrink-0" />
            <span>+ FREE Surprise Gift</span>
          </span>
          <span className="uppercase tracking-wide">FREE</span>
        </div>

        {/* Primary Add to Cart CTA */}
        <button
          type="button"
          onClick={onAddToCart}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-4 text-base font-extrabold text-[#111111] shadow-sm hover:bg-[#D97706] active:scale-[0.99] transition-all cursor-pointer tabular-nums"
        >
          <span>{t.addToCart}</span>
          <span>—</span>
          <span>{formatCurrency(totalUsd, currency)}</span>
        </button>

        {/* Dynamic Estimated Delivery Window */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Truck className="h-4 w-4 text-[#1D4ED8]" />
          <span>
            Estimated delivery:{' '}
            <strong className="font-semibold text-[#111111]">{estimatedDeliveryWindow}</strong> ·
            Free Worldwide Shipping
          </span>
        </div>
      </div>
    </section>
  );
}
