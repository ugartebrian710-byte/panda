import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating = 5, size = 'md' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const rounded = Math.round(rating);

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rounded ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-slate-200 text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}
