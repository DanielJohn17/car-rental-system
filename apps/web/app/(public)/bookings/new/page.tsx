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
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import {
  addMinutes,
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  setHours,
  startOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { InlineError } from "@/components/inline-error";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getResponseErrorMessage, toUserErrorMessage } from "@/lib/errors";
import { useLocations } from "@/lib/queries/locations";
import { cn } from "@/lib/utils";

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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await getResponseErrorMessage(res, "Request failed");
    throw new Error(message);
  }

  return (await res.json()) as T;
}

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
    <form onSubmit={onSubmit} className="grid gap-3">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || !elements || loading}>
        {loading ? "Processing..." : "Pay deposit"}
      </Button>
      <InlineError message={error} />
    </form>
  );
}

export default function NewBookingPage() {
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get("vehicleId") ?? "";

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [returnLocationId, setReturnLocationId] = useState("");

  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locationParams = useMemo(() => ({ limit: 100, offset: 0 }), []);
  const locationsQuery = useLocations(locationParams);

  const locations = useMemo(() => {
    const raw = locationsQuery.data;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.data;
  }, [locationsQuery.data]);

  useEffect(() => {
    const first = locations?.[0];
    if (!first) return;
    setPickupLocationId((p) => p || first.id);
    setReturnLocationId((p) => p || first.id);
  }, [locations]);

  const locationsError = useMemo(() => {
    if (!locationsQuery.error) return null;
    return toUserErrorMessage(locationsQuery.error, "Failed to load locations");
  }, [locationsQuery.error]);

  const canCalculate = useMemo(() => {
    return Boolean(vehicleId && dateRange?.from && dateRange?.to);
  }, [vehicleId, dateRange?.from, dateRange?.to]);

  const dateValidationError = useMemo(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !to) return null;

    const today = startOfDay(new Date());
    if (isBefore(startOfDay(from), today)) {
      return "Start date cannot be in the past";
    }
    if (!isAfter(startOfDay(to), startOfDay(from))) {
      return "End date must be after start date";
    }

    const maxEnd = addMonths(startOfDay(from), 4);
    if (isAfter(startOfDay(to), maxEnd)) {
      return "Rental duration cannot exceed 4 months";
    }

    return null;
  }, [dateRange?.from, dateRange?.to]);

  const startDateTime = useMemo(() => {
    if (!dateRange?.from) return "";

    const now = new Date();
    const candidate = setHours(startOfDay(dateRange.from), 10);
    const resolved = isSameDay(dateRange.from, now) && isBefore(candidate, now)
      ? addMinutes(now, 5)
      : candidate;
    return resolved.toISOString();
  }, [dateRange?.from]);

  const endDateTime = useMemo(() => {
    if (!dateRange?.to) return "";
    const candidate = setHours(startOfDay(dateRange.to), 10);
    return candidate.toISOString();
  }, [dateRange?.to]);

  useEffect(() => {
    setPricing(null);
    setBookingId(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  }, [dateRange?.from, dateRange?.to]);

  const pricingMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      startDate: string;
      endDate: string;
      locationId?: string;
    }) => postJson<PricingBreakdown>("/api/public/pricing/calculate", input),
    onSuccess: (data) => {
      setPricing(data);
    },
    onError: (e: unknown) => {
      setError(toUserErrorMessage(e, "Pricing failed"));
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (input: {
      guestName?: string;
      guestPhone: string;
      guestEmail?: string;
      vehicleId: string;
      startDateTime: string;
      endDateTime: string;
      pickupLocationId: string;
      returnLocationId: string;
      totalPrice: number;
      depositAmount: number;
    }) => {
      const booking = await postJson<Booking>("/api/public/bookings", input);
      const depositCents = Math.round(input.depositAmount * 100);
      const intent = await postJson<PaymentIntentResponse>(
        "/api/public/payments/create-intent",
        {
          bookingId: booking.id,
          amount: depositCents,
          email: input.guestEmail || undefined,
        },
      );

      return {
        bookingId: booking.id,
        clientSecret: intent.clientSecret,
        paymentIntentId: intent.paymentIntentId,
      };
    },
    onSuccess: (data) => {
      setBookingId(data.bookingId);
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    },
    onError: (e: unknown) => {
      setError(toUserErrorMessage(e, "Booking failed"));
    },
  });

  const loading = pricingMutation.isPending || bookingMutation.isPending;

  async function calculate() {
    setError(null);
    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    try {
      await pricingMutation.mutateAsync({
        vehicleId,
        startDate: startDateTime,
        endDate: endDateTime,
        locationId: pickupLocationId || undefined,
      });
    } catch (e: unknown) {
      if (!pricingMutation.isError) {
        setError(toUserErrorMessage(e, "Pricing failed"));
      }
    }
  }

  async function submit() {
    setError(null);
    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    if (!pricing) {
      setError("Please calculate pricing first");
      return;
    }

    if (!guestPhone) {
      setError("Guest phone is required");
      return;
    }

    try {
      await bookingMutation.mutateAsync({
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
      });
    } catch (e: unknown) {
      if (!bookingMutation.isError) {
        setError(toUserErrorMessage(e, "Booking failed"));
      }
    }
  }

  return (
    <div>
      <SiteHeader />
      <PageContainer className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">New booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the booking details, calculate pricing, then pay the deposit.
          </p>
        </div>

        {!vehicleId ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <div className="text-lg font-medium">No vehicle selected</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a vehicle first to create a booking.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <Link href="/vehicles">Browse vehicles</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guest details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="guestName">Guest name (optional)</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guestPhone">Guest phone (required)</Label>
                    <Input
                      id="guestPhone"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guestEmail">Guest email (optional)</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Rental dates</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange?.from && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                            ) : (
                              format(dateRange.from, "PPP")
                            )
                          ) : (
                            <span>Select dates</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          numberOfMonths={2}
                          selected={dateRange}
                          onSelect={(range: DateRange | undefined) =>
                            setDateRange(range)
                          }
                          disabled={(date: Date) => {
                            const day = startOfDay(date);
                            const today = startOfDay(new Date());
                            if (isBefore(day, today)) return true;
                            if (dateRange?.from) {
                              const from = startOfDay(dateRange.from);
                              const maxEnd = addMonths(from, 4);
                              if (isAfter(day, maxEnd)) return true;
                            }
                            return false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <InlineError message={dateValidationError} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pickupLocationId">Pickup location</Label>
                    <Select
                      value={pickupLocationId}
                      onValueChange={(value: string) => setPickupLocationId(value)}
                    >
                      <SelectTrigger id="pickupLocationId">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="returnLocationId">Return location</Label>
                    <Select
                      value={returnLocationId}
                      onValueChange={(value: string) => setReturnLocationId(value)}
                    >
                      <SelectTrigger id="returnLocationId">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={calculate} disabled={!canCalculate || loading}>
                    {loading ? "Calculating..." : "Calculate pricing"}
                  </Button>
                  <Button type="button" onClick={submit} disabled={!pricing || loading || Boolean(clientSecret)}>
                    {loading ? "Working..." : "Create booking"}
                  </Button>
                </div>

                <InlineError message={error ?? locationsError} className="mt-4" />
              </CardContent>
            </Card>

            {pricing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Total:</span>{" "}
                    {pricing.totalPrice} {pricing.currency}
                  </div>
                  <div className="mt-1">
                    <span className="font-medium text-foreground">Deposit</span> ({pricing.depositPercentage}%):{" "}
                    {pricing.depositAmount} {pricing.currency}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {clientSecret ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pay deposit</CardTitle>
                </CardHeader>
                <CardContent>
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
                          void paymentIntentId;
                        }}
                      />
                    </Elements>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
