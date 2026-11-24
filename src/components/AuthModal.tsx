import { LogOut, Package, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { formatCurrency } from '../data/catalog';
import { fetchMyOrders, isSupabaseConfigured, supabase } from '../lib/supabase';
import type { CurrencyCode, OrderRecord, UserProfile } from '../types/store';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onLocalPreviewSignIn: (profile: UserProfile) => void;
  onSignedOut: () => void;
  onOpenAdmin: () => void;
  currency: CurrencyCode;
}

export function AuthModal({
  open,
  onClose,
  profile,
  onLocalPreviewSignIn,
  onSignedOut,
  onOpenAdmin,
  currency,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    if (open && profile?.email) {
      void fetchMyOrders(profile.email).then(setMyOrders);
    }
  }, [open, profile?.email]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (!supabase) {
      // Graceful local preview fallback when Supabase env vars aren't configured yet
      const previewProfile: UserProfile = {
        id: `preview-${Date.now()}`,
        email: cleanEmail,
        full_name: fullName.trim() || cleanEmail.split('@')[0],
        role: cleanEmail === 'ugartebrian710@gmail.com' ? 'admin' : 'customer',
      };
      onLocalPreviewSignIn(previewProfile);
      setNoticeMsg('Signed in (Local Preview Mode — connect Supabase env vars for live auth).');
      return;
    }

    setLoading(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      if (data.user && !data.session) {
        setNoticeMsg('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
        return;
      }
      setNoticeMsg('Account created and signed in!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      onClose();
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignedOut();
    setMyOrders([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-[#1D4ED8]" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-[#111111]">
              {profile ? 'Your Account' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F8FAFC]"
            aria-label="Close account modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-[#1D4ED8]">
            Supabase env vars are not set yet — account preview runs locally until{' '}
            <span className="font-mono font-bold">VITE_SUPABASE_URL</span> &amp;{' '}
            <span className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</span> are added.
          </div>
        )}

        {profile ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#111111]">
                    {profile.full_name || 'Mist & Turf Member'}
                  </p>
                  <p className="text-xs text-slate-500">{profile.email}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    profile.role === 'admin'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {profile.role}
                </span>
              </div>

              {profile.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Open Real-Time Admin Dashboard</span>
                </button>
              )}
            </div>

            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                <Package className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span>Your Orders ({myOrders.length})</span>
              </h3>
              {myOrders.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No orders linked to {profile.email} yet.
                </p>
              ) : (
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.tracking_number}
                      className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#111111]">
                          {ord.tracking_number}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.selected_editions.join(', ') || ord.bundle_title}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#1D4ED8]">{ord.status}</div>
                        <div className="text-[11px] font-semibold tabular-nums">
                          {formatCurrency(ord.total_amount, currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-[#F8FAFC] cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            <div className="grid grid-cols-2 rounded-xl bg-[#F8FAFC] p-1 border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                  mode === 'signin' ? 'bg-white text-[#111111] shadow-xs' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-[#111111] shadow-xs' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}
            {noticeMsg && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                {noticeMsg}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-[#111111]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111111]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
