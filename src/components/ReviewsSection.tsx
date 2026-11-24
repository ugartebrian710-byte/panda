import { CheckCircle2, Star, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { EDITIONS, TRANSLATIONS } from '../data/catalog';
import { createReview } from '../lib/supabase';
import type { LanguageCode, ReviewItem } from '../types/store';
import { MediaPlaceholder } from './MediaPlaceholder';
import { StarRating } from './StarRating';

interface ReviewsSectionProps {
  language: LanguageCode;
  reviews: ReviewItem[];
  onReviewAdded: (review: ReviewItem) => void;
}

const RATING_BREAKDOWN = [
  { stars: 5, pct: 86 },
  { stars: 4, pct: 11 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
];

export function ReviewsSection({
  language,
  reviews,
  onReviewAdded,
}: ReviewsSectionProps) {
  const [editionFilter, setEditionFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [location, setLocation] = useState('');
  const [editionName, setEditionName] = useState(EDITIONS[0].name);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const t = TRANSLATIONS[language];
  const baseReviewCount = 259 + Math.max(0, reviews.length - 8);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (editionFilter !== 'ALL' && r.edition_name !== editionFilter) return false;
      if (ratingFilter !== 'ALL' && r.rating !== ratingFilter) return false;
      return true;
    });
  }, [reviews, editionFilter, ratingFilter]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (authorName.trim().length < 2) {
      setFormError('Please enter your name.');
      return;
    }
    if (title.trim().length < 2 || body.trim().length < 5) {
      setFormError('Please include a headline and review text.');
      return;
    }

    setSubmitting(true);
    const res = await createReview({
      author_name: authorName,
      location,
      edition_name: editionName,
      rating,
      title,
      body,
    });
    setSubmitting(false);

    if (res.ok) {
      onReviewAdded(res.review);
      setAuthorName('');
      setLocation('');
      setTitle('');
      setBody('');
      setRating(5);
      setModalOpen(false);
      setJustSubmitted(true);
    }
  };

  return (
    <section id="reviews" className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold tracking-wide text-[#111111] uppercase">
              {t.reviewsTitle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StarRating rating={5} size="md" />
              <span className="font-bold text-[#111111]">4.8 out of 5</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 tabular-nums">
                Based on {baseReviewCount} reviews
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-[#111111] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t.writeReview}
          </button>
        </div>

        {/* Distribution Bars */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            {RATING_BREAKDOWN.map((row) => (
              <button
                key={row.stars}
                type="button"
                onClick={() =>
                  setRatingFilter((prev) => (prev === row.stars ? 'ALL' : row.stars))
                }
                className={`flex w-full items-center gap-2.5 rounded px-1.5 py-0.5 text-xs transition-colors cursor-pointer ${
                  ratingFilter === row.stars ? 'bg-blue-50 font-bold' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <span className="w-10 text-left font-medium text-slate-700 tabular-nums">
                  {row.stars} ★
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F8FAFC] border border-[#E5E7EB]">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-slate-500 tabular-nums">{row.pct}%</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
            <div>
              <label
                htmlFor="review-edition-filter"
                className="block text-xs font-bold text-[#111111]"
              >
                Filter by Edition
              </label>
              <select
                id="review-edition-filter"
                value={editionFilter}
                onChange={(e) => setEditionFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111111] focus:border-[#1D4ED8] focus:outline-none"
              >
                <option value="ALL">All 10 Editions</option>
                {EDITIONS.map((ed) => (
                  <option key={ed.id} value={ed.name}>
                    {ed.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 5, 4, 3] as const).map((r) => (
                <button
                  key={String(r)}
                  type="button"
                  onClick={() => setRatingFilter(r)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    ratingFilter === r
                      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                      : 'border-[#E5E7EB] bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r === 'ALL' ? 'All Ratings' : `${r} Stars`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {justSubmitted && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Thank you! Your review has been published.</span>
          </div>
        )}

        {/* Review Cards */}
        <div className="mt-6 space-y-3.5">
          {filteredReviews.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-6 text-center text-sm text-slate-600">
              No reviews match the selected filters.{' '}
              <button
                type="button"
                onClick={() => {
                  setEditionFilter('ALL');
                  setRatingFilter('ALL');
                }}
                className="font-bold text-[#1D4ED8] underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <article
                key={rev.id}
                className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0">
                      <MediaPlaceholder
                        aspectClass="aspect-square w-9 h-9"
                        label="Uploading Soon"
                        circle
                        compact
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#111111]">
                          {rev.author_name}
                        </span>
                        {rev.verified_purchase && (
                          <span className="text-[11px] font-semibold text-[#1D4ED8]">
                            · Verified Buyer
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {rev.location} · {rev.edition_name}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={rev.rating} size="sm" />
                </div>

                <h3 className="mt-3 text-sm font-bold text-[#111111]">{rev.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{rev.body}</p>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-review-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3
                id="write-review-title"
                className="font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-[#111111]"
              >
                {t.writeReview}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F8FAFC]"
                aria-label="Close review modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#111111]">Your Rating</label>
                <div className="mt-1 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="rev-edition" className="block text-xs font-bold text-[#111111]">
                  Edition Purchased
                </label>
                <select
                  id="rev-edition"
                  value={editionName}
                  onChange={(e) => setEditionName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111111]"
                >
                  {EDITIONS.map((ed) => (
                    <option key={ed.id} value={ed.name}>
                      {ed.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rev-name" className="block text-xs font-bold text-[#111111]">
                    Name *
                  </label>
                  <input
                    id="rev-name"
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Jamie T."
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="rev-location" className="block text-xs font-bold text-[#111111]">
                    City / Country
                  </label>
                  <input
                    id="rev-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Liverpool, UK"
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rev-title" className="block text-xs font-bold text-[#111111]">
                  Review Headline *
                </label>
                <input
                  id="rev-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Incredible matchday mist effect"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="rev-body" className="block text-xs font-bold text-[#111111]">
                  Review *
                </label>
                <textarea
                  id="rev-body"
                  required
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share how your Mist & Turf burner looks and burns..."
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] cursor-pointer"
              >
                {submitting ? 'Publishing...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
