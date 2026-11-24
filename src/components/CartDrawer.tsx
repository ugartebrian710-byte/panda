import { Gift, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatCurrency, TRANSLATIONS } from '../data/catalog';
import type { CartItem, CurrencyCode, LanguageCode } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyCode;
  language: LanguageCode;
  onUpdateQuantity: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  onClose,
  items,
  currency,
  language,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const t = TRANSLATIONS[language];
  const subtotalUsd = items.reduce((sum, item) => sum + item.unitPriceUsd * item.quantity, 0);
  const compareAtTotalUsd = items.reduce(
    (sum, item) => sum + item.compareAtUsd * item.quantity,
    0
  );
  const savingsUsd = Math.max(0, compareAtTotalUsd - subtotalUsd);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#111111]" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-[#111111]">
              Your Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F8FAFC]"
            aria-label="Close shopping bag"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-base font-bold text-[#111111]">Your bag is empty</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Pick a bundle and choose from our 10 hand-painted resin football editions to get
                started.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Browse Editions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartKey}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5"
                >
                  <div className="flex gap-3">
                    <div className="w-16 shrink-0">
                      <MediaPlaceholder
                        aspectClass="aspect-square w-16"
                        label="Uploading Soon"
                        compact
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#111111]">{item.bundleTitle}</h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartKey)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          aria-label={`Remove ${item.bundleTitle}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                        {item.editions.map((ed, idx) => (
                          <li key={`${ed.id}-${idx}`}>
                            #{idx + 1}: <span className="font-semibold text-[#111111]">{ed.name}</span>
                          </li>
                        ))}
                      </ul>

                      {item.addons.length > 0 && (
                        <div className="mt-1.5 text-[11px] text-[#1D4ED8] font-medium">
                          + {item.addons.map((a) => a.name).join(', ')}
                        </div>
                      )}

                      <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1D4ED8]">
                        <Gift className="h-3 w-3" />
                        <span>FREE Surprise Gift Included</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartKey, -1)}
                            className="p-1.5 text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold tabular-nums text-[#111111]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartKey, 1)}
                            className="p-1.5 text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right tabular-nums">
                          <div className="text-sm font-extrabold text-[#111111]">
                            {formatCurrency(item.unitPriceUsd * item.quantity, currency)}
                          </div>
                          <div className="text-[11px] text-slate-400 line-through">
                            {formatCurrency(item.compareAtUsd * item.quantity, currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#E5E7EB] bg-white p-5 space-y-3">
            {savingsUsd > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
                <span>Bundle Savings</span>
                <span className="tabular-nums">-{formatCurrency(savingsUsd, currency)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-extrabold text-[#111111]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotalUsd, currency)}</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Free worldwide tracked shipping unlocked. Promo codes applied at next step.
            </p>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full rounded-xl bg-[#F59E0B] px-5 py-3.5 text-sm sm:text-base font-extrabold text-[#111111] hover:bg-[#D97706] transition-colors cursor-pointer"
            >
              {t.checkoutBtn}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
