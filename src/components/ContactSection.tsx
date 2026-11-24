import { CheckCircle2, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { TRANSLATIONS } from '../data/catalog';
import { submitContactMessage } from '../lib/supabase';
import type { LanguageCode } from '../types/store';

interface ContactSectionProps {
  language: LanguageCode;
}

export function ContactSection({ language }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const t = TRANSLATIONS[language];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 5) {
      setErrorMsg('Please write a brief message (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    const result = await submitContactMessage({
      name,
      email,
      order_number: orderNumber,
      message,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Could not send message. Please try again.');
      return;
    }

    setSentSuccess(true);
    setName('');
    setEmail('');
    setOrderNumber('');
    setMessage('');
  };

  return (
    <section id="contact" className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-5 sm:p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#111111] uppercase">
          {t.contactTitle}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Questions about your order? Send us a message and we&apos;ll reply within 24–72 hours on
          business days.
        </p>

        {sentSuccess && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Message received!</p>
              <p className="text-xs text-emerald-800">
                Thanks for reaching out. Our support desk will reply to your inbox shortly.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-bold text-[#111111]">
                Name *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSentSuccess(false);
                }}
                placeholder="Alex Mercer"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-bold text-[#111111]">
                Email *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSentSuccess(false);
                }}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-order" className="block text-xs font-bold text-[#111111]">
              Order number (optional)
            </label>
            <input
              id="contact-order"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. MT-482910"
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-bold text-[#111111]">
              Message *
            </label>
            <textarea
              id="contact-message"
              required
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSentSuccess(false);
              }}
              placeholder="Tell us how we can help..."
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#F59E0B] px-5 py-3.5 text-sm sm:text-base font-extrabold text-[#111111] hover:bg-[#D97706] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Sending...' : t.sendMessage}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Mail className="h-4 w-4 text-[#1D4ED8]" />
          <span>Direct email:</span>
          <a
            href="mailto:support@mistandturf.com"
            className="font-bold text-[#1D4ED8] underline underline-offset-2"
          >
            support@mistandturf.com
          </a>
        </div>
      </div>
    </section>
  );
}
