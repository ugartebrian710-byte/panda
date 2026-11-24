import { ChevronUp, Globe, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { CURRENCIES, formatCurrency, TRANSLATIONS } from '../data/catalog';
import type { CurrencyCode, LanguageCode } from '../types/store';

interface FloatingBottomBarProps {
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  language: LanguageCode;
  onChangeLanguage: (language: LanguageCode) => void;
  activeBundlePriceUsd: number;
  onAddToCart: () => void;
}

const LANGUAGES: LanguageCode[] = ['EN', 'ES', 'FR', 'DE', 'PT'];
const CURRENCY_LIST: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

export function FloatingBottomBar({
  currency,
  onChangeCurrency,
  language,
  onChangeLanguage,
  activeBundlePriceUsd,
  onAddToCart,
}: FloatingBottomBarProps) {
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];

  return (
    <>
      {/* Bottom-left Floating Currency Switcher Pill */}
      <div className="fixed bottom-16 left-3 z-30">
        {currencyMenuOpen && (
          <div className="mb-2 w-32 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg">
            {CURRENCY_LIST.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onChangeCurrency(code);
                  setCurrencyMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                  currency === code
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-[#111111] hover:bg-[#F8FAFC]'
                }`}
              >
                <span>{CURRENCIES[code].label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setCurrencyMenuOpen((v) => !v);
            setLangMenuOpen(false);
          }}
          aria-label="Switch currency"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#111111] shadow-md backdrop-blur-sm hover:border-[#1D4ED8] cursor-pointer"
        >
          <span>{CURRENCIES[currency].label}</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      {/* Bottom-right Floating Language Switcher Pill */}
      <div className="fixed bottom-16 right-3 z-30">
        {langMenuOpen && (
          <div className="mb-2 w-24 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  onChangeLanguage(lang);
                  setLangMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                  language === lang
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-[#111111] hover:bg-[#F8FAFC]'
                }`}
              >
                <span>{lang}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setLangMenuOpen((v) => !v);
            setCurrencyMenuOpen(false);
          }}
          aria-label="Switch language"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#111111] shadow-md backdrop-blur-sm hover:border-[#1D4ED8] cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5 text-[#1D4ED8]" />
          <span>{language}</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      {/* Sticky Bottom Add-to-Cart Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5E7EB] bg-white/95 px-3 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="hidden sm:block">
            <div className="text-xs font-extrabold uppercase text-[#111111]">
              Mist &amp; Turf Burner
            </div>
            <div className="text-[11px] text-slate-500">Free Worldwide Shipping</div>
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            className="flex flex-1 sm:flex-none sm:min-w-[260px] items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] active:scale-[0.99] transition-all cursor-pointer tabular-nums"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{t.addToCart}</span>
            <span>·</span>
            <span>{formatCurrency(activeBundlePriceUsd, currency)}</span>
          </button>
        </div>
      </div>
    </>
  );
}
