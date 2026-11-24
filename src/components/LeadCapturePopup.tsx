import { Check, Copy, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { subscribeLeadEmail } from '../lib/supabase';
import type { TrafficAttribution } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';

interface LeadCapturePopupProps {
  open: boolean;
  onClose: () => void;
  attribution: TrafficAttribution;
  onApplyPromoCode: (code: string) => void;
}

export function LeadCapturePopup({
  open,
  onClose,
  attribution,
  onApplyPromoCode,
}: LeadCapturePopupProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockedCode, setUnlockedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const res = await subscribeLeadEmail({
      email: cleaned,
      promo_code: 'MIST5',
      traffic_source: attribution.source,
      utm_campaign: attribution.utm_campaign,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not sign up right now. Please try again.');
      return;
    }

    setUnlockedCode('MIST5');
    onApplyPromoCode('MIST5');
  };

  const handleCopy = async () => {
    if (!unlockedCode) return;
    try {
      await navigator.clipboard.writeText(unlockedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-headline"
        className="relative z-10 w-full max-w-[360px] rounded-3xl bg-white px-6 pt-6 pb-7 shadow-2xl text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close offer popup"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Centered Rounded Square Product Thumbnail (Uploading Soon) */}
        <div className="mx-auto w-20 h-20">
          <MediaPlaceholder
            aspectClass="aspect-square w-20 h-20"
            label="Uploading Soon"
            compact
          />
        </div>

        <p className="mt-4 text-[11px] font-extrabold tracking-[0.16em] text-[#1D4ED8] uppercase">
          MATCHDAY DROP EXTRA
        </p>

        <h2
          id="popup-headline"
          className="mt-2 font-[family-name:var(--font-sans)] text-[26px] font-extrabold leading-[1.12] tracking-tight text-[#111111]"
        >
          Get 5% off your first order
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
          Join the MIST &amp; TURF list for new drops and deals. Your code shows up right away.
        </p>

        {!unlockedCode ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
            {errorMsg && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {errorMsg}
              </p>
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Your email"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#F59E0B] px-5 py-3.5 text-base font-extrabold text-white shadow-sm hover:bg-[#D97706] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Unlocking...' : 'Unlock my 5%'}
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
                Your 5% Off Code Is Ready
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="font-[family-name:var(--font-mono)] text-xl font-extrabold tracking-widest text-[#111111]">
                  {unlockedCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#1D4ED8] border border-blue-200 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Auto-applied at checkout!
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              Shop Editions Now
            </button>
          </div>
        )}

        {!unlockedCode && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3.5 inline-block text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-[#111111] cursor-pointer"
          >
            No thanks
          </button>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
          By signing up you agree to get marketing emails from MIST &amp; TURF. Unsubscribe anytime.
          See our{' '}
          <button
            type="button"
            onClick={() => setShowPrivacy((v) => !v)}
            className="underline hover:text-slate-600 cursor-pointer"
          >
            Privacy Policy
          </button>
          .
        </p>

        {showPrivacy && (
          <div className="mt-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-2.5 text-left text-[11px] leading-relaxed text-slate-600">
            Mist &amp; Turf collects your email strictly to deliver your discount code, drop
            updates, and order notifications. We never sell customer data. Email
            support@mistandturf.com to delete your record anytime.
          </div>
        )}
      </div>
    </div>
  );
}
