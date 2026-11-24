import { TRANSLATIONS } from '../data/catalog';
import type { LanguageCode } from '../types/store';

interface HowItWorksAndManifestoProps {
  language: LanguageCode;
}

const STEPS = [
  {
    num: 1,
    title: 'Open the hatch',
    body: 'Open the discreet chamber in the base and drop in a backflow cone.',
  },
  {
    num: 2,
    title: 'Light it',
    body: 'Light the cone tip, let it burn for 10 seconds, then gently blow out the flame.',
  },
  {
    num: 3,
    title: 'Close it and watch',
    body: 'Thick, calming mist cascades down over the turf and sculpture.',
  },
];

export function HowItWorksAndManifesto({ language }: HowItWorksAndManifestoProps) {
  const t = TRANSLATIONS[language];

  return (
    <>
      <section id="how-it-works" className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-5 sm:p-7">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#111111] uppercase">
            {t.howItWorks}
          </h2>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="flex flex-col items-start rounded-xl border border-[#E5E7EB] bg-white p-4"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1D4ED8] font-[family-name:var(--font-mono)] text-sm font-bold text-white tabular-nums">
                  {step.num}
                </span>
                <h3 className="mt-3 text-base font-bold text-[#111111]">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Contrast Manifesto Banner */}
      <section className="mx-auto max-w-3xl px-4 pb-6">
        <div className="rounded-2xl bg-[#0D0D0D] px-6 py-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#2563EB] uppercase">
            MATCHDAY CALM.
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm font-bold tracking-[0.26em] text-white uppercase">
            MIST &amp; TURF • HAND-PAINTED RESIN
          </p>
        </div>
      </section>
    </>
  );
}
