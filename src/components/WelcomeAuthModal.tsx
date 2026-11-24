import { CheckCircle2, Lock, Mail, Sparkles, User, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { signInCustomer, signUpCustomer } from '../lib/supabase';
import type { UserProfile } from '../types/store';

interface WelcomeAuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'signin';
  onAuthSuccess: (user: UserProfile) => void;
  onApplyWelcomePromo?: () => void;
}

export function WelcomeAuthModal({
  open,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  onApplyWelcomePromo,
}: WelcomeAuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    if (mode === 'signup') {
      const res = await signUpCustomer({ email, password, fullName });
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(res.error ?? 'Could not create account.');
        return;
      }
      if (res.message) {
        setInfoMsg(res.message);
        if (onApplyWelcomePromo) onApplyWelcomePromo();
        return;
      }
      if (res.user) {
        if (onApplyWelcomePromo) onApplyWelcomePromo();
        onAuthSuccess(res.user);
        onClose();
      }
    } else {
      const res = await signInCustomer({ email, password });
      setLoading(false);
      if (!res.ok || !res.user) {
        setErrorMsg(res.error ?? 'Invalid email or password.');
        return;
      }
      onAuthSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-auth-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        {/* Top Royal Blue Banner */}
        <div className="bg-[#1D4ED8] px-5 py-3 text-center text-white">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>MATCHDAY DROP EXCLUSIVE</span>
          </div>
          <p className="mt-0.5 text-xs text-blue-100">
            Unlock <strong className="text-white">10% OFF (TURF10)</strong> + instant order tracking
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute right-3 top-3 rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-6">
          <h2
            id="welcome-auth-title"
            className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase text-[#111111]"
          >
            {mode === 'signup' ? 'Join Mist & Turf Club' : 'Welcome Back'}
          </h2>
          <p className="mt-1 text-center text-xs text-slate-600">
            {mode === 'signup'
              ? 'Create your minimal fan account in seconds for drop alerts & fast checkout.'
              : 'Sign in to sync your orders, tracking & collector profile.'}
          </p>

          {/* Segmented Mode Toggle */}
          <div className="mt-4 grid grid-cols-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-slate-500 hover:text-[#111111]'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-slate-500 hover:text-[#111111]'
              }`}
            >
              Sign In
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">{infoMsg}</p>
                <p className="mt-0.5 text-[11px]">
                  Your code <strong>TURF10</strong> is ready for checkout.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-bold text-[#111111]">
                  Name (Optional)
                </label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-[#111111]">
                Email *
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-bold text-[#111111]">
                Password *
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                ? 'Unlock 10% Off & Join'
                : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 block w-full text-center text-xs font-medium text-slate-500 hover:text-[#111111] cursor-pointer"
          >
            No thanks, continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
