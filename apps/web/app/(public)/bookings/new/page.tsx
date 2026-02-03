"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import {
  addMinutes,
  addDays,
  addMonths,
  format,
  differenceInCalendarDays,
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

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
};

type Booking = {
  id: string;
};

type CheckoutSessionResponse = {
  url: string;
  sessionId: string;
  paymentIntentId: string;
  bookingId: string;
};

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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const message = await getResponseErrorMessage(res, "Request failed");
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export default function NewBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const vehicleId = searchParams.get("vehicleId") ?? "";

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [days, setDays] = useState<string>("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [returnLocationId, setReturnLocationId] = useState("");

  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
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

  const vehicleQuery = useQuery({
    queryKey: ["public-vehicle", vehicleId],
    queryFn: () => getJson<Vehicle>(`/api/public/vehicles/${vehicleId}`),
    enabled: Boolean(vehicleId),
    staleTime: 60 * 1000,
  });

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
    setCheckoutUrl(null);
  }, [dateRange?.from, dateRange?.to]);

  useEffect(() => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (!from || !to) {
      setDays("");
      return;
    }

    const d = differenceInCalendarDays(startOfDay(to), startOfDay(from));
    setDays(String(Math.max(0, d)));
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

      const session = await postJson<CheckoutSessionResponse>(
        "/api/public/payments/create-checkout-session",
        {
          bookingId: booking.id,
          amount: depositCents,
          email: input.guestEmail || undefined,
        },
      );

      return session;
    },
    onSuccess: (data) => {
      setBookingId(data.bookingId);
      setCheckoutUrl(data.url);
      window.location.assign(data.url);
    },
    onError: (e: unknown) => {
      setError(toUserErrorMessage(e, "Booking failed"));
    },
  });

  const loading = pricingMutation.isPending || bookingMutation.isPending;

  useEffect(() => {
    if (!canCalculate) return;
    if (dateValidationError) return;

    const timeout = setTimeout(() => {
      pricingMutation.mutate({
        vehicleId,
        startDate: startDateTime,
        endDate: endDateTime,
        locationId: pickupLocationId || undefined,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    canCalculate,
    dateValidationError,
    endDateTime,
    pickupLocationId,
    startDateTime,
    vehicleId,
    pricingMutation,
  ]);

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
          {vehicleQuery.data ? (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Vehicle rate:</span>{" "}
              ${vehicleQuery.data.dailyRate}/day
            </div>
          ) : null}
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
                    <Label htmlFor="days">Days</Label>
                    <Input
                      id="days"
                      inputMode="numeric"
                      value={days}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDays(raw);

                        const from = dateRange?.from;
                        const parsed = Number(raw);
                        if (!from || !Number.isFinite(parsed) || parsed <= 0) {
                          return;
                        }

                        const nextTo = addDays(startOfDay(from), parsed);
                        setDateRange({ from, to: nextTo });
                      }}
                      placeholder="e.g. 3"
                    />
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
                  <Button type="button" onClick={submit} disabled={!pricing || loading || Boolean(checkoutUrl)}>
                    {loading ? "Working..." : "Pay deposit"}
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

            {checkoutUrl ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Redirecting to Stripe</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div>
                    If you are not redirected automatically, use the link below.
                  </div>
                  <div className="mt-3">
                    <Button asChild variant="outline">
                      <a href={checkoutUrl}>Continue to payment</a>
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (bookingId) {
                          router.push(`/confirmation/${bookingId}`);
                        }
                      }}
                    >
                      I already paid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
