"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { InlineError } from "../../../../components/inline-error";
import {
  getResponseErrorMessage,
  toUserErrorMessage,
} from "../../../../lib/errors";

type Location = {
  id: string;
  name: string;
  address: string;
};

type LocationListResponse = {
  data: Location[];
  total: number;
};

type PricingBreakdown = {
  vehicleId: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  durationDays: number;
  basePrice: number;
  depositPercentage: number;
  depositAmount: number;
  totalPrice: number;
  currency: string;
};

type Booking = {
  id: string;
};

type PaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  bookingId: string;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function CheckoutForm({
  bookingId,
  onPaid,
}: {
  bookingId: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet");
      return;
    }

    setLoading(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation/${bookingId}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message ?? "Payment failed");
        return;
      }

      onPaid();
      router.push(`/confirmation/${bookingId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || !elements || loading}>
        Pay deposit
      </button>
      <InlineError message={error} />
    </form>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get("vehicleId") ?? "";

  const [locations, setLocations] = useState<Location[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [returnLocationId, setReturnLocationId] = useState("");

  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/locations?limit=100&offset=0`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load locations");
        return r.json();
      })
      .then((raw: LocationListResponse | Location[]) => {
        if (cancelled) return;
        const data = Array.isArray(raw) ? raw : raw.data;
        setLocations(data);
        const first = data?.[0];
        if (first) {
          setPickupLocationId((p) => p || first.id);
          setReturnLocationId((p) => p || first.id);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load locations");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canCalculate = useMemo(() => {
    return Boolean(vehicleId && startDateTime && endDateTime);
  }, [vehicleId, startDateTime, endDateTime]);

  async function calculate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/pricing/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          startDate: startDateTime,
          endDate: endDateTime,
          locationId: pickupLocationId || undefined,
        }),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Pricing failed");
        throw new Error(message);
      }

      const data = (await res.json()) as PricingBreakdown;
      setPricing(data);
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Pricing failed"));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setError(null);
    if (!pricing) {
      setError("Please calculate pricing first");
      return;
    }

    if (!guestPhone) {
      setError("Guest phone is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName || undefined,
          guestPhone,
          guestEmail: guestEmail || undefined,
          vehicleId,
          startDateTime,
          endDateTime,
          pickupLocationId,
          returnLocationId,
          totalPrice: pricing.totalPrice,
          depositAmount: pricing.depositAmount,
        }),
      });

      if (!res.ok) {
        const message = await getResponseErrorMessage(res, "Booking failed");
        throw new Error(message);
      }

      const booking = (await res.json()) as Booking;

      const depositCents = Math.round(pricing.depositAmount * 100);
      const intentRes = await fetch(`/api/public/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: depositCents,
          email: guestEmail || undefined,
        }),
      });

      if (!intentRes.ok) {
        const message = await getResponseErrorMessage(
          intentRes,
          "Payment intent failed",
        );
        throw new Error(message);
      }

      const intent = (await intentRes.json()) as PaymentIntentResponse;
      setBookingId(booking.id);
      setClientSecret(intent.clientSecret);
      setPaymentIntentId(intent.paymentIntentId);
    } catch (e: unknown) {
      setError(toUserErrorMessage(e, "Booking failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>New booking</h1>

      {!vehicleId ? (
        <p style={{ opacity: 0.8 }}>
          Missing vehicleId. Go back to <a href="/vehicles">vehicles</a>.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Guest name (optional)</span>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Guest phone (required)</span>
          <input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Guest email (optional)</span>
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Start date/time (ISO)</span>
          <input
            placeholder="2026-02-01T10:00:00Z"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>End date/time (ISO)</span>
          <input
            placeholder="2026-02-05T10:00:00Z"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Pickup location</span>
          <select
            value={pickupLocationId}
            onChange={(e) => setPickupLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Return location</span>
          <select
            value={returnLocationId}
            onChange={(e) => setReturnLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={calculate}
            disabled={!canCalculate || loading}
          >
            Calculate pricing
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!pricing || loading || Boolean(clientSecret)}
          >
            Create booking
          </button>
        </div>

        {pricing ? (
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div>
              Total: {pricing.totalPrice} {pricing.currency}
            </div>
            <div>
              Deposit ({pricing.depositPercentage}%): {pricing.depositAmount}{" "}
              {pricing.currency}
            </div>
          </div>
        ) : null}

        {clientSecret ? (
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pay deposit</h2>

            {!stripePromise ? (
              <InlineError message="Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" />
            ) : (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <CheckoutForm
                  bookingId={bookingId ?? ""}
                  onPaid={() => {
                    // No-op: webhook will finalize status on backend
                    void paymentIntentId;
                  }}
                />
              </Elements>
            )}
          </div>
        ) : null}

        <InlineError message={error} />
      </div>
    </main>
  );
}
