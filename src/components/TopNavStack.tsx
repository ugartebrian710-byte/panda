import { Menu, ShieldCheck, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import { TRANSLATIONS } from '../data/catalog';
import type { LanguageCode, UserProfile } from '../types/store';

interface TopNavStackProps {
  countdown: { hours: string; mins: string; secs: string };
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  profile: UserProfile | null;
  language: LanguageCode;
}

const NAV_ITEMS = [
  { id: 'bundles', label: 'Bundles & Editions' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'faq', label: 'FAQ' },
  { id: 'track-order', label: 'Track Order' },
  { id: 'contact', label: 'Contact' },
  { id: 'reviews', label: 'Reviews' },
];

export function TopNavStack({
  countdown,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenAdmin,
  profile,
  language,
}: TopNavStackProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const handleNavClick = (id: string) => {
    setDrawerOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* 1. Countdown Top Bar */}
      <div className="bg-[#0D0D0D] text-white px-3 py-2 text-center">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="font-[family-name:var(--font-display)] text-sm sm:text-base font-extrabold tracking-wider uppercase text-white">
            {t.saleHeadline}
          </span>
          <span className="text-[11px] sm:text-xs font-medium tracking-wide text-slate-300 uppercase">
            {t.hurryEnds}
          </span>
          <div className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] tabular-nums text-xs font-bold">
            <span className="inline-flex flex-col items-center rounded bg-[#1D4ED8] px-1.5 py-0.5 leading-none text-white">
              <span>{countdown.hours}</span>
              <span className="text-[8px] font-sans font-semibold tracking-wider text-blue-100">
                HRS
              </span>
            </span>
            <span className="text-slate-400">:</span>
            <span className="inline-flex flex-col items-center rounded bg-[#1D4ED8] px-1.5 py-0.5 leading-none text-white">
              <span>{countdown.mins}</span>
              <span className="text-[8px] font-sans font-semibold tracking-wider text-blue-100">
                MINS
              </span>
            </span>
            <span className="text-slate-400">:</span>
            <span className="inline-flex flex-col items-center rounded bg-[#1D4ED8] px-1.5 py-0.5 leading-none text-white">
              <span>{countdown.secs}</span>
              <span className="text-[8px] font-sans font-semibold tracking-wider text-blue-100">
                SECS
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-banner */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-1.5 text-center">
        <p className="text-[11px] sm:text-xs font-extrabold tracking-widest text-[#111111] uppercase">
          {t.saveUpTo}
        </p>
      </div>

      {/* 3. Scrolling Marquee Strip */}
      <div className="overflow-hidden bg-[#1D4ED8] py-1.5 text-white">
        <div className="animate-marquee whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase">
          {[0, 1, 2, 3].map((idx) => (
            <span key={idx} className="mx-3 inline-block">
              HAND-PAINTED RESIN • PITCHSIDE CALM • MIST &amp; TURF ORIGINALS • WORLDWIDE SHIPPING •
            </span>
          ))}
        </div>
      </div>

      {/* 4. Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#111111] hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <a
            href="#top"
            className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-wider text-[#111111] uppercase whitespace-nowrap shrink-0"
          >
            MIST &amp; TURF
          </a>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#111111] hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
              aria-label={profile ? `Account (${profile.email})` : 'Sign in or Sign up'}
            >
              <UserIcon className="h-5 w-5" />
              <span className="hidden sm:inline whitespace-nowrap">
                {profile ? 'Account' : 'Sign In'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#111111] hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
              aria-label={`Open shopping bag (${cartCount} items)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D4ED8] px-1 text-[11px] font-bold text-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="relative z-10 flex h-full w-72 max-w-[82vw] flex-col bg-white shadow-xl"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <span className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-wider uppercase text-[#111111]">
                MIST &amp; TURF
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-[#F8FAFC]"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#111111] hover:bg-[#F8FAFC] hover:text-[#1D4ED8] transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="text-slate-400">→</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-[#E5E7EB] pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAuth();
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 text-left text-xs font-bold text-[#111111] hover:border-[#1D4ED8] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-[#1D4ED8]" />
                    <span>{profile ? `Account (${profile.email})` : 'Sign In / Sign Up'}</span>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAdmin();
                  }}
                  className="flex w-full items-center justify-between rounded-lg bg-[#111111] px-3 py-2.5 text-left text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
                    <span>Admin Console</span>
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] p-4 bg-[#F8FAFC]">
              <p className="text-xs font-medium text-slate-500">mistandturf.com</p>
              <p className="mt-0.5 text-xs text-slate-500">support@mistandturf.com</p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
