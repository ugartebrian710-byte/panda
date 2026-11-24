import { Camera } from 'lucide-react';

interface MediaPlaceholderProps {
  aspectClass?: string;
  label?: string;
  sublabel?: string;
  compact?: boolean;
  circle?: boolean;
  className?: string;
}

export function MediaPlaceholder({
  aspectClass = 'aspect-[4/3]',
  label = 'Uploading Soon',
  sublabel,
  compact = false,
  circle = false,
  className = '',
}: MediaPlaceholderProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC] text-slate-500 select-none ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${aspectClass} ${className}`}
      aria-label={sublabel ? `${label} — ${sublabel}` : label}
    >
      <Camera
        className={compact ? 'h-4 w-4 text-slate-400' : 'h-6 w-6 text-slate-400'}
        strokeWidth={1.75}
      />
      {!circle && (
        <span
          className={`mt-1.5 font-semibold tracking-tight text-slate-500 text-center px-1.5 ${
            compact ? 'text-[10px] leading-tight' : 'text-xs'
          }`}
        >
          {label}
        </span>
      )}
      {!circle && sublabel && !compact && (
        <span className="mt-0.5 text-[11px] text-slate-400 text-center px-2 truncate max-w-full">
          {sublabel}
        </span>
      )}
    </div>
  );
}
