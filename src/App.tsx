import { useEffect, useState } from 'react';
import { BundleBuilder } from './components/BundleBuilder';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ContactSection } from './components/ContactSection';
import { FaqSection } from './components/FaqSection';
import { FloatingBottomBar } from './components/FloatingBottomBar';
import { HeroSection } from './components/HeroSection';
import { HowItWorksAndManifesto } from './components/HowItWorksAndManifesto';
import { ReviewsSection } from './components/ReviewsSection';
import { TopNavStack } from './components/TopNavStack';
import { TrackOrderSection } from './components/TrackOrderSection';
import { TrustAndSnippets } from './components/TrustAndSnippets';
import { ADDONS, BUNDLE_TIERS, EDITIONS, INITIAL_REVIEWS } from './data/catalog';
import { fetchReviews } from './lib/supabase';
import type {
  BundleTier,
  CartItem,
  CurrencyCode,
  Edition,
  LanguageCode,
  OrderRecord,
  ReviewItem,
} from './types/store';

function formatCountdown(secondsLeft: number) {
  const hrs = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  return {
    hours: String(hrs).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
  };
}

export function App() {
  const [secondsLeft, setSecondsLeft] = useState(4 * 3600 + 37 * 60 + 42);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [language, setLanguage] = useState<LanguageCode>('EN');

  // Bundle & Edition Configuration State
  const [selectedBundle, setSelectedBundle] = useState<BundleTier>(BUNDLE_TIERS[1]);
  const [selectedEditions, setSelectedEditions] = useState<Edition[]>([
    EDITIONS[0],
    EDITIONS[1],
    EDITIONS[2],
  ]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Cart & Modals State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Reviews & Tracking State
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [prefilledTracking, setPrefilledTracking] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 5 * 3600 + 59 * 60 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    void fetchReviews().then(({ reviews: loaded }) => {
      if (mounted) setReviews(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const countdown = formatCountdown(secondsLeft);

  const handleChangeEditionAtSlot = (slotIndex: number, edition: Edition) => {
    setSelectedEditions((prev) => {
      const next = [...prev];
      next[slotIndex] = edition;
      return next;
    });
  };

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const activeAddons = ADDONS.filter((a) => selectedAddonIds.includes(a.id));
  const activeBundleWithAddonsUsd =
    selectedBundle.priceUsd + activeAddons.reduce((sum, a) => sum + a.priceUsd, 0);

  const handleAddToCart = () => {
    const bundleEditions = selectedEditions.slice(0, selectedBundle.quantity);
    const compareAtAddons = activeAddons.reduce((sum, a) => sum + a.priceUsd, 0);
    const cartKey = [
      selectedBundle.id,
      bundleEditions.map((e) => e.id).join(','),
      [...selectedAddonIds].sort().join(','),
    ].join('|');

    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartKey,
          bundleId: selectedBundle.id,
          bundleTitle: selectedBundle.title,
          editions: bundleEditions,
          addons: activeAddons,
          unitPriceUsd: activeBundleWithAddonsUsd,
          compareAtUsd: selectedBundle.compareAtUsd + compareAtAddons,
          quantity: 1,
        },
      ];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartKey: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartKey: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const handleOrderCompleted = (_order: OrderRecord) => {
    setCartItems([]);
  };

  const handleJumpToTrack = (trackingNumber: string) => {
    setPrefilledTracking(trackingNumber);
    document.getElementById('track-order')?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const displayReviewCount = 259 + Math.max(0, reviews.length - INITIAL_REVIEWS.length);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <TopNavStack
        countdown={countdown}
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
        language={language}
      />

      <main className="pb-32">
        <HeroSection language={language} reviewCount={displayReviewCount} />

        <BundleBuilder
          countdown={countdown}
          currency={currency}
          language={language}
          selectedBundle={selectedBundle}
          onSelectBundle={setSelectedBundle}
          selectedEditions={selectedEditions}
          onChangeEditionAtSlot={handleChangeEditionAtSlot}
          selectedAddonIds={selectedAddonIds}
          onToggleAddon={handleToggleAddon}
          onAddToCart={handleAddToCart}
        />

        <TrustAndSnippets />

        <HowItWorksAndManifesto language={language} />

        <FaqSection language={language} />

        <ContactSection language={language} />

        <TrackOrderSection
          language={language}
          currency={currency}
          prefilledTracking={prefilledTracking}
        />

        <ReviewsSection
          language={language}
          reviews={reviews}
          onReviewAdded={(rev) => setReviews((prev) => [rev, ...prev])}
        />

        <footer className="mx-auto max-w-3xl px-4 pt-6 pb-8 text-center text-xs text-slate-500 border-t border-[#E5E7EB]">
          <p className="font-bold text-[#111111]">MIST &amp; TURF — mistandturf.com</p>
          <p className="mt-1">
            Independent, artist-crafted football tribute collectibles. Not official club or league
            merchandise.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Mist &amp; Turf. All rights reserved.</p>
        </footer>
      </main>

      <FloatingBottomBar
        currency={currency}
        onChangeCurrency={setCurrency}
        language={language}
        onChangeLanguage={setLanguage}
        activeBundlePriceUsd={activeBundleWithAddonsUsd}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        currency={currency}
        language={language}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cartItems}
        currency={currency}
        onOrderCompleted={handleOrderCompleted}
        onJumpToTrack={handleJumpToTrack}
      />
    </div>
  );
}

export default App;
