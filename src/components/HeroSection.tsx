import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { HERO_SLIDES, TRANSLATIONS } from '../data/catalog';
import type { LanguageCode } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';
import { StarRating } from './StarRating';

interface HeroSectionProps {
  language: LanguageCode;
  reviewCount: number;
}

export function HeroSection({ language, reviewCount }: HeroSectionProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const t = TRANSLATIONS[language];

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  };

  const scrollToReviews = () => {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
  };

  const current = HERO_SLIDES[activeSlide];

  return (
    <section id="top" className="mx-auto max-w-3xl px-4 pt-4 pb-6">
      {/* Main Hero Media Frame */}
      <div className="relative">
        <MediaPlaceholder
          aspectClass="aspect-[4/3] w-full"
          label="Uploading Soon"
          sublabel={current.label}
        />

        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous product view"
          className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/90 text-[#111111] shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next product view"
          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/90 text-[#111111] shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 right-3 rounded-md bg-[#111111]/80 px-2.5 py-1 text-[11px] font-medium text-white tabular-nums">
          {activeSlide + 1} / {HERO_SLIDES.length}
        </div>
      </div>

      {/* 5-Slot Thumbnail Selector */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {HERO_SLIDES.map((slide) => {
          const isActive = slide.id === activeSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlide(slide.id)}
              aria-label={`View ${slide.label}`}
              aria-pressed={isActive}
              className={`rounded-xl p-0.5 transition-all focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${
                isActive
                  ? 'ring-2 ring-[#1D4ED8] ring-offset-1'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <MediaPlaceholder
                aspectClass="aspect-square w-full"
                label="Uploading Soon"
                compact
              />
            </button>
          );
        })}
      </div>

      {/* Outlined Badge */}
      <div className="mt-5">
        <span className="inline-block rounded border border-[#111111] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#111111] uppercase">
          {t.heroTag}
        </span>
      </div>

      {/* Star Rating Row */}
      <div className="mt-3">
        <button
          type="button"
          onClick={scrollToReviews}
          className="inline-flex items-center gap-2 text-left text-sm text-slate-700 hover:text-[#1D4ED8] transition-colors"
        >
          <StarRating rating={5} size="sm" />
          <span className="font-semibold text-[#111111]">4.8 out of 5</span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="underline decoration-slate-300 underline-offset-2 tabular-nums">
            Based on {reviewCount} reviews
          </span>
        </button>
      </div>

      {/* H1 Headline */}
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold leading-[1.06] tracking-tight text-[#111111] uppercase text-balance">
        {t.heroTitle}
      </h1>

      {/* 3 Key Highlight Bullets */}
      <ul className="mt-4 space-y-2.5 text-sm sm:text-[15px] text-slate-700">
        <li className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>Mist drifts smoothly across the turf &amp; sculpture</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>Hand-painted resin: crisp pitch lines, boots, kits &amp; trophies</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>Arrives gift-boxed, ready for any football fan</span>
        </li>
      </ul>
    </section>
  );
}
