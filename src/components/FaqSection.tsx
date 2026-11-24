import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS, TRANSLATIONS } from '../data/catalog';
import type { LanguageCode } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';

interface FaqSectionProps {
  language: LanguageCode;
}

export function FaqSection({ language }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = TRANSLATIONS[language];

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="text-center font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#111111] uppercase">
        {t.faqTitle}
      </h2>

      <div className="mt-5 divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <span className="text-sm sm:text-base font-bold text-[#111111]">{item.q}</span>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8FAFC] text-[#111111]">
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Showcase Media Slot Below FAQ */}
      <div className="mt-6">
        <MediaPlaceholder
          aspectClass="aspect-[16/9] w-full"
          label="Uploading Soon"
          sublabel="Mist & Turf Craftsmanship & Unboxing Showcase"
        />
      </div>
    </section>
  );
}
