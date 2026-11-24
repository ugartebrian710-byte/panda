import { Globe, RotateCcw, ShieldCheck } from 'lucide-react';
import { INLINE_SNIPPETS } from '../data/catalog';
import { MediaPlaceholder } from './MediaPlaceholder';
import { StarRating } from './StarRating';

export function TrustAndSnippets() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-4">
      {/* Horizontal Scrollable Featured Review Snippets */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {INLINE_SNIPPETS.map((snippet) => (
          <article
            key={snippet.id}
            className="w-[260px] shrink-0 snap-start rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 shrink-0">
                <MediaPlaceholder
                  aspectClass="aspect-square w-9 h-9"
                  label="Uploading Soon"
                  circle
                  compact
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111111] truncate">{snippet.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{snippet.location}</div>
              </div>
            </div>
            <div className="mt-2.5">
              <StarRating rating={5} size="sm" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">{snippet.quote}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-[#1D4ED8]">{snippet.edition}</p>
          </article>
        ))}
      </div>

      {/* Payment Badges Row */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {['Apple Pay', 'Google Pay', 'Visa', 'Mastercard', 'Amex'].map((method) => (
          <span
            key={method}
            className="inline-flex h-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-[11px] font-bold tracking-tight text-slate-700"
          >
            {method}
          </span>
        ))}
      </div>

      {/* 3-Column Trust Guarantee Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#1D4ED8]">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#111111]">Free worldwide shipping</div>
            <div className="text-[11px] text-slate-500">Tracked delivery to 120+ countries</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#1D4ED8]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#111111]">Secure checkout</div>
            <div className="text-[11px] text-slate-500">256-bit SSL encrypted protection</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#1D4ED8]">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#111111]">Money-back guarantee</div>
            <div className="text-[11px] text-slate-500">Free transit damage replacement</div>
          </div>
        </div>
      </div>
    </section>
  );
}
