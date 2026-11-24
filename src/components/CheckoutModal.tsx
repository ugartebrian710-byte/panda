import { Check, CheckCircle2, CreditCard, Lock, Smartphone, Tag, Truck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { COUNTRIES, EXPRESS_SHIPPING_USD, formatCurrency } from '../data/catalog';
import { createOrder, generateTrackingNumber } from '../lib/supabase';
import type { CartItem, CurrencyCode, OrderRecord } from '../types/store';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyCode;
  onOrderCompleted: (order: OrderRecord) => void;
  onJumpToTrack: (trackingNumber: string) => void;
}

type CheckoutStep = 1 | 2 | 3 | 'confirmed';

export function CheckoutModal({
  open,
  onClose,
  items,
  currency,
  onOrderCompleted,
  onJumpToTrack,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>(1);

  // Step 1 state
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [dialCode, setDialCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Step 2 state
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);

  // Step 3 state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | 'google-pay'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0],
    [countryCode]
  );

  if (!open) return null;

  const subtotalUsd = items.reduce((sum, item) => sum + item.unitPriceUsd * item.quantity, 0);
  const promoDiscountUsd = appliedPromo === 'TURF10' ? subtotalUsd * 0.1 : 0;
  const shippingUsd = shippingMethod === 'express' ? EXPRESS_SHIPPING_USD : 0;
  const totalUsd = Math.max(0, subtotalUsd - promoDiscountUsd + shippingUsd);

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const match = COUNTRIES.find((c) => c.code === newCode);
    if (match) setDialCode(match.dialCode);
  };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address for order tracking.');
      return false;
    }
    if (phone.replace(/\D/g, '').length < 6) {
      setErrorMsg('Please enter a valid phone number.');
      return false;
    }
    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter the recipient full name.');
      return false;
    }
    if (street.trim().length < 4 || city.trim().length < 2 || postalCode.trim().length < 2) {
      setErrorMsg('Please complete your street address, city, and postal code.');
      return false;
    }
    return true;
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'TURF10') {
      setAppliedPromo('TURF10');
      setPromoFeedback('TURF10 applied — 10% off your order!');
    } else {
      setAppliedPromo(null);
      setPromoFeedback('Invalid code. Try TURF10 for 10% off.');
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleCompleteOrder = async () => {
    setErrorMsg(null);

    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 15) {
        setErrorMsg('Please enter a valid 15 or 16-digit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setErrorMsg('Please enter card expiry as MM/YY.');
        return;
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        setErrorMsg('Please enter a valid 3 or 4-digit security code.');
        return;
      }
    }

    setSubmitting(true);
    const trackingNumber = generateTrackingNumber();
    const editionsFlat = items.flatMap((i) => i.editions.map((e) => e.name));
    const addonsFlat = items.flatMap((i) => i.addons.map((a) => a.name));

    const result = await createOrder({
      tracking_number: trackingNumber,
      customer_name: fullName.trim(),
      customer_email: email.trim(),
      customer_phone: `${dialCode} ${phone.trim()}`,
      shipping_address: {
        fullName: fullName.trim(),
        street: street.trim(),
        apartment: apartment.trim() || undefined,
        city: city.trim(),
        state: stateRegion.trim(),
        postalCode: postalCode.trim(),
        country: selectedCountry.name,
      },
      bundle_id: items[0]?.bundleId ?? 'buy-1',
      bundle_title: items.map((i) => `${i.quantity}x ${i.bundleTitle}`).join(' + '),
      selected_editions: editionsFlat,
      addons: addonsFlat,
      shipping_method: shippingMethod,
      promo_code: appliedPromo,
      currency,
      subtotal: Number(subtotalUsd.toFixed(2)),
      discount_amount: Number(promoDiscountUsd.toFixed(2)),
      shipping_cost: Number(shippingUsd.toFixed(2)),
      total_amount: Number(totalUsd.toFixed(2)),
      payment_method:
        paymentMethod === 'card'
          ? `Card ending ${cardNumber.replace(/\D/g, '').slice(-4) || '****'}`
          : paymentMethod === 'apple-pay'
          ? 'Apple Pay'
          : 'Google Pay',
      status: 'Order Confirmed',
    });

    setSubmitting(false);
    setConfirmedOrder(result.order);
    onOrderCompleted(result.order);
    setStep('confirmed');
  };

  const resetAndClose = () => {
    setStep(1);
    setConfirmedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={resetAndClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Checkout"
        className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#1D4ED8]" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold uppercase text-[#111111]">
              {step === 'confirmed' ? 'Order Confirmed' : 'Mist & Turf Checkout'}
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F8FAFC]"
            aria-label="Close checkout"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        {step !== 'confirmed' && (
          <div className="grid grid-cols-3 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-2.5 text-xs font-bold">
            {[
              { num: 1, label: '1. Shipping' },
              { num: 2, label: '2. Delivery & Promo' },
              { num: 3, label: '3. Payment' },
            ].map((s) => {
              const active = step === s.num;
              const done = typeof step === 'number' && step > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-1.5 ${
                    active ? 'text-[#1D4ED8]' : done ? 'text-[#111111]' : 'text-slate-400'
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5 text-[#1D4ED8]" />}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111111]">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fan@example.com"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111]">Country *</label>
                  <select
                    value={countryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111]">Phone Number *</label>
                  <div className="mt-1 flex gap-1.5">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      aria-label="Country dial code"
                      className="w-24 rounded-lg border border-[#E5E7EB] bg-white px-2 py-2.5 text-xs font-semibold"
                    >
                      {Array.from(new Set(COUNTRIES.map((c) => c.dialCode))).map((dc) => (
                        <option key={dc} value={dc}>
                          {dc}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="555 014 8821"
                      className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111]">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Cole"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111]">Street Address *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="14 Highbury Grove"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111]">
                  Apartment / Suite (Optional)
                </label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="Apt 4B"
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111]">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="London"
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111]">
                    {selectedCountry.stateLabel}
                  </label>
                  <input
                    type="text"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder={selectedCountry.stateLabel}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111]">
                    {selectedCountry.postalLabel} *
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={selectedCountry.postalLabel}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  Select Worldwide Shipping Method
                </h3>
                <div className="mt-2.5 space-y-2.5">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3.5 ${
                      shippingMethod === 'standard'
                        ? 'border-[#1D4ED8] bg-blue-50/40'
                        : 'border-[#E5E7EB]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-[#1D4ED8]" />
                      <div>
                        <div className="text-sm font-bold text-[#111111]">
                          Free Worldwide Tracked Shipping
                        </div>
                        <div className="text-xs text-slate-500">
                          7–12 business days · Foam-cushioned gift box
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-[#1D4ED8]">FREE</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3.5 ${
                      shippingMethod === 'express'
                        ? 'border-[#1D4ED8] bg-blue-50/40'
                        : 'border-[#E5E7EB]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-[#F59E0B]" />
                      <div>
                        <div className="text-sm font-bold text-[#111111]">
                          Express Priority Air
                        </div>
                        <div className="text-xs text-slate-500">
                          4–7 business days · Priority dispatch &amp; insured transit
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-[#111111] tabular-nums">
                      {formatCurrency(EXPRESS_SHIPPING_USD, currency)}
                    </span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  <Tag className="h-3.5 w-3.5 text-[#1D4ED8]" />
                  <span>Promo Code (Try TURF10)</span>
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="TURF10"
                    className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm uppercase focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="rounded-lg bg-[#111111] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoFeedback && (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      appliedPromo ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {promoFeedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  Payment Method
                </h3>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'apple-pay', label: 'Apple Pay', icon: Smartphone },
                    { id: 'google-pay', label: 'Google Pay', icon: Smartphone },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id as typeof paymentMethod)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 text-xs font-bold cursor-pointer ${
                          active
                            ? 'border-[#1D4ED8] bg-blue-50/40 text-[#1D4ED8]'
                            : 'border-[#E5E7EB] bg-white text-[#111111]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111]">Card Number *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#111111]">Expiry *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#111111]">CVC *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111]">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={fullName || 'Jordan Cole'}
                      className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-xs text-slate-600">
                  Express checkout selected ({paymentMethod === 'apple-pay' ? 'Apple Pay' : 'Google Pay'}).
                  Click <strong>Complete Order</strong> below to authorize and generate your
                  tracking code.
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-2 text-xs">
                <div className="font-extrabold uppercase tracking-wider text-[#111111]">
                  Order Summary
                </div>
                {items.map((item) => (
                  <div key={item.cartKey} className="flex justify-between text-slate-700">
                    <span>
                      {item.quantity}x {item.bundleTitle} ({item.editions.map((e) => e.name).join(', ')})
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(item.unitPriceUsd * item.quantity, currency)}
                    </span>
                  </div>
                ))}
                {promoDiscountUsd > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Promo ({appliedPromo})</span>
                    <span className="tabular-nums">-{formatCurrency(promoDiscountUsd, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping ({shippingMethod === 'express' ? 'Express Air' : 'Worldwide Tracked'})</span>
                  <span className="tabular-nums">
                    {shippingUsd === 0 ? 'FREE' : formatCurrency(shippingUsd, currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E5E7EB] pt-2 text-sm font-extrabold text-[#111111]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(totalUsd, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'confirmed' && confirmedOrder && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase text-[#111111]">
                Thank You For Your Order!
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Your hand-painted resin edition is queued for inspection &amp; packing.
              </p>

              <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Your Tracking Number
                </div>
                <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-extrabold text-[#1D4ED8]">
                  {confirmedOrder.tracking_number}
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  Total Paid:{' '}
                  <strong className="text-[#111111]">
                    {formatCurrency(confirmedOrder.total_amount, currency)}
                  </strong>{' '}
                  · Destination: {confirmedOrder.destination_city},{' '}
                  {confirmedOrder.destination_country}
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const tn = confirmedOrder.tracking_number;
                    resetAndClose();
                    onJumpToTrack(tn);
                  }}
                  className="flex-1 rounded-xl bg-[#111111] px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  Track This Order Now
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold text-[#111111] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 'confirmed' && (
          <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-5 py-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs sm:text-sm font-bold text-[#111111] hover:bg-slate-50 cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <div className="text-xs font-bold text-[#111111] tabular-nums">
                Total: {formatCurrency(totalUsd, currency)}
              </div>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] cursor-pointer"
              >
                Continue to Delivery →
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep(3);
                }}
                className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] cursor-pointer"
              >
                Continue to Payment →
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteOrder}
                className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-extrabold text-[#111111] hover:bg-[#D97706] disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Processing...' : `Complete Order (${formatCurrency(totalUsd, currency)})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
